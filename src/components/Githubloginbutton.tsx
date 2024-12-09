import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGlobalState } from '@/hooks/useGlobalState';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Github } from 'lucide-react';
import { ReactNode } from 'react';
import { BUILDER_BACKEND } from '@/lib/utils';

import { Octokit } from '@octokit/rest';
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string;

export async function initiateGitHubAuth() {
    const BASE_URL = import.meta.env.VITE_ENV === 'test' ? 'http://localhost:3000' : "https://arlink.arweave.net";

    const redirectUri = encodeURIComponent(`${BASE_URL}/deploy`);
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo`;
    window.location.href = authUrl;
}

export async function handleGitHubCallback(code: string): Promise<string> {
    const tokenUrl = `${BUILDER_BACKEND}/github/callback`;
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error_description || 'Failed to obtain access token');
    }

    return data.access_token;
}

export function createOctokit(token: string) {
    return new Octokit({ auth: token });
}
// Add this new function to check GitHub app installation
async function checkAndInstallGitHubApp(token: string) {
  try {
    // TODO: Change this builder backend import to the new one
    const response = await fetch(`${BUILDER_BACKEND}/check-github-app`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
   
    if (!data.installed) {
      // If the app is not installed, open the installation page
      window.location.href = 'https://github.com/apps/arlinkapp/installations/new';
    }
  } catch (error) {
    console.error('Error checking GitHub app installation:', error);
  }
}

interface GitHubLoginButtonProps {
    onSuccess: () => void;
    className?: string;
    children?: ReactNode;
}

export function GitHubLoginButton({ onSuccess, className, children }: GitHubLoginButtonProps) {
    const { githubToken, setGithubToken } = useGlobalState();
    const [searchParams] = useSearchParams();
    const [isProcessingAuth, setIsProcessingAuth] = useState(false);
    
    useEffect(() => {
        const code = searchParams.get('code');
        
        if (code && !isProcessingAuth && !githubToken) {
            setIsProcessingAuth(true);
            
            // Prevent navigation/reload
            if (window.history && window.history.replaceState) {
                window.history.replaceState(
                    null,
                    '',
                    window.location.pathname
                );
            }
            
            handleGitHubCallback(code)
                .then(token => {
                    console.log("Got token:", token);
                    setGithubToken(token);
                    return checkAndInstallGitHubApp(token);
                })
                .then(() => {
                    onSuccess();
                })
                .catch(error => {
                    console.error('GitHub auth error:', error);
                    toast.error('Failed to authenticate with GitHub');
                })
                .finally(() => {
                    setIsProcessingAuth(false);
                });
        }
    }, [searchParams, githubToken, isProcessingAuth, setGithubToken, onSuccess]);

    const handleLogin = async () => {
        if (githubToken) {
            setGithubToken(null);
            toast.success('Logged out from GitHub');
            return;
        }
        
        await initiateGitHubAuth();
    };

    // Don't render anything while processing auth
    if (isProcessingAuth) {
        return null;
    }

    return (
        <Button
            className={className}
            onClick={handleLogin}
            disabled={isProcessingAuth}
        >
            {children}
        </Button>
    );
}