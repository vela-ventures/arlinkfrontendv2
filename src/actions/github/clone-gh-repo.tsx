import axios from "axios";

export async function cloneGitHubRepo(
    sourceRepoUrl: string,
    newRepoName: string,
    githubToken: string,
) {
    function arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    try {
        // Validate and parse source URL
        const urlMatch = sourceRepoUrl.match(/github\.com[/:]([^/]+)\/([^/]+)/);
        if (!urlMatch) {
            return {
                success: false,
                error: "Invalid URL",
                message: "Please provide a valid GitHub repository URL",
            };
        }
        const source = `${urlMatch[1]}/${urlMatch[2].replace(/\.git$/, "")}`;

        // Validate parameters
        if (!newRepoName || !githubToken) {
            return {
                success: false,
                error: "Missing parameters",
                message: "Repository name and GitHub token are required",
            };
        }

        // Verify source repository exists
        try {
            await axios.get(`https://api.github.com/repos/${source}`, {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            });
        } catch (error: any) {
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: "Source not found",
                    message:
                        "The source repository doesn't exist or you don't have access",
                };
            }
            throw error;
        }

        // Create target repository
        let newRepo;
        try {
            const createRes = await axios.post(
                "https://api.github.com/user/repos",
                {
                    name: newRepoName,
                    private: false,
                    description: `Cloned from ${source}`,
                },
                {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                },
            );
            newRepo = createRes.data;
        } catch (error: any) {
            if (error.response?.status === 422) {
                return {
                    success: false,
                    error: "Repository exists",
                    message: "A repository with this name already exists",
                };
            }
            throw error;
        }

        // Get user information
        const userRes = await axios.get("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/vnd.github+json",
            },
        });
        const targetOwner = userRes.data.login;

        // Copy contents recursively
        await copyContents(source, newRepoName, targetOwner, githubToken);

        return {
            success: true,
            url: newRepo.html_url,
            message: "Repository cloned successfully",
        };
    } catch (error: any) {
        console.error("Clone error:", error);
        return {
            success: false,
            error: "Cloning failed",
            message: error.response?.data?.message || error.message,
            details: error.response?.data,
        };
    }

    async function copyContents(
        source: string,
        targetRepo: string,
        targetOwner: string,
        token: string,
    ) {
        async function processContents(path = "") {
            const contentsRes = await axios.get(
                `https://api.github.com/repos/${source}/contents/${path}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                },
            );

            for (const item of contentsRes.data) {
                if (item.type === "dir") {
                    await processContents(item.path);
                } else if (item.type === "file") {
                    const fileRes = await axios.get(item.download_url, {
                        responseType: "arraybuffer",
                    });

                    await axios.put(
                        `https://api.github.com/repos/${targetOwner}/${targetRepo}/contents/${item.path}`,
                        {
                            message: `Add ${item.path}`,
                            content: arrayBufferToBase64(fileRes.data),
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                Accept: "application/vnd.github+json",
                                "X-GitHub-Api-Version": "2022-11-28",
                            },
                        },
                    );
                }
            }
        }

        await processContents();
    }
}
