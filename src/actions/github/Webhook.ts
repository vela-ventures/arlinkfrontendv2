import { BUILDER_BACKEND } from "@/lib/utils";
export interface CreateWebhookParams {
    owner: string;
    repo: string;
    accessToken: string;
    webhookSecret: string; // The secret used to secure your webhook
}

export async function createGitHubWebhook({
    owner,
    repo,
    accessToken,
    webhookSecret
}: CreateWebhookParams) {
    try {
        const webhookUrl =`${BUILDER_BACKEND}/github-webhook`;

        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${accessToken}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify({
                name: 'web',
                active: true,
                events: ['push'],
                config: {
                    url: webhookUrl,
                    content_type: 'json',
                    secret: webhookSecret,
                    insecure_ssl: '0'
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to create webhook: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('Webhook created successfully:', data);
        return data;
    } catch (error) {
        console.error('Error creating webhook:', error);
        throw error;
    }
}