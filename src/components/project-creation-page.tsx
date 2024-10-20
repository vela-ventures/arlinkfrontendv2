import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGlobalState } from '@/hooks/useGlobalState';
import { initiateGitHubAuth, handleGitHubCallback } from '@/lib/github-auth-file';
import { useRouter } from 'next/router';
import { Github } from 'lucide-react';
import { ReactNode } from 'react';
import { BUILDER_BACKEND } from '@/lib/utils';

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
    const router = useRouter();

    useEffect(() => {
        const { code } = router.query;
        if (code && typeof code === 'string') {
            handleGitHubCallback(code).then(token => {
                setGithubToken(token);
                console.log("Token is:", token);
                checkAndInstallGitHubApp(token); // Check and install GitHub app if necessary
                onSuccess();
            }).catch(error => {
                console.error('GitHub auth error:', error);
            });
        }
    }, [router.query, onSuccess, setGithubToken]);

    

    const handleLogin = () => {
        if (githubToken) {
            setGithubToken(null);
        } else {
            
            initiateGitHubAuth();
        }
    };

    return (
        <Button
            className={className}
            onClick={handleLogin} 
        >
            {children || (
                <>
                    <Github className="w-6 h-6" />
                    <span>{githubToken ? 'Logout from GitHub' : 'Import from GitHub'}</span>
                </>
            )}
        </Button>
    );
}