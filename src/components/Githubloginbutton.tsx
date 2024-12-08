import  { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGlobalState } from '@/hooks/useGlobalState';
import { Github } from 'lucide-react';
import { ReactNode } from 'react';
import { BUILDER_BACKEND } from '@/lib/utils';
import { Octokit } from '@octokit/rest';
import { useLocation, useSearchParams } from 'react-router-dom';

const GITHUB_CLIENT_ID = 'Iv23linjZLxHZeHfSgqB';
// GitHub auth functions
async function initiateGitHubAuth(): Promise<void> {
    const BASE_URL = import.meta.env.VITE_ENV === 'test' ? 'http://localhost:3000' : "https://arlink.arweave.net";

    const redirectUri = encodeURIComponent(`${BASE_URL}/deploy`);
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo`;
    window.location.href = authUrl;
}

async function handleGitHubCallback(code: string): Promise<string> {
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
//@ts-ignore
function createOctokit(token: string): Octokit {
    return new Octokit({ auth: token });
}

// GitHub app installation check function
async function checkAndInstallGitHubApp(token: string): Promise<void> {
    try {
        const response = await fetch(`${BUILDER_BACKEND}/check-github-app`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
       
        if (!data.installed) {
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
    const location = useLocation();

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            handleGitHubCallback(code).then((token: string) => {
                setGithubToken(token);
                console.log("Token is:", token);
                checkAndInstallGitHubApp(token);
                onSuccess();
            }).catch((error: Error) => {
                console.error('GitHub auth error:', error);
            });
        }
    }, [location, onSuccess, setGithubToken, searchParams]);

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