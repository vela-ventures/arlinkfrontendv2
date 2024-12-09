import { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGlobalState } from '@/hooks/useGlobalState';
import { Github } from 'lucide-react';
import { ReactNode } from 'react';
import { BUILDER_BACKEND } from '@/lib/utils';
import { Octokit } from '@octokit/rest';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Constants and Types
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const AUTH_STATE_KEY = 'github_oauth_state';
const PREVIOUS_PATH_KEY = 'previous_path';

interface GitHubLoginButtonProps {
    onSuccess: () => void;
    className?: string;
    children?: ReactNode;
}

interface GitHubAuthResponse {
    access_token?: string;
    error?: string;
    error_description?: string;
}

// GitHub auth functions
// Constants

const BASE_URL = import.meta.env.VITE_ENV === 'test' 
    ? 'http://localhost:3000' 
    : 'https://arlink.arweave.net'; // Hardcoded for GitHub App configuration

const initiateGitHubAuth = async (): Promise<void> => {
    try {
        // Generate and store state for CSRF protection
        const state = crypto.randomUUID();
        sessionStorage.setItem(AUTH_STATE_KEY, state);
        sessionStorage.setItem(PREVIOUS_PATH_KEY, window.location.pathname);

        const params = new URLSearchParams({
            client_id: GITHUB_CLIENT_ID,
            redirect_uri: `${BASE_URL}/deploy`, // This must match GitHub App settings
            scope: 'repo',
            state: state
        });

        window.location.href = `https://github.com/login/oauth/authorize?${params}`;
    } catch (error) {
        console.error('Failed to initiate GitHub auth:', error);
        toast.error('Failed to start GitHub authentication');
        throw error;
    }
};

const handleGitHubCallback = async (code: string): Promise<string> => {
    try {
        // IMPORTANT: Prevent the redirect/reload immediately
        if (window.history && window.history.replaceState) {
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
        
        const response = await fetch(`${BUILDER_BACKEND}/github/callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: GitHubAuthResponse = await response.json();
        
        if (data.error || !data.access_token) {
            throw new Error(data.error_description || 'Failed to obtain access token');
        }

        return data.access_token;
    } catch (error) {
        console.error('GitHub callback error:', error);
        throw error;
    }
};

const checkAndInstallGitHubApp = async (token: string): Promise<boolean> => {
    try {
        const response = await fetch(`${BUILDER_BACKEND}/check-github-app`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
       
        if (!data.installed) {
            window.location.href = 'https://github.com/apps/arlinkapp/installations/new';
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking GitHub app installation:', error);
        toast.error('Failed to verify GitHub app installation');
        throw error;
    }
};

export function GitHubLoginButton({ onSuccess, className, children }: GitHubLoginButtonProps) {
    const { githubToken, setGithubToken } = useGlobalState();
    const [searchParams] = useSearchParams();
    const [isProcessingAuth, setIsProcessingAuth] = useState(false);

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const savedState = sessionStorage.getItem('github_oauth_state');

        // Only process if we have a code and aren't already processing
        if (code && state === savedState && !isProcessingAuth && !githubToken) {
            setIsProcessingAuth(true);
            
            // IMPORTANT: Prevent the redirect/reload immediately
            if (window.history && window.history.replaceState) {
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname
                );
            }
            
            handleGitHubCallback(code)
                .then((token: string) => {
                    setGithubToken(token);
                    return checkAndInstallGitHubApp(token);
                })
                .then(() => {
                    onSuccess();
                })
                .catch((error) => {
                    console.error('GitHub auth error:', error);
                    toast.error('Failed to authenticate with GitHub');
                })
                .finally(() => {
                    setIsProcessingAuth(false);
                    sessionStorage.removeItem('github_oauth_state');
                });
        }
    }, [searchParams, setGithubToken, onSuccess, isProcessingAuth, githubToken]);

    const handleLogin = async () => {
        try {
            if (githubToken) {
                setGithubToken(null);
                sessionStorage.removeItem(AUTH_STATE_KEY);
                toast.success('Logged out from GitHub');
            } else {
                await initiateGitHubAuth();
            }
        } catch (error) {
            console.error('Login action failed:', error);
            toast.error('Failed to process GitHub login');
        }
    };

    // Don't render the button if we're handling the callback
    if (searchParams.get('code')) {
        return null;
    }

    return (
        <Button
            className={className}
            onClick={handleLogin}
            disabled={searchParams.get('code') !== null}
        >
            {children || (
                <>
                    <Github className="w-6 h-6 mr-2" />
                    <span>{githubToken ? 'Logout from GitHub' : 'Import from GitHub'}</span>
                </>
            )}
        </Button>
    );
}