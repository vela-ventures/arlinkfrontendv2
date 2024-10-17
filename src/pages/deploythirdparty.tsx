import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGlobalState } from "@/hooks";
import { runLua } from "@/lib/ao-vars";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import axios from 'axios';
import { BUILDER_BACKEND } from "@/lib/utils";
import useDeploymentManager from "@/hooks/useDeploymentManager";
import { useActiveAddress } from "arweave-wallet-kit";
import fetchUserRepos from '@/pages/api/Pl/fetchrepo';
import Ansi from "@agbishop/react-ansi-18";
import { getWalletOwnedNames } from '@/pages/api/ario/getarns';

type ProtocolLandRepo = {
    name: string;
    cloneUrl: string;
};

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
        }, 1000);

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

export default function DeployThirdParty() {
    const globalState = useGlobalState();
    const router = useRouter();
    const { managerProcess, refresh } = useDeploymentManager();
    const address = useActiveAddress();
    const [projName, setProjName] = useState("");
    const [repoUrl, setRepoUrl] = useState("");
    const [installCommand, setInstallCommand] = useState("npm ci");
    const [buildCommand, setBuildCommand] = useState("npm run build");
    const [outputDir, setOutputDir] = useState("./dist");
    const [deploying, setDeploying] = useState(false);
    const [arnsProcess, setArnsProcess] = useState("");
    const [protocolLandRepos, setProtocolLandRepos] = useState<ProtocolLandRepo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<ProtocolLandRepo | null>(null);
    const [loading, setLoading] = useState(true);
    const [arnsNames, setArnsNames] = useState<{ name: string; processId: string }[]>([]);
    const [loadingArnsNames, setLoadingArnsNames] = useState(false);

    useEffect(() => {
        async function fetchRepos() {
            if (!address) {
                toast.error("Please connect your wallet first");
                setLoading(false);
                return;
            }
            try {
                const repos = await fetchUserRepos(address);
                setProtocolLandRepos(repos);
            } catch (error) {
                console.error('Error fetching repositories:', error);
                toast.error('Failed to fetch repositories');
            } finally {
                setLoading(false);
            }
        }

        fetchRepos();
    }, [address]);

    const handleRepoSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedRepoUrl = e.target.value;
        const repo = protocolLandRepos.find(repo => repo.cloneUrl === selectedRepoUrl);
        if (repo) {
            setSelectedRepo(repo);
            setRepoUrl(repo.cloneUrl);
            setProjName(repo.name);
        }
    };

    async function fetchArnsNames() {
        if (!address) {
            toast.error("Wallet address not found");
            return;
        }
        setLoadingArnsNames(true);
        try {
            const names = await getWalletOwnedNames(address);
            setArnsNames(names);
        } catch (error) {
            console.error("Error fetching ArNS names:", error);
            toast.error("Failed to fetch ArNS names");
        } finally {
            setLoadingArnsNames(false);
        }
    }

    function handleArnsSelection(event: React.ChangeEvent<HTMLSelectElement>) {
        const selectedValue = event.target.value;
        if (selectedValue === "none") {
            setArnsProcess("");
        } else {
            setArnsProcess(selectedValue);
        }
    }

    async function deploy() {
        if (!projName) return toast.error("Project Name is required");
        if (!repoUrl) return toast.error("Repository URL is required");
        if (!installCommand) return toast.error("Install Command is required");
        if (!buildCommand) return toast.error("Build Command is required");
        if (!outputDir) return toast.error("Output Directory is required");
        if (!address) return toast.error("Wallet address is required");

        if (deploying) return;
        if (!globalState.managerProcess) return toast.error("Manager process not found");

        setDeploying(true);

        const query = `local res = db:exec[[
            INSERT INTO Deployments (Name, RepoUrl, InstallCMD, BuildCMD, OutputDIR, ArnsProcess)
                VALUES
            ('${projName}', '${repoUrl}', '${installCommand}', '${buildCommand}', '${outputDir}', '${arnsProcess}')
        ]]`;
        console.log(query);

        const res = await runLua(query, globalState.managerProcess);
        if (res.Error) return toast.error(res.Error);
        console.log(res);
        await refresh();

        try {
            const txid = await axios.post(`${BUILDER_BACKEND}/deploy`, {
                repository: repoUrl,
                installCommand,
                buildCommand,
                outputDir,
                branch: "main", // Assuming main branch for Protocol Land repos
                subDirectory: selectedRepo?.name,
                protocolLand: true,
                walletAddress: address,
                repoName: projName,
                arnsProcess, // Add this line to include arnsProcess
            }, { timeout: 60 * 60 * 1000, headers: { "Content-Type": "application/json" } });

            if (txid.status === 200) {
                console.log("https://arweave.net/" + txid.data);
                toast.success("Deployment successful");

                const updres = await runLua(`db:exec[[UPDATE Deployments SET DeploymentId='${txid.data}' WHERE Name='${projName}']]`, globalState.managerProcess);

                router.push("/deployments/" + projName);
                window.open("https://arweave.net/" + txid.data, "_blank");
            } else {
                toast.error("Deployment failed");
                console.log(txid);
            }
        } catch (error) {
            toast.error("Deployment failed");
            console.log(error);
        }

        setDeploying(false);
    }

    return (
        <Layout>
            <div className="text-xl my-5 mb-10">Deploy from Protocol Land</div>

            <div className="md:min-w-[60%] w-full max-w-lg mx-auto flex flex-col gap-2">
                {loading ? (
                    <div className="text-center">
                        <Loader className="animate-spin inline-block mr-2" />
                        Loading repositories...
                    </div>
                ) : protocolLandRepos.length > 0 ? (
                    <>
                        <label className="text-muted-foreground pl-2 pt-2 -mb-1" htmlFor="repo-url">Repository</label>
                        <select
                            className="border rounded-md p-2"
                            value={repoUrl}
                            onChange={handleRepoSelection}
                        >
                            <option value="" disabled>Select a repository</option>
                            {protocolLandRepos.map((repo) => (
                                <option key={repo.cloneUrl} value={repo.cloneUrl}>
                                    {repo.name}
                                </option>
                            ))}
                        </select>

                        <label className="text-muted-foreground pl-2 pt-2 -mb-1" htmlFor="project-name">Project Name</label>
                        <Input placeholder="e.g. Coolest AO App" id="project-name" value={projName} required onChange={(e) => setProjName(e.target.value)} />

                        <label className="text-muted-foreground pl-2 pt-10 -mb-1" htmlFor="install-command">Install Command</label>
                        <Input placeholder="e.g. npm ci" id="install-command" value={installCommand} onChange={(e) => setInstallCommand(e.target.value)} />

                        <label className="text-muted-foreground pl-2 pt-2 -mb-1" htmlFor="build-command">Build Command</label>
                        <Input placeholder="e.g. npm run build" id="build-command" value={buildCommand} onChange={(e) => setBuildCommand(e.target.value)} />

                        <label className="text-muted-foreground pl-2 pt-2 -mb-1" htmlFor="output-dir">Output Directory</label>
                        <Input placeholder="e.g. ./dist" id="output-dir" value={outputDir} onChange={(e) => setOutputDir(e.target.value)} />

                        <label className="text-muted-foreground pl-2 pt-2 -mb-1" htmlFor="arns-process">ArNS Process ID</label>
                        <div className="flex gap-2">
                            <select
                                className="border rounded-md p-2 flex-grow"
                                value={arnsProcess}
                                onChange={handleArnsSelection}
                                onClick={() => {
                                    if (arnsNames.length === 0) {
                                        fetchArnsNames();
                                    }
                                }}
                            >
                                <option value="">Select an ArNS name</option>
                                <option value="none">None</option>
                                {arnsNames.map((arns) => (
                                    <option key={arns.processId} value={arns.processId}>
                                        {arns.name}
                                    </option>
                                ))}
                            </select>
                            {loadingArnsNames && <Loader className="animate-spin" />}
                        </div>
                        <Input 
                            placeholder="e.g. arns.id" 
                            id="arns-process" 
                            value={arnsProcess}
                            onChange={(e) => setArnsProcess(e.target.value)}
                        />

                        <Button className="w-full mt-10" variant="secondary" onClick={deploy} disabled={!selectedRepo}>
                            {deploying ? <Loader className="animate-spin mr-2" /> : "Deploy"}
                        </Button>

                        {deploying && <Logs name={projName} deploying={deploying} repoUrl={repoUrl} />}
                    </>
                ) : (
                    <div className="text-center">No repositories found. Please make sure your wallet is connected and you have repositories on Protocol Land.</div>
                )}
            </div>
        </Layout>
    );
}
