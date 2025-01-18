// Move getDefaultConfig before it's used
import { PackageConfig } from "@/types";
import { Octokit } from "@octokit/rest";

function getDefaultConfig(repoName: string): PackageConfig {
    return {
        framework: "unknown",
        repoName: repoName,
        installCommand: "npm --version",
        buildCommand: "npm --version",
        outputDir: "./",
    };
}
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
    PackageConfig & { error: boolean; errorType: "server" | "static" | null }
> {
    try {
        const branches = ["main", "master"];
        let packageJson = null;
        const fullPath = path ? `${path}/package.json` : "package.json";

        for (const branch of branches) {
            try {
                const { data } = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: fullPath,
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

        return {
            repoName: repo,
            framework: "unknown",
            installCommand: "npm --version",
            buildCommand: "npm --version",
            outputDir: "./",
            error: true,
            errorType: "static",
        };
    } catch (error) {
        console.error(error);
        return {
            repoName: repo,
            framework: "unknown",
            installCommand: "npm install",
            buildCommand: "npm run build",
            outputDir: "./",
            error: true,
            errorType: "server",
        };
    }
}
