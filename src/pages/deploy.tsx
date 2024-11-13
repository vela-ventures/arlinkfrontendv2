import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGlobalState } from "@/hooks";
import { runLua } from "@/lib/ao-vars";
import { useRouter } from "next/router";
import { SetStateAction, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import Arweave from "arweave";
import { Loader } from "lucide-react";
import axios from 'axios';
import { useActiveAddress } from 'arweave-wallet-kit'; 
import Ansi from "@agbishop/react-ansi-18";
import { BUILDER_BACKEND } from "@/lib/utils";
import useDeploymentManager from "@/hooks/useDeploymentManager";
import { GitHubLoginButton } from '@/components/project-creation-page';
import { getWalletOwnedNames } from '@/lib/get-arns';
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Globe, Github } from "lucide-react";
import { Octokit } from "@octokit/rest";
import { Switch } from "@/components/ui/switch"; // Add this import
import { setArnsName } from "@/lib/ao-vars";
import { getRepoConfig } from "@/lib/getRepoconfig";


// Add this interface near the top of the file, after the imports
interface Repository {
  id: number;
  full_name: string;
  html_url: string;
  // Add other properties as needed
}

function extractRepoName(url: string): string {
    return url.replace(/\.git|\/$/, '').split('/').pop() as string;
}

function extractOwnerName(url: string): string {
    return url.split("/").reverse()[1];
}

// Define a custom type for Axios errors
type AxiosErrorType = {
    isAxiosError: boolean;
    response?: {
      status: number;
    };
  };

// Update the type guard function
function isAxiosError(error: any): error is AxiosErrorType {
  return error && error.isAxiosError === true;
}

function Logs({ name, deploying, repoUrl }: { name: string, deploying?: boolean, repoUrl: string }) {
    console.log(name);
    const [output, setOutput] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!name || !repoUrl) return;
        const repo = extractRepoName(repoUrl);
        const owner = extractOwnerName(repoUrl);
        let startTime = Date.now();
        const waitTime = 600000; // 10 minute in milliseconds

        const interval: ReturnType<typeof setInterval> = setInterval(async () => {
            if (!deploying) return clearInterval(interval);
            
            try {
                const logs = await axios.get(`${BUILDER_BACKEND}/logs/${owner}/${repo}`);
                console.log(logs.data);
                setOutput((logs.data as string).replaceAll(/\\|\||\-/g, ""));
                setError(null); // Clear any previous errors

                setTimeout(() => {
                    const logsDiv = document.getElementById("logs");
                    logsDiv?.scrollTo({ top: logsDiv.scrollHeight, behavior: "smooth" });
                }, 100);
            } catch (error: unknown) {
                if (isAxiosError(error) && error.response?.status === 404) {
                    const elapsedTime = Date.now() - startTime;
                    if (elapsedTime < waitTime) {
                        setError("Waiting for logs...");
                    } else {
                        setError("Failed to fetch logs after 1 minute. They may not be available yet.");
                        clearInterval(interval);
                    }
                } else {
                    setError("An error occurred while fetching logs.");
                    console.error("Error fetching logs:", error);
                    clearInterval(interval);
                }
            }
        }, 2500);

        return () => { clearInterval(interval); }
    }, [name, deploying, repoUrl]);

    return (
        <div>
            <div className="pl-2 mb-1">Build Logs</div>
            {error ? (
                <div className="text-yellow-500 pl-2 mb-2">{error}</div>
            ) : null}
            <pre className="font-mono text-xs border p-2 rounded-lg px-4 bg-black/30 overflow-scroll max-h-[250px]" id="logs">
                <Ansi log={output} />
            </pre>
        </div>
    );
}

// Add this new function after the existing utility functions
function createTokenizedRepoUrl(repoUrl: string, token: string): string {
    const [, , , username, repo] = repoUrl.split('/');
    return `https://${token}@github.com/${username}/${repo}.git`;
}

export default function Deploy() {
    const globalState = useGlobalState();
    const router = useRouter();
    const { managerProcess, refresh , deployments } = useDeploymentManager();
    const [projName, setProjName] = useState("");
    const [repoUrl, setRepoUrl] = useState("");
    const [installCommand, setInstallCommand] = useState("npm install");
    const [buildCommand, setBuildCommand] = useState("npm run build");
    const [outputDir, setOutputDir] = useState("./dist");
    const [deploying, setDeploying] = useState(false);
    const [arnsProcess, setArnsProcess] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const [branches, setBranches] = useState([""]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [branchError, setBranchError] = useState("");
    const { githubToken, setGithubToken } = useGlobalState();
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [arnsNames, setArnsNames] = useState<{ name: string; processId: string }[]>([]);
    const [loadingArnsNames, setLoadingArnsNames] = useState(false);
    const activeAddress = useActiveAddress(); // Add this line to get the active address
    const [showArnsDropdown, setShowArnsDropdown] = useState(false);
    const [step, setStep] = useState<"initial" | "repository" | "project" | "domain" | "deploy">("initial");
    const [deploymentStarted, setDeploymentStarted] = useState(false);
    const [deploymentFailed, setDeploymentFailed] = useState(false);
    const [useArns, setUseArns] = useState(false);
    const [customArnsName, setCustomArnsName] = useState("");
    const [deploymentCompleted, setDeploymentCompleted] = useState(false);
    const [deploymentSuccess, setDeploymentSuccess] = useState(false);
    

    const arweave = Arweave.init({
        host: "arweave.net",
        port: 443,
        protocol: "https",
    });

    

    // Add useEffect to fetch repositories when token changes
    useEffect(() => {
        if (githubToken) {
            fetchRepositories();
        }
    }, [githubToken]);

    useEffect(() => {
        if (repoUrl && githubToken) {
            fetchBranches();
        }
    }, [repoUrl, githubToken]);

    async function fetchRepositories() {
        if (!githubToken) return;
        const octokit = new Octokit({ auth: githubToken });
        let allRepos: Repository[] = [];
        let page = 1;
        
        try {
            while (true) {
                const response = await octokit.repos.listForAuthenticatedUser({
                    per_page: 100,
                    page: page,
                });
                
                if (response.data.length === 0) {
                    break;
                }
                
                allRepos = allRepos.concat(response.data as Repository[]);
                page++;
            }
            
            setRepositories(allRepos);
        } catch (error) {
            console.error('Error fetching repositories:', error);
            toast.error('Failed to fetch repositories');
        }
    }

    async function fetchBranches() {
        if (!repoUrl) return;
        const [owner, repo] = repoUrl.replace("https://github.com/", "").split("/");
        setLoadingBranches(true);
        setBranchError("");

        try {
            const response = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/branches`,
                {
                    headers: {
                        Authorization: `token ${githubToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );
            setBranches((response.data as any[]).map((branch: any) => branch.name));
        } catch (error) {
            console.error('Error fetching branches:', error);
            // If the error is 404, assume it's a single-branch repository
            if (isAxiosError(error) && error.response?.status === 404) {
                setBranches(['main']); // Assume 'main' as the default branch
                setSelectedBranch('main');
            } else {
                setBranchError("Failed to fetch branches. Please check your repository access.");
            }
        } finally {
            setLoadingBranches(false);
        }
    }

    const deploy = useCallback(async () => {
        if (!projName) return toast.error("Project Name is required");
        if (!repoUrl) return toast.error("Repository Url is required");
        if (!selectedBranch) return toast.error("Branch is required");
        if (!installCommand) return toast.error("Install Command is required");
        if (!buildCommand) return toast.error("Build Command is required");
        if (!outputDir) return toast.error("Output Directory is required");

        if (deploying) return;

        if (!globalState.managerProcess) return toast.error("Manager process not found");
        if (deployments.find(dep => dep.Name === projName)) return toast.error("Project name already exists");

        let finalArnsProcess = arnsProcess;
        let customRepo = null;
        if (!useArns && customArnsName) {
            finalArnsProcess = `${customArnsName}.arlink.ar-io.dev`;
            customRepo = customArnsName;
        }
        if (!githubToken) return toast.error("GitHub token is required for deployment.");

        // Create the tokenized repo URL
        const tokenizedRepoUrl = createTokenizedRepoUrl(repoUrl, githubToken);

        setDeploying(true);
        setDeploymentStarted(true);
        setStep("deploy");
        setDeploymentCompleted(false);
        setDeploymentSuccess(false);

        const query = `local res = db:exec[[
            INSERT INTO Deployments (Name, RepoUrl, Branch, InstallCMD, BuildCMD, OutputDIR, ArnsProcess)
                VALUES
            ('${projName}', '${repoUrl}', '${selectedBranch}', '${installCommand}', '${buildCommand}', '${outputDir}', '${finalArnsProcess}')
        ]]`;
        console.log(query);

        const res = await runLua(query, globalState.managerProcess);
        if (res.Error) return toast.error(res.Error);
        console.log(res);
        await refresh();

        try {
            const response = await axios.post(`${BUILDER_BACKEND}/deploy`, {
                repository: tokenizedRepoUrl, // Use the tokenized URL here
                branch: selectedBranch, 
                installCommand,
                buildCommand,
                outputDir,
                repoName: customArnsName,
                githubToken
                // Remove githubToken from here since it's now in the URL
            }, { timeout: 60 * 60 * 1000, headers: { "Content-Type": "application/json" } });

            if (response.status === 200 && response.data) {
                console.log("https://arweave.net/" + response.data);
                toast.success("Deployment successful");

                const updres = await runLua(`db:exec[[UPDATE Deployments SET DeploymentId='${response.data}' WHERE Name='${projName}']]`, globalState.managerProcess);

                if (useArns || customArnsName) {
                    await setArnsName(finalArnsProcess, response.data);
                }

                setDeploymentSuccess(true);
                // In the deploy function within pages/deploy.tsx, update this line:
                router.push(`/deployment?repo=${projName}`);
                window.open("https://arweave.net/" + response.data, "_blank");
            } else {
                toast.error("Deployment failed: Unexpected response");
                router.push({ pathname: "/deployment", query: { repo: projName } });
                throw new Error("Deployment failed: Unexpected response");
                
            }
        } catch (error) {
            console.error("Deployment error:", error);
            toast.error("Deployment failed. Please check logs on dashboard.");
            setDeploymentFailed(true);
            setDeploymentSuccess(false);
        } finally {
            setDeploying(false);
            setDeploymentCompleted(true);
        }
    }, [projName, repoUrl, selectedBranch, installCommand, buildCommand, outputDir, customArnsName, useArns, arnsProcess, githubToken, globalState.managerProcess, router]);

    const handleProtocolLandImport = () => {
        router.push("/deploythirdparty");
    };

    async function fetchArnsNames() {
        if (!activeAddress) {
            toast.error("Wallet address not found");
            return;
        }
        setLoadingArnsNames(true);
        try {
            const names = await getWalletOwnedNames(activeAddress);
            setArnsNames(names);
        } catch (error) {
            console.error("Error fetching ArNS names:", error);
            toast.error("Failed to fetch ArNS names");
        } finally {
            setLoadingArnsNames(false);
        }
    }

    function handleArnsSelection(selectedArns: { name: string; processId: string } | null) {
        if (selectedArns) {
            setArnsProcess(selectedArns.processId);
            setCustomArnsName(selectedArns.name);
        } else {
            setArnsProcess("");
            setCustomArnsName("");
        }
        setShowArnsDropdown(false);
    }

    const handleBack = useCallback(() => {
        setDeploymentFailed(false);
        setDeploymentStarted(false);
        setDeploymentCompleted(false);
        setDeploymentSuccess(false);
        
        switch (step) {
            case "repository":
                setStep("initial");
                break;
            case "project":
                setStep("repository");
                break;
            case "domain":
                setStep("project");
                break;
            case "deploy":
                setStep("domain");
                break;
        }
    }, [step]);

    const handleNext = () => {
        switch (step) {
            case "repository":
                setStep("project");
                break;
            case "project":
                setStep("domain");
                break;
            case "domain":
                deploy();
                break;
        }
    }

    return (
        <Layout>
            <div className="min-h-screen">
                <header className="flex justify-between items-center p-6 border-b border-border bg-transparent">
                    <div>
                        <h1 className="text-2xl font-bold">Create New Deployment</h1>
                    </div>
                </header>

                <main className="p-6 max-w-4xl mx-auto">
                    {step === "initial" && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold">Select a Git provider to import an existing project</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GitHubLoginButton
                                    onSuccess={() => setStep("repository")}
                                    className="flex items-center justify-center space-x-2 h-16 bg-primary/80 hover:bg-primary/90 text-primary-foreground shadow-lg"
                                >
                                    <Github className="w-6 h-6" />
                                    <span>Import from GitHub</span>
                                </GitHubLoginButton>
                                <Button 
                                    className="flex items-center justify-center space-x-2 h-16 bg-primary/80 hover:bg-primary/90 text-primary-foreground shadow-lg"
                                    onClick={handleProtocolLandImport}
                                >
                                    <Globe className="w-6 h-6" />
                                    <span>Import from Protocol Land</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "repository" && (
                        <div className="space-y-6">
                            <label className="text-muted-foreground pl-2 pt-2 -mb-1" htmlFor="repo-url">Repository</label>
                            <select
                                className="border rounded-md p-2 w-full bg-card/50 shadow-md"
                                value={repoUrl}
                                onChange={async (e) => {
                                    const selectedUrl = e.target.value;
                                    setRepoUrl(selectedUrl);
                                    setSelectedBranch('');
                                    setBranches([]);

                                    if (selectedUrl) {
                                        // Extract owner and repo from the GitHub URL
                                        const [, , , owner, repo] = selectedUrl.split('/');
                                        
                                        try {
                                            // Fetch repository configuration
                                            const config = await getRepoConfig(owner, repo);
                                            
                                            // Pre-fill the form fields
                                            setInstallCommand(config.installCommand);
                                            setBuildCommand(config.buildCommand);
                                            setOutputDir(config.outputDir);
                                        } catch (error) {
                                            console.error('Error fetching repo config:', error);
                                            // Reset to defaults if there's an error
                                            setInstallCommand('npm install');
                                            setBuildCommand('npm run build');
                                            setOutputDir('./dist');
                                        }
                                    }
                                }}
                            >
                                <option value="" disabled>Select a repository</option>
                                {repositories.map((repo: Repository) => (
                                    <option key={repo.id} value={repo.html_url}>
                                        {repo.full_name}
                                    </option>
                                ))}
                            </select>

                            <label className="text-muted-foreground pl-2 pt-2 -mb-1" htmlFor="branch">Branch</label>
                            <select
                                className="border rounded-md p-2 w-full bg-card/50 shadow-md"
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                disabled={!repoUrl || loadingBranches}
                            >
                                <option value="" disabled>Select a branch</option>
                                {branches.map((branch: any) => (
                                    <option key={branch} value={branch}>
                                        {branch}
                                    </option>
                                ))}
                            </select>
                            {branchError && <div className="text-red-500">{branchError}</div>}
                        </div>
                    )}

                    {step === "project" && (
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="project-name">Project Name</Label>
                                <Input placeholder="e.g. Coolest AO App" id="project-name" required onChange={(e) => setProjName(e.target.value)} className="mt-1 bg-card/50 shadow-md" />
                            </div>
                            <div>
                                <Label htmlFor="install-command">Install Command</Label>
                                <Input placeholder="e.g. npm i" id="install-command" onChange={(e) => setInstallCommand(e.target.value || "npm ci")} className="mt-1 bg-card/50 shadow-md" />
                            </div>
                            <div>
                                <Label htmlFor="build-command">Build Command</Label>
                                <Input placeholder="e.g. npm run build" id="build-command" onChange={(e) => setBuildCommand(e.target.value || "npm run build")} className="mt-1 bg-card/50 shadow-md" />
                            </div>
                            <div>
                                <Label htmlFor="output-dir">Output Directory</Label>
                                <Input placeholder="e.g. ./dist" id="output-dir" onChange={(e) => setOutputDir(e.target.value || "./dist")} className="mt-1 bg-card/50 shadow-md" />
                            </div>
                        </div>
                    )}

                    {step === "domain" && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="use-arns"
                                    checked={useArns}
                                    onCheckedChange={(checked) => {
                                        setUseArns(checked);
                                        if (!checked) {
                                            setArnsProcess("");
                                        }
                                    }}
                                />
                                <Label htmlFor="use-arns">Use existing ArNS</Label>
                            </div>
                            {useArns ? (
                                <>
                                    <Label htmlFor="arns-process">ArNS Name</Label>
                                    <div className="relative">
                                        <Input 
                                            placeholder="Select an ArNS name or enter Process ID" 
                                            id="arns-process" 
                                            value={arnsProcess}
                                            onChange={(e) => setArnsProcess(e.target.value)}
                                            onFocus={() => {
                                                setShowArnsDropdown(true);
                                                if (arnsNames.length === 0) {
                                                    fetchArnsNames();
                                                }
                                            }}
                                            className="bg-card/50 shadow-md"
                                        />
                                        {showArnsDropdown && (
                                            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
                                                <ul className="py-1">
                                                    <li 
                                                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-gray-200"
                                                        onClick={() => handleArnsSelection(null)}
                                                    >
                                                        None
                                                    </li>
                                                    {arnsNames.map((arns) => (
                                                        <li 
                                                            key={arns.processId} 
                                                            className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-gray-200"
                                                            onClick={() => handleArnsSelection(arns)}
                                                        >
                                                            {arns.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                                {loadingArnsNames && (
                                                    <div className="flex justify-center py-2">
                                                        <Loader className="animate-spin text-gray-200" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <Label htmlFor="custom-arns-name">Custom ArNS Undername</Label>
                                    <Input 
                                        placeholder="yournamechoice" 
                                        id="custom-arns-name" 
                                        value={customArnsName}
                                        onChange={(e) => setCustomArnsName(e.target.value)}
                                        className="mt-1 bg-card/50 shadow-md"
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Your custom name will be: {customArnsName ? `${customArnsName}_arlink.ar-io.dev` : ""} (if available)
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {(step === "deploy" || deploymentStarted) && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Deployment Logs</h2>
                            <div className="bg-card/50 p-4 rounded-md h-64 overflow-y-auto shadow-lg">
                                <Logs name={projName} deploying={deploying} repoUrl={repoUrl} />
                            </div>
                            {deploymentCompleted && (
                                <div className={`text-center font-bold ${deploymentSuccess ? 'text-green-500' : 'text-red-500'}`}>
                                    {deploymentSuccess ? 'Deployment Successful!' : 'Deployment Failed'}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-6 flex justify-between">
                        {step !== "initial" && (
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={deploying}
                                className="bg-background/50 shadow-md"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        )}
                        {(step === "repository" || step === "project" || step === "domain") && (
                            <Button
                                className="ml-auto bg-primary/80 hover:bg-primary/90 shadow-lg"
                                onClick={handleNext}
                                disabled={step === "repository" && (!repoUrl || !selectedBranch)}
                            >
                                {step === "domain" ? "Deploy" : "Next"}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </main>

                <footer className="mt-8 p-6 border-t border-border text-center text-muted-foreground bg-transparent">
                    <a href="#" className="hover:text-foreground">Learn more about deploying projects →</a>
                </footer>
            </div>
        </Layout>
    );
}
