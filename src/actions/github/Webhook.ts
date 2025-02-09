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

export async function deleteGitHubWebhook({
    owner,
    repo,
    accessToken
}: Omit<CreateWebhookParams, 'webhookSecret'>) {
    try {
        // This only lists webhooks for the specified owner/repo combination
        const listResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${accessToken}`,
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!listResponse.ok) {
            const errorData = await listResponse.json();
            throw new Error(`Failed to list webhooks: ${JSON.stringify(errorData)}`);
        }

        const hooks = await listResponse.json();
        const webhookUrl = `${BUILDER_BACKEND}/github-webhook`;
        const webhook = hooks.find((hook: any) => hook.config.url === webhookUrl);

        if (!webhook) {
            throw new Error(`No webhook found for ${owner}/${repo}`);
        }

        // Delete the specific webhook for this repo
        const deleteResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/hooks/${webhook.id}`,
            {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${accessToken}`,
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        );

        if (!deleteResponse.ok) {
            const errorData = await deleteResponse.text();
            throw new Error(`Failed to delete webhook: ${errorData}`);
        }

        console.log(`Webhook deleted successfully for ${owner}/${repo}`);
        return true;
    } catch (error) {
        console.error('Error deleting webhook:', error);
        throw error;
    }
}