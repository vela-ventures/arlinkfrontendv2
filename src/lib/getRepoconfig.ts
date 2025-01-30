// Move getDefaultConfig before it's used
import { PackageConfig } from "@/types";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit();

interface FrameworkConfig {
    framework: "next" | "vite" | "create-react-app" | "gatsby" | "unknown";
    outputDir: string;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function detectFramework(packageJson: any): FrameworkConfig {
    const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
    };

    // Next.js detection
    if (dependencies.next) {
        return {
            framework: "next",
            outputDir: ".next", // Next.js default build output
        };
    }

    // Vite detection
    if (dependencies.vite) {
        const viteOutputDir = packageJson?.config?.build?.outDir || "./dist";
        return {
            framework: "vite",
            outputDir: viteOutputDir,
        };
    }

    // Create React App detection
    if (dependencies["react-scripts"]) {
        return {
            framework: "create-react-app",
            outputDir: "build", // CRA default build output
        };
    }

    // Gatsby detection
    if (dependencies.gatsby) {
        return {
            framework: "gatsby",
            outputDir: "public", // Gatsby default build output
        };
    }

    // Default case
    return {
        framework: "unknown",
        outputDir: "./dist",
    };
}

export async function getRepoConfig(
    owner: string,
    repo: string,
    path?: string,
): Promise<
    PackageConfig & {
        error: boolean;
        errorType: "server" | "static" | "not-found" | null;
    }
> {
    try {
        const branches = ["main", "master"];
        let packageJson = null;
        let hasIndexHtml = false;
        const packageJsonPath = path ? `${path}/package.json` : "package.json";
        const indexHtmlPath = path ? `${path}/index.html` : "index.html";

        // First try to find package.json
        for (const branch of branches) {
            try {
                const { data } = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: packageJsonPath,
                    ref: branch,
                });
                if ("content" in data) {
                    const content = atob(data.content);
                    packageJson = JSON.parse(content);
                    break;
                }
            } catch (e) {
                console.log(e);
            }
        }

        // If package.json is found, return its config
        if (packageJson) {
            const { framework, outputDir } = detectFramework(packageJson);
            return {
                repoName: repo,
                framework,
                installCommand: packageJson.scripts?.install || "npm install",
                buildCommand: packageJson.scripts?.build || "npm run build",
                outputDir: outputDir,
                error: false,
                errorType: null,
            };
        }

        // If package.json not found, look for index.html
        for (const branch of branches) {
            try {
                const { data } = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: indexHtmlPath,
                    ref: branch,
                });
                if ("content" in data) {
                    hasIndexHtml = true;
                    break;
                }
            } catch (e) {
                console.log(e);
            }
        }

        // If index.html is found, return static site config
        if (hasIndexHtml) {
            return {
                repoName: repo,
                framework: "unknown",
                installCommand: "npm --version",
                buildCommand: "npm --version",
                outputDir: "./",
                error: true,
                errorType: "static",
            };
        }

        // If neither package.json nor index.html is found, return null-like object
        return {
            repoName: repo,
            framework: "unknown",
            installCommand: "",
            buildCommand: "",
            outputDir: "",
            error: true,
            errorType: "not-found",
        };
    } catch (error) {
        console.error(error);
        return {
            repoName: repo,
            framework: "unknown",
            installCommand: "",
            buildCommand: "",
            outputDir: "",
            error: true,
            errorType: "server",
        };
    }
}

export async function getRepoReadme(
    owner: string,
    repo: string,
    path?: string,
): Promise<{
    content: string | null;
    error: boolean;
    errorType: "server" | "not-found" | null;
}> {
    try {
        const branches = ["main", "master"];
        const readmePath = path ? `${path}/README.md` : "README.md";

        for (const branch of branches) {
            try {
                const { data } = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: readmePath,
                    ref: branch,
                });

                if ("content" in data) {
                    // GitHub API returns content as base64 encoded
                    const content = atob(data.content);
                    return {
                        content,
                        error: false,
                        errorType: null,
                    };
                }
            } catch (e) {
                console.log(e);
            }
        }

        return {
            content: null,
            error: true,
            errorType: "not-found",
        };
    } catch (error) {
        console.error(error);
        return {
            content: null,
            error: true,
            errorType: "server",
        };
    }
}
