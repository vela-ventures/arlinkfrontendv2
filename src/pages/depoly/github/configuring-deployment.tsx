import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalState } from "@/store/useGlobalState";
import {
    DirectoryStructure,
    type ArnsName,
    type BuildSettings,
    type Steps,
} from "@/types";
import { getRepoConfig } from "@/lib/getRepoconfig";
import { SelectGroup } from "@radix-ui/react-select";
import axios, { isAxiosError } from "axios";
import { ChevronDown, ChevronLeft, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import RootDirectoryDrawer from "../../../components/rootdir-drawer";
import { useActiveAddress } from "arweave-wallet-kit";
import { toast } from "sonner";
import DomainSelection from "../../../components/shared/domain-selection";
import { getWalletOwnedNames } from "@/lib/get-arns";
import useDeploymentManager, {
    historyTable,
} from "@/hooks/useDeploymentManager";
import { BUILDER_BACKEND, getTime } from "@/lib/utils";
import { runLua, setArnsName as setUpArnsName } from "@/lib/ao-vars";
import { useNavigate } from "react-router-dom";
import DeploymentLogs from "../../../components/shared/deploying-logs";
import {
    analyzeRepoStructure,
    createTokenizedRepoUrl,
    detectFrameworkImage,
    extractOwnerName,
    extractRepoName,
    handleFetchExistingArnsName,
    indexInMalik,
} from "../utilts";
import NewDeploymentCard from "@/components/shared/new-deployment-card";
import { BuildDeploymentSetting } from "@/components/shared/build-settings";
import { NextJsProjectWarningCard } from "@/components/skeletons";
import { setArnsName as setArnsNameWithProcessId } from "@/lib/ao-vars";

const ConfiguringDeploymentProject = ({
    repoUrl,
    setStep,
}: {
    repoName: string;
    repoUrl: string;
    setStep: React.Dispatch<React.SetStateAction<Steps>>;
}) => {
    // global state and primary hooks
    const { githubToken, managerProcess: mgProcess } = useGlobalState();
    const { refresh, deployments } = useDeploymentManager();
    const navigate = useNavigate();

    const activeAddress = useActiveAddress();
    const [frameWork, setFrameWork] = useState<{
        name: string;
        dir: string;
        svg: string;
    }>({
        name: "unknown",
        svg: "unknown.svg",
        dir: "unknown",
    });

    // project states
    const [projectName, setProjectName] = useState<string>("");
    const [subDir, setSubDir] = useState<DirectoryStructure[]>([]);

    // branches state
    const [branches, setBranches] = useState<string[]>(["main", "master"]);
    const [selectedBranch, setSelectedBranch] = useState<string>("main");

    // directory states
    const [rootDirectory, setRootDirectory] = useState("./");
    const [isRootDirectoryDrawerOpen, setIsRootDirectoryDrawerOpen] =
        useState(false);

    async function handleSelectRootDir(path: string) {
        setRootDirectory(path);
        const configPath = path.replace("./", "");
        const newData = await getRepoConfig(
            extractOwnerName(repoUrl),
            extractRepoName(repoUrl),
            configPath,
        );
        console.log({
            configData: newData,
        });
    }

    // domain states
    const [activeTab, setActiveTab] = useState<"arlink" | "existing">("arlink");
    const [customArnsName, setCustomArnsName] = useState<string>("");
    const [arnsProcess, setArnsProcess] = useState<string>("");

    // for the arns domain from wallet
    const [arnsNames, setArnsNames] = useState<ArnsName[]>([]);
    const [arnsName, setArnsName] = useState<ArnsName | undefined>(undefined);

    // build and output setting states
    const [buildSettings, setBuildSettings] = useState<BuildSettings>({
        buildCommand: { enabled: false, value: "npm run build" },
        installCommand: { enabled: false, value: "npm install" },
        outPutDir: { enabled: false, value: "./dist" },
    });

    // loading states
    const [loadingBranches, setLoadingBranches] = useState<boolean>(true);
    const [existingArnsLoading, setExistingArnsLoading] =
        useState<boolean>(true);
    const [fetchingSubDir, setFetchingSubDir] = useState<boolean>(false);

    // error states < will keep adding more after deploy button >
    const [branchError, setBranchError] = useState<string>("");
    const [arnsDropdownModal, setarnsDropdownModal] = useState(false);

    // deployment state
    const [isDeploying, setIsDeploying] = useState<boolean>(false);
    const [deploymentStarted, setDeploymentStarted] = useState<boolean>(false);
    const [deploymentComplete, setDeploymentComplete] =
        useState<boolean>(false);
    const [deploymentSucceded, setDeploymentSucceded] =
        useState<boolean>(false);

    const [deploymentFailed, setDeploymentFailed] = useState<boolean>(false);

    const [logs, setLogs] = useState<string[]>([]);
    const [logError, setLogError] = useState<string>("");
    const [isWaitingForLogs, setIsWaitingForLogs] = useState<boolean>(false);
    const [isFetchingLogs, setIsFetchingLogs] = useState<boolean>(false);
    const [almostDone, setAlmostDone] = useState(false);

    // use effects
    useEffect(() => {
        const handleInit = async () => {
            // if we don't have the repo url we return
            if (!repoUrl) return;

            // extracting the owner and repo
            const [, , , owner, repo] = repoUrl.split("/");

            // getting the project name
            const defaultProjName = repo.replace(/\.git$/, "");

            // using the default project name, owner and repo to fetch repos
            await handleFetchRepository(defaultProjName, owner, repo);
            await handleFetchBranches();
        };

        const handleFetchRepository = async (
            defaultProjectName: string,
            owner: string,
            repo: string,
        ) => {
            // Fetch repository configuration
            const config = await getRepoConfig(owner, repo);

            console.log({
                config,
            });

            setProjectName(defaultProjectName);
            setCustomArnsName(defaultProjectName);
            setBuildSettings((prev) => ({
                ...prev,
                buildCommand: {
                    value: "npm run build",
                    enabled: false,
                },
                installCommand: {
                    value: config.installCommand || "npm install",
                    enabled: false,
                },
                outPutDir: {
                    value: config.outputDir
                        ? config.outputDir === ".next"
                            ? "./dist"
                            : config.outputDir
                        : "./dist",
                    enabled: false,
                },
            }));

            setFrameWork(detectFrameworkImage(config.outputDir));
        };

        handleInit();
    }, [repoUrl]);

    // handlers
    // function to fetch all the branches
    async function handleFetchBranches() {
        if (!repoUrl) return;
        const [owner, repo] = repoUrl
            .replace("https://github.com/", "")
            .split("/");
        setBranchError("");

        try {
            const response = await axios.get<[{ name: string }]>(
                `https://api.github.com/repos/${owner}/${repo}/branches`,
                {
                    headers: {
                        Authorization: `token ${githubToken}`,
                        Accept: "application/vnd.github.v3+json",
                    },
                },
            );

            console.log(response.data);
            const branchesNames = response.data.map((branch) => branch.name);
            setBranches(branchesNames);
        } catch (error) {
            console.error("Error fetching branches:", error);
            // If the error is 404, assume it's a single-branch repository
            if (isAxiosError(error) && error.response?.status === 404) {
                setBranches(["main"]); // Assume 'main' as the default branch
                setSelectedBranch("main");
            } else {
                setBranchError(
                    "Failed to fetch branches. Please check your repository access.",
                );
            }
        } finally {
            setLoadingBranches(false);
        }
    }

    async function handleArnsSelection(arnsName: ArnsName) {
        setArnsProcess(arnsName.processId);
        setArnsName(
            arnsNames.find((arns) => arns.processId === arnsName.processId),
        );
        setarnsDropdownModal(false);
    }

    // build and output settings handler commands
    const deployProject = async () => {
        if (!projectName) return toast.error("Project name is required");
        if (!repoUrl) return toast.error("repository is required");
        if (!selectedBranch) return toast.error("branch is required");
        if (!buildSettings.installCommand.value)
            return toast.error("install command is required");
        if (!buildSettings.buildCommand.value)
            return toast.error("build command is required");
        if (!buildSettings.outPutDir.value)
            return toast.error("output dir is specified");
        if (!mgProcess) return toast.error("manager process not found");
        if (deployments.find((dep) => dep.Name === projectName))
            return toast.error("Project name already exists");
        if (!githubToken)
            return toast.error("github token not found", {
                description: "",
            });

        if (deploymentStarted) return;
        // deployment states
        setIsDeploying(true);
        setDeploymentStarted(true);
        setDeploymentComplete(false);
        setDeploymentSucceded(false);

        let finalArnsProcess = arnsProcess;
        let customRepo = null;

        // this is to check if the user has selected a custom domain or not
        // if he has not selected a custom domain, then we add the custom name and build the url
        switch (activeTab) {
            case "existing":
                if (arnsName?.name) {
                    setCustomArnsName("");
                    finalArnsProcess = arnsName.processId;
                }
                break;
            case "arlink":
                if (!customArnsName) {
                    setCustomArnsName(projectName);
                }
                // if we are using arlink undername feature we set the arns name to undefined
                setArnsName(undefined);
                finalArnsProcess = customArnsName || projectName;
                customRepo = projectName;
                break;
        }

        const tokenizedRepoUrl = createTokenizedRepoUrl(repoUrl, githubToken);

        const owner = extractOwnerName(repoUrl);
        const repo = extractRepoName(repoUrl);
        const POLLING_INTERVAL = 2000;
        const MAX_POLLING_TIME = 600000;
        const startTime = Date.now();
        let intervalId: NodeJS.Timeout | null = null;
        const clearIntervalPolling = () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };

        const logPollingPromise = async () => {
            setIsWaitingForLogs(true);
            await new Promise((resolve) => setTimeout(resolve, 10000));
            setIsWaitingForLogs(false);
            setIsFetchingLogs(true);

            const fetchLogs = async () => {
                if (Date.now() - startTime > MAX_POLLING_TIME) {
                    clearIntervalPolling();
                    setDeploymentFailed(true);
                    return;
                }

                try {
                    const logs = await axios.get(
                        `${BUILDER_BACKEND}/logs/${owner}/${repo}`,
                    );
                    setLogs(logs.data.split("\n"));
                } catch (error) {
                    // I don't want to see red red spams in the logs xD
                }
            };

            intervalId = setInterval(fetchLogs, POLLING_INTERVAL);
        };

        logPollingPromise();

        try {
            const response = await axios.post<{
                result: string;
                finalUnderName: string;
            }>(
                `${BUILDER_BACKEND}/deploy`,
                {
                    repository: tokenizedRepoUrl,
                    installCommand: buildSettings.installCommand.value,
                    buildCommand: buildSettings.buildCommand.value,
                    outputDir: buildSettings.outPutDir.value,
                    subDirectory: rootDirectory,
                    protocolLand: false,
                    repoName: customArnsName,
                    branch: selectedBranch,
                    githubToken,
                    walletAddress: activeAddress,
                    customArnsName: customArnsName || "",
                },
                {
                    timeout: 60 * 60 * 1000,
                    headers: { "Content-Type": "application/json" },
                },
            );

            if (response.status === 200 && response.data.result) {
                console.log(`https://arweave.net/${response.data.result}`);

                setDeploymentSucceded(true);
                setDeploymentComplete(true);

                const alterQuery = runLua(
                    `local res = db:exec[[ ALTER TABLE Deployments ADD COLUMN UnderName TEXT ]]`,
                    mgProcess,
                );

                const insertQuery = runLua(
                    `local res = db:exec[[
                    INSERT INTO Deployments (Name, RepoUrl, Branch, InstallCMD, BuildCMD, OutputDIR, ArnsProcess) VALUES
                        ('${projectName}', 
                        '${repoUrl}', 
                        '${selectedBranch}', 
                        '${buildSettings.installCommand.value}', 
                        '${buildSettings.buildCommand.value}', 
                        '${buildSettings.outPutDir.value}', 
                        '${finalArnsProcess}')
                    ]]`,
                    mgProcess,
                );

                const updateIdQuery = runLua(
                    `db:exec[[UPDATE Deployments SET DeploymentId='${response.data.result}' WHERE Name='${projectName}']]`,
                    mgProcess,
                );

                const underNameQuery = runLua(
                    `local res = db:exec[[
                        UPDATE Deployments 
                        SET UnderName = '${response.data.finalUnderName}' 
                        WHERE Name = '${projectName}'
                    ]]`,
                    mgProcess,
                );

                const historyTableQuery = runLua(historyTable, mgProcess);

                const malikIndexing = indexInMalik({
                    projectName: projectName,
                    description: "An awesome decentralized project",
                    txid: response.data.result,
                    owner: activeAddress,
                    link: `https://arweave.net/${response.data.result}`,
                    arlink: finalArnsProcess,
                });

                let userArns: null | string = null;
                if (activeTab === "existing" && arnsName) {
                    userArns = await setArnsNameWithProcessId(
                        arnsName.processId,
                        response.data.result,
                    );
                }

                const historyInsertQuery = runLua(
                    `db:exec[[
                        INSERT INTO NewDeploymentHistory (Name, DeploymentID, AssignedUndername, Date) VALUES
                        ('${projectName}', '${response.data.result}', '${
                        userArns ? userArns : "NULL"
                    }', '${getTime()}')
                    ]]`,
                    mgProcess,
                );

                setAlmostDone(true);
                setIsFetchingLogs(false);
                // Execute all operations in parallel
                await Promise.all([
                    alterQuery,
                    insertQuery,
                    updateIdQuery,
                    underNameQuery,
                    historyTableQuery,
                    historyInsertQuery,
                    malikIndexing,
                ]);

                await refresh();
                toast.success("Deployment successful");
                // Navigate after all operations complete
                navigate(`/deployment/card?repo=${projectName}`);
            } else {
                throw new Error("Deployment failed: Unexpected response");
            }
        } catch (error) {
            clearIntervalPolling();
            setIsFetchingLogs(false);
            setIsWaitingForLogs(false);

            // Handle rate limiting errors
            if (isAxiosError(error) && error.response?.status === 406) {
                setLogError(
                    "Too many requests detected. Please try again later.",
                );
                setDeploymentSucceded(false);
                setDeploymentComplete(false);
                setDeploymentFailed(true);
                return;
            }

            // Handle network errors
            if (isAxiosError(error) && !error.response) {
                setLogError(
                    "Network error. Please check your connection and try again.",
                );
                setDeploymentSucceded(false);
                setDeploymentComplete(false);
                setDeploymentFailed(true);
                return;
            }

            // Handle other HTTP errors
            if (isAxiosError(error) && error.response) {
                let errorMessage = "Deployment failed: ";

                errorMessage += "Server error. Please try again later.";

                setLogError(errorMessage);
                setDeploymentSucceded(false);
                setDeploymentComplete(false);
                setDeploymentFailed(true);
                return;
            }

            // Handle all other errors
            console.error("Deployment error:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";
            setLogError(`Deployment failed: ${errorMessage}`);
            setDeploymentSucceded(false);
            setDeploymentComplete(false);
            setDeploymentFailed(true);
        } finally {
            setIsDeploying(false);
            setDeploymentComplete(true);
        }
    };

    const handleFetchArns = async () => {
        handleFetchExistingArnsName({
            setArnsNames,
            activeAddress,
            setExistingArnsLoading,
        });
    };

    const handleSettingChange = (
        setting: keyof BuildSettings,
        field: keyof BuildSettings[keyof BuildSettings],
        value: string | boolean,
    ) => {
        setBuildSettings((prev) => ({
            ...prev,
            [setting]: {
                ...prev[setting],
                [field]: value,
            },
        }));
    };

    const fetchRepoStructure = async () => {
        if (!repoUrl) return;
        if (githubToken === null) return;

        setFetchingSubDir(true);

        try {
            const data = await analyzeRepoStructure(
                extractOwnerName(repoUrl),
                extractRepoName(repoUrl),
                githubToken as string,
            );
            console.log({ subDirData: data });
            setSubDir(data);

            setIsRootDirectoryDrawerOpen(true);
        } catch (error) {
            console.log(error);
        } finally {
            setFetchingSubDir(false);
        }
    };

    return (
        <div className="text-white md:px-8 px-4 mb-20 max-w-3xl mx-auto">
            <button
                type="button"
                onClick={() => setStep("importing")}
                className="mb-6 flex items-center gap-2 text-neutral-600 hover:text-neutral-100 text-sm cursor-pointer"
            >
                <ChevronLeft size={18} /> Go back
            </button>
            <h1 className="md:text-2xl text-xl font-bold mb-6">
                Set up ur deployment process
            </h1>
            <div
                className={`rounded-lg ${
                    deploymentStarted ? "opacity-70" : "opacity-100"
                } mb-6`}
            >
                <NewDeploymentCard
                    projectName={projectName}
                    framework={frameWork}
                    activeTab={activeTab}
                    customArnsName={customArnsName}
                    arnsName={arnsName}
                    selectedBranch={selectedBranch}
                />
                {frameWork.dir.toLocaleLowerCase().includes("next") && (
                    <NextJsProjectWarningCard />
                )}
                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-neutral-400 text-sm font-medium mb-1"
                        >
                            Projects name
                        </label>
                        <Input
                            disabled={deploymentStarted}
                            id="name"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Enter your project name here"
                            className="bg-[#0D0D0D]  p-4 placeholder:text-neutral-500 rounded-md mt-3 border-[#383838] text-white"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="branch"
                            className="block text-neutral-400 text-sm font-medium mb-1"
                        >
                            Branch
                        </label>
                        {loadingBranches ? (
                            <Skeleton className="w-full text-sm border border-neutral-600 flex items-center justify-between gap-3 px-3 h-10 text-center focus:ring-0 focus:ring-offset-0 outline-none  bg-neutral-900 text-white">
                                <div className="flex items-center gap-3">
                                    Fetching branches
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />
                                </div>
                                <ChevronDown size={15} />
                            </Skeleton>
                        ) : (
                            <Select
                                disabled={deploymentStarted}
                                value={selectedBranch}
                                onValueChange={(value) =>
                                    setSelectedBranch(value)
                                }
                            >
                                <SelectTrigger className="w-full focus:ring-0 focus:ring-offset-0 outline-none  bg-[#0C0C0C] border-[#383838] text-white">
                                    <SelectValue placeholder="main" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {branches.map((branch) => (
                                            <SelectItem
                                                key={branch}
                                                value={branch}
                                            >
                                                {branch}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {branchError && (
                        <p className="text-red-500">{branchError}</p>
                    )}

                    <div>
                        <label
                            htmlFor="directory"
                            className="block text-neutral-400 text-sm font-medium mb-3"
                        >
                            Root directory
                        </label>
                        <div className="flex relative ">
                            <Input
                                id="directory"
                                value={rootDirectory}
                                readOnly
                                disabled={fetchingSubDir || deploymentStarted}
                                className="bg-[#0D0D0D] p-4 placeholder:text-neutral-500 rounded-md border-[#383838] text-white"
                            />
                            <Button
                                className="absolute h-8 right-1 top-1/2 rounded-sm -translate-y-1/2 font-semibold"
                                onClick={fetchRepoStructure}
                                disabled={fetchingSubDir || deploymentStarted}
                            >
                                {fetchingSubDir ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    "Change"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`mb-6 ${
                    deploymentStarted
                        ? "opacity-80 pointer-events-none"
                        : "opacity-100"
                }`}
            >
                <DomainSelection
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setExistingArnsLoading={setExistingArnsLoading}
                    handleFetchExistingArnsName={handleFetchArns}
                    setCustomArnsName={setCustomArnsName}
                    projectName={projectName}
                    customArnsName={customArnsName}
                    arnsDropDown={arnsDropdownModal}
                    setArnsDropDownModal={setarnsDropdownModal}
                    arnsNames={arnsNames}
                    existingArnsLoading={existingArnsLoading}
                    arnsName={arnsName}
                    handleArnsSelection={handleArnsSelection}
                />
            </div>

            <div
                className={`bg-[#0C0C0C] p-6 rounded-lg mb-6 border border-[#383838] ${
                    deploymentStarted ? "opacity-80" : "opacity-100"
                }`}
            >
                <p className="text-md text-neutral-400 font-medium mb-3">
                    Build And Output Settings
                </p>

                <div className="space-y-4">
                    <BuildDeploymentSetting
                        buildSettings={buildSettings}
                        onSettingChange={handleSettingChange}
                        disabled={deploymentStarted}
                    />
                </div>
            </div>

            <Button
                className="w-full bg-white hover:bg-neutral-200 text-black"
                onClick={deployProject}
                disabled={deploymentStarted}
            >
                Deploy now
            </Button>

            {deploymentStarted && (
                <DeploymentLogs
                    logs={logs}
                    isFetchingLogs={isFetchingLogs}
                    isWaitingForLogs={isWaitingForLogs}
                    logError={logError}
                    almostDone={almostDone}
                />
            )}

            <RootDirectoryDrawer
                subDir={subDir}
                isOpen={isRootDirectoryDrawerOpen}
                onClose={() => setIsRootDirectoryDrawerOpen(false)}
                onSelect={handleSelectRootDir}
            />

            {deploymentFailed && (
                <button
                    type="button"
                    onClick={() => setStep("importing")}
                    className="transition-all mt-6 flex items-center gap-2 text-neutral-600 hover:text-neutral-100 text-sm cursor-pointer"
                >
                    <ChevronLeft size={18} /> Go back
                </button>
            )}
        </div>
    );
};

export default ConfiguringDeploymentProject;
