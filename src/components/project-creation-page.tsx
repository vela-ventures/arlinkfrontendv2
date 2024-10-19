import React from 'react';
import { Button } from '@/components/ui/button';
import { useGlobalState } from '@/hooks/useGlobalState';
import { initiateGitHubAuth, handleGitHubCallback } from '@/lib/github-auth-file';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Github } from 'lucide-react';
import { ReactNode } from 'react';

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
                onSuccess(); // Call the onSuccess callback instead of direct navigation
            }).catch(error => {
                console.error('GitHub auth error:', error);
            });
        }
    }, [router.query, onSuccess]);

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
