import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGlobalState } from "@/hooks";
import { runLua } from "@/lib/ao-vars";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Arweave from "arweave";
import { Loader } from "lucide-react";
import axios, { AxiosError } from 'axios';
import Ansi from "@agbishop/react-ansi-18";
import { BUILDER_BACKEND } from "@/lib/utils";
import useDeploymentManager from "@/hooks/useDeploymentManager";
import { GitHubLoginButton } from '@/components/project-creation-page';



function extractRepoName(url: string): string {
    return url.replace(/\.git|\/$/, '').split('/').pop() as string;
}

function extractOwnerName(url: string): string {
    return url.split("/").reverse()[1];
}

function Logs({ name, deploying, repoUrl }: { name: string, deploying?: boolean, repoUrl: string }) {
    console.log(name);
    const [output, setOutput] = useState("");

    useEffect(() => {
        if (!name || !repoUrl) return;
        const repo = extractRepoName(repoUrl);
        const owner = extractOwnerName(repoUrl);
        const interval: ReturnType<typeof setInterval> = setInterval(async () => {
            if (!deploying) return clearInterval(interval);
            const logs = await axios.get(`${BUILDER_BACKEND}/logs/${owner}/${repo}`);
            console.log(logs.data);
            setOutput((logs.data as string).replaceAll(/\\|\||\-/g, ""));
            setTimeout(() => {
                const logsDiv = document.getElementById("logs");
                logsDiv?.scrollTo({ top: logsDiv.scrollHeight, behavior: "smooth" });
            }, 100);
        }, 1000);

        return () => { clearInterval(interval); }
    }, [name, deploying, repoUrl]);

    return (
        <div>
            <div className="pl-2 mb-1">Build Logs</div>
            <pre className="font-mono text-xs border p-2 rounded-lg px-4 bg-black/30 overflow-scroll max-h-[250px]" id="logs">
                <Ansi log={output} />
            </pre>
        </div>
        
    );
}

export default function Deploy() {
    const globalState = useGlobalState();
    const router = useRouter();
    const { managerProcess, refresh } = useDeploymentManager();
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
        try {
            const response = await axios.get('https://api.github.com/user/repos', {
                headers: {
                    Authorization: `token ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            setRepositories(response.data);
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
            setBranches(response.data.map((branch: any) => branch.name));
        } catch (error) {
            console.error('Error fetching branches:', error);
            // If the error is 404, assume it's a single-branch repository
            if (axios.isAxiosError(error) && error.response?.status === 404) {
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

        setDeploying(true);
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
            toast.error("Deployment failed");
            console.log(error);
        }

        setDeploying(false);
    }

    return (
        <Layout>
            <div className="text-xl my-5 mb-10">Create New Deployment</div>

            <div className="md:min-w-[60%] w-full max-w-lg mx-auto flex flex-col gap-2">
                {!githubToken ? (
                    <GitHubLoginButton />
                ) : (
                    <>
                        <label className="text-muted-foreground pl-2 pt-2 -mb-1" htmlFor="project-name">Project Name</label>
                        <Input placeholder="e.g. Coolest AO App" id="project-name" required onChange={(e) => setProjName(e.target.value)} />

                        <label className="text-muted-foreground pl-2 pt-2 -mb-1" htmlFor="repo-url">Repository</label>
                        <select
                            className="border rounded-md p-2"
                            value={repoUrl}
                            onChange={(e) => {
                                setRepoUrl(e.target.value);
                                // Reset branch selection when repo changes
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
                            className="border rounded-md p-2"
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

                        <label className="text-muted-foreground pl-2 pt-10 -mb-1" htmlFor="install-command">Install Command</label>
                        <Input placeholder="e.g. npm ci" id="install-command" onChange={(e) => setInstallCommand(e.target.value || "npm ci")} />

                        <label className="text-muted-foreground pl-2 pt-2 -mb-1" htmlFor="build-command">Build Command</label>
                        <Input placeholder="e.g. npm run build" id="build-command" onChange={(e) => setBuildCommand(e.target.value || "npm run build")} />

                        <label className="text-muted-foreground pl-2 pt-2 -mb-1" htmlFor="output-dir">Output Directory</label>
                        <Input placeholder="e.g. ./dist" id="output-dir" onChange={(e) => setOutputDir(e.target.value || "./dist")} />

                        <label className="text-muted-foreground pl-2 pt-2 -mb-1" htmlFor="arns-process">ArNS Process ID</label>
                        <Input placeholder="e.g. arns.id" id="arns-process" onChange={(e) => setArnsProcess(e.target.value)} />

                        <Button className="w-full mt-10" variant="secondary" onClick={deploy}>
                            {deploying ? <Loader className="animate-spin mr-2" /> : "Deploy"}
                        </Button>

                        {deploying && <Logs name={projName} deploying={deploying} repoUrl={repoUrl} />}
                    </>
                )}
            </div>
        </Layout>
    );
}
