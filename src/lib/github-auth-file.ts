import { Octokit } from '@octokit/rest';
import { BUILDER_BACKEND } from './utils';
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID as string;


export async function initiateGitHubAuth() {
    const BASE_URL = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : "https://vmi1968527.contaboserver.net";


    const redirectUri = encodeURIComponent(`${BASE_URL}/deploy`);
    const authUrl = `https://github.com/apps/arlinkapp/installations/select_target`;
    window.location.href = authUrl;
}

export async function handleGitHubCallback(code: string): Promise<string> {
    const tokenUrl = `${BUILDER_BACKEND}/github/callback`; // Use the API route to exchange the code for a token
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
