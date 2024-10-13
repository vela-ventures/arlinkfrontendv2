import React from 'react';
import { Button } from '@/components/ui/button';
import { useGlobalState } from '@/hooks/useGlobalState';
import { initiateGitHubAuth, handleGitHubCallback } from '@/lib/github-auth-file';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Token } from 'graphql';

export function GitHubLoginButton() {
    const { githubToken, setGithubToken } = useGlobalState();
    const router = useRouter();

    useEffect(() => {
        const { code } = router.query;
        if (code && typeof code === 'string') {
            handleGitHubCallback(code).then(token => {
                setGithubToken(token);
                console.log("Token is:", token); // Print the token to the console
                router.push('/deploy'); // Redirect to deploy page after successful login
            }).catch(error => {
                console.error('GitHub auth error:', error);
                // Handle error (e.g., show error message to user)
            });
        }
    }, [router.query]);

    const handleLogin = () => {
        if (githubToken) {
            setGithubToken(null); // Logout
        } else {
            initiateGitHubAuth(); // Start the GitHub authentication process
        }
    };

    return (
        <Button onClick={handleLogin}>
            {githubToken ? 'Logout from GitHub' : 'Connect GitHub'}
        </Button>
    );
}