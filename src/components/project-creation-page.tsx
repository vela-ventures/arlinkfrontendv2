import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGlobalState } from '@/hooks/useGlobalState';
import { initiateGitHubAuth, handleGitHubCallback } from '@/lib/github-auth-file';
import { useRouter } from 'next/router';
import { Github } from 'lucide-react';
import axios from 'axios';

interface GitHubLoginButtonProps {
    onSuccess: () => void;
    className?: string;
    children?: React.ReactNode;
}

export function GitHubLoginButton({ onSuccess, className, children }: GitHubLoginButtonProps) {
    const { githubToken, setGithubToken } = useGlobalState();
    const [isAppInstalled, setIsAppInstalled] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const { code } = router.query;
        if (code && typeof code === 'string') {
            handleGitHubCallback(code).then(token => {
                setGithubToken(token);
                checkAppInstallation(token);
            }).catch(error => {
                console.error('GitHub auth error:', error);
            });
        }
    }, [router.query, setGithubToken]);

    const checkAppInstallation = async (token: string) => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BUILDERBACKEND_URL}/check-github-app`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setIsAppInstalled(response.data.installed);
            if (response.data.installed) {
                onSuccess();
            } else {
                initiateAppInstallation();
            }
        } catch (error) {
            console.error('Error checking app installation:', error);
        }
    };

    const initiateAppInstallation = () => {
        const installUrl = `https://github.com/apps/arlinkapp/installations/new`;
        window.location.href = installUrl;
    };

    const handleLogin = () => {
        if (githubToken) {
            checkAppInstallation(githubToken);
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
                    <span>{githubToken ? (isAppInstalled ? 'GitHub Connected' : 'Install GitHub App') : 'Connect GitHub'}</span>
                </>
            )}
        </Button>
    );
}
