import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGlobalState } from "@/hooks";
import { runLua } from "@/lib/ao-vars";
import { useRouter } from "next/router";
import { SetStateAction, useEffect, useState } from "react";
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
        const waitTime = 60000; // 1 minute in milliseconds

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

export default function Deploy() {
    const globalState = useGlobalState();
    const router = useRouter();
    const { managerProcess, refresh , deployments } = useDeploymentManager();
    const [projName, setProjName] = useState("");
    const [repoUrl, setRepoUrl] = useState("");
    const [installCommand, setInstallCommand] = useState("npm ci");
    const [buildCommand, setBuildCommand] = useState("npm run build");
    const [outputDir, setOutputDir] = useState("./dist");
    const [deploying, setDeploying] = useState(false);
    const [arnsProcess, setArnsProcess] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const [branches, setBranches] = useState([""]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [branchError, setBranchError] = useState("");
    const { githubToken, setGithubToken } = useGlobalState();
    const [repositories, setRepositories] = useState([]);
    const [arnsNames, setArnsNames] = useState<{ name: string; processId: string }[]>([]);
    const [loadingArnsNames, setLoadingArnsNames] = useState(false);
    const activeAddress = useActiveAddress(); // Add this line to get the active address
    const [showArnsDropdown, setShowArnsDropdown] = useState(false);
    const [step, setStep] = useState<"initial" | "repository" | "project" | "domain" | "deploy">("initial");
    const [isGitHubConnected, setIsGitHubConnected] = useState(false);
    

    const arweave = Arweave.init({
        host: "arweave.net",
        port: 443,
        protocol: "https",
    });

    

    // Add useEffect to fetch repositories when token changes
    useEffect(() => {
        if (githubToken) {
            checkGitHubConnection();
        }
    }, [githubToken]);

    useEffect(() => {
        if (repoUrl && githubToken) {
            fetchBranches();
        }
    }, [repoUrl, githubToken]);

    async function fetchRepositories() {
        if (!githubToken) return;
        try {
            const response = await axios.get('https://api.github.com/user/repos', {
                headers: {
                    Authorization: `token ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            setRepositories(response.data as SetStateAction<never[]>);
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

    async function deploy() {
        if (!projName) return toast.error("Project Name is required");
        if (!repoUrl) return toast.error("Repository Url is required");
        if (!selectedBranch) return toast.error("Branch is required");
        if (!installCommand) return toast.error("Install Command is required");
        if (!buildCommand) return toast.error("Build Command is required");
        if (!outputDir) return toast.error("Output Directory is required");


        if (deploying) return;

        if (!globalState.managerProcess) return toast.error("Manager process not found");
        if (deployments.find(dep => dep.Name === projName)) return toast.error("Project name already exists");

        setDeploying(true);
        setStep("deploy"); // Add this line to change the step to "deploy"
        const query = `local res = db:exec[[
            INSERT INTO Deployments (Name, RepoUrl, Branch, InstallCMD, BuildCMD, OutputDIR, ArnsProcess)
                VALUES
            ('${projName}', '${repoUrl}', '${selectedBranch}', '${installCommand}', '${buildCommand}', '${outputDir}', '${arnsProcess}')
        ]]`;
        console.log(query);

        const res = await runLua(query, globalState.managerProcess);
        if (res.Error) return toast.error(res.Error);
        console.log(res);
        await refresh();

        try {
            console.log("repourlis",repoUrl)
            const txid = await axios.post(`${BUILDER_BACKEND}/deploy`, {
                repository: repoUrl,
                branch: selectedBranch, 
                installCommand,
                buildCommand,
                outputDir,
            }, { timeout: 60 * 60 * 1000, headers: { "Content-Type": "application/json" } });

            if (txid.status === 200) {
                console.log("https://arweave.net/" + txid.data);
                toast.success("Deployment successful");

                // const mres = await runLua("", arnsProcess, [
                //     { name: "Action", value: "Set-Record" },
                //     { name: "Sub-Domain", value: "@" },
                //     { name: "Transaction-Id", value: txid.data },
                //     { name: "TTL-Seconds", value: "3600" },
                // ]);
                // console.log("set arns name", mres);

                const updres = await runLua(`db:exec[[UPDATE Deployments SET DeploymentId='${txid.data}' WHERE Name='${projName}']]`, globalState.managerProcess);

                router.push("/deployments/" + projName);
                window.open("https://arweave.net/" + txid.data, "_blank");

            } else {
                toast.error("Deployment failed");
                console.log(txid);
            }
        } catch (error) {
            toast.error("Deployment failed check logs on dashboard");
            console.log(error);
        }

        setDeploying(false);
    }

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
        } else {
            setArnsProcess("");
        }
        setShowArnsDropdown(false);
    }

    const handleBack = () => {
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
                if (!deploying) {
                    setStep("domain");
                }
                break;
        }
    }

    const handleNext = () => {
        switch (step) {
            case "repository":
                setStep("project");
                break;
            case "project":
                setStep("domain");
                break;
            case "domain":
                deploy(); // This will now set the step to "deploy" and start the deployment process
                break;
        }
    }

    const checkGitHubConnection = async () => {
        try {
            const response = await axios.get('https://api.github.com/user', {
                headers: {
                    Authorization: `token ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            setIsGitHubConnected(true);
            fetchRepositories(); // Fetch repositories once connected
        } catch (error) {
            console.error('Error checking GitHub connection:', error);
            setIsGitHubConnected(false);
        }
    };

    return (
        <Layout>
            <div className="min-h-screen">
                <header className="flex justify-between items-center p-6 border-b border-border bg-transparent">
                    <div>
                        <h1 className="text-2xl font-bold">Create New Deployment</h1>
                    </div>
                </header>

                <main className="p-6 max-w-4xl mx-auto">
                    {!isGitHubConnected ? (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold">Connect your GitHub account</h2>
                            <Button
                                className="flex items-center justify-center space-x-2 h-16 bg-primary/80 hover:bg-primary/90 text-primary-foreground shadow-lg w-full"
                                onClick={() => window.open("https://github.com/apps/arlinkapp/installations/new", "_blank")}
                            >
                                <Github className="w-6 h-6" />
                                <span>Connect GitHub Account</span>
                            </Button>
                        </div>
                    ) : (
                        <>
                            {step === "initial" && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-semibold">Select a Git provider to import an existing project</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Button
                                            className="flex items-center justify-center space-x-2 h-16 bg-primary/80 hover:bg-primary/90 text-primary-foreground shadow-lg"
                                            onClick={() => setStep("repository")}
                                        >
                                            <Github className="w-6 h-6" />
                                            <span>Import from GitHub</span>
                                        </Button>
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
                                        onChange={(e) => {
                                            setRepoUrl(e.target.value);
                                            setSelectedBranch('');
                                            setBranches([]);
                                        }}
                                    >
                                        <option value="" disabled>Select a repository</option>
                                        {repositories.map((repo: any) => (
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
                                </div>
                            )}

                            {step === "deploy" && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-semibold">Deployment Logs</h2>
                                    <div className="bg-card/50 p-4 rounded-md h-64 overflow-y-auto shadow-lg">
                                        <Logs name={projName} deploying={deploying} repoUrl={repoUrl} />
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-between">
                                {step !== "initial" && (
                                    <Button
                                        variant="outline"
                                        onClick={handleBack}
                                        disabled={step === "deploy" && deploying}
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
                        </>
                    )}
                </main>

                <footer className="mt-8 p-6 border-t border-border text-center text-muted-foreground bg-transparent">
                    <a href="#" className="hover:text-foreground">Learn more about deploying projects →</a>
                </footer>
            </div>
        </Layout>
    );
}
