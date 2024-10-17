import { Octokit } from '@octokit/rest';
import { createOAuthAppAuth } from "@octokit/auth-oauth-app";

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID as string;
const GITHUB_CLIENT_SECRET = process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET as string;
//console.log("git clid is",GITHUB_CLIENT_ID)

export async function initiateGitHubAuth() {
    const redirectUri = encodeURIComponent('https://vmi1968527.contaboserver.net/deploy'); // Your redirect URI
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo`;
    window.location.href = authUrl;
}

export async function handleGitHubCallback(code: string): Promise<string> {
    const tokenUrl = '/ssr/github/callback'; // Use the API route to exchange the code for a token
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