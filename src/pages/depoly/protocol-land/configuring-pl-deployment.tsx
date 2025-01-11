import useDeploymentManager from "@/hooks/useDeploymentManager";
import { ArnsName, BuildSettings, Steps } from "@/types";
import { useActiveAddress } from "arweave-wallet-kit";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import NewDeploymentCard from "@/components/shared/new-deployment-card";
import { handleFetchExistingArnsName, indexInMalik } from "../utilts";
import { Input } from "@/components/ui/input";
import DomainSelection from "@/components/shared/domain-selection";
import { BuildDeploymentSetting } from "@/components/shared/build-settings";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import axios, { isAxiosError } from "axios";
import { BUILDER_BACKEND } from "@/lib/utils";
import { runLua } from "@/lib/ao-vars";
import DeploymentLogs from "../../../components/shared/deploying-logs";
import { setArnsName as setArnsNameWithProcessId } from "@/lib/ao-vars";

const ConfigureProtocolLandProject = ({
    setStep,
    selectedRepo,
}: {
    setStep: React.Dispatch<React.SetStateAction<Steps>>;
    selectedRepo: { name: string; url: string };
}) => {
    const { managerProcess, refresh, deployments } = useDeploymentManager();
    const navigate = useNavigate();
    const activeAddress = useActiveAddress();

    // project states
    const [projectName, setProjectName] = useState<string>(selectedRepo.name);
    const [branch, setBranch] = useState<string>("main");
    const [buildSettings, setBuildSettings] = useState<BuildSettings>({
        buildCommand: { enabled: false, value: "npm run build" },
        installCommand: { enabled: false, value: "npm install" },
        outPutDir: { enabled: false, value: "./dist" },
    });
    const [rootDir, setRootDir] = useState<string>("./");

    // domain states
    const [activeTab, setActiveTab] = useState<"arlink" | "existing">("arlink");
    const [customArnsName, setCustomArnsName] = useState<string>("");
    const [arnsProcess, setArnsProcess] = useState<string>("");

    // for the arns domain from wallet
    const [arnsNames, setArnsNames] = useState<ArnsName[]>([]);
    const [arnsName, setArnsName] = useState<ArnsName | undefined>(undefined);
    const [arnsDropdownModal, setarnsDropdownModal] = useState(false);

    // loading states
    const [isDeploying, setIsDeploying] = useState<boolean>(false);
    const [existingArnsLoading, setExistingArnsLoading] =
        useState<boolean>(true);

    // deployment status states
    const [deploymentStarted, setDeploymentStarted] = useState<boolean>(false);
    const [deploymentComplete, setDeploymentComplete] =
        useState<boolean>(false);
    const [deploymentSucceded, setDeploymentSucceded] =
        useState<boolean>(false);
    const [deploymentFailed, setDeploymentFailed] = useState<boolean>(false);

    // log states
    const [logs, setLogs] = useState<string[]>([]);
    const [logError, setLogError] = useState<string>("");
    const [isWaitingForLogs, setIsWaitingForLogs] = useState<boolean>(false);
    const [isFetchingLogs, setIsFetchingLogs] = useState<boolean>(false);

    // handlers
    const handleFetchArns = async () => {
        handleFetchExistingArnsName({
            setArnsNames,
            activeAddress,
            setExistingArnsLoading,
        });
    };

    async function handleArnsSelection(arnsName: ArnsName) {
        setArnsProcess(arnsName.processId);
        setArnsName(
            arnsNames.find((arns) => arns.processId === arnsName.processId),
        );
        setarnsDropdownModal(false);
    }

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
    const handleDeployProject = async () => {
        try {
            if (deploymentStarted) return;
            setIsDeploying(true);
            setDeploymentStarted(true);
            setDeploymentComplete(false);
            setDeploymentSucceded(false);

            if (!projectName) return toast.error("Project Name is required");
            if (!selectedRepo.url)
                return toast.error("Repository URL is required");
            if (!buildSettings.installCommand)
                return toast.error("Install Command is required");
            if (!buildSettings.buildCommand)
                return toast.error("Build Command is required");
            if (!buildSettings.outPutDir)
                return toast.error("Output Directory is required");
            if (!activeAddress)
                return toast.error("Wallet address is required");
            if (!managerProcess)
                return toast.error("Manager process not found");
            if (deployments.find((dep) => dep.Name === projectName))
                return toast.error("Project name already exists");

            let finalArnsProcess = arnsProcess;

            //@ts-ignore
            let customRepo = null;
            if (arnsName?.name && activeTab === "existing") {
                console.log("Hello from the frist blokc");
                setCustomArnsName("");
                finalArnsProcess = arnsName.name;
                console.log("hello world");
            } else if (activeTab === "arlink") {
                if (customArnsName.length === 0) setCustomArnsName(projectName);
                setArnsName(undefined);
                finalArnsProcess = `${customArnsName}.arlink.arweave.net`;
                customRepo = projectName;
            }

            // Start log polling before deployment
            const owner = activeAddress;
            const repo = selectedRepo.name;
            const POLLING_INTERVAL = 2000;
            const MAX_POLLING_TIME = 600000;
            const startTime = Date.now();
            let intervalId: NodeJS.Timeout | null = null;

            const clearIntervalPolling = () => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
            };

            // Start the log polling in parallel
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
                const txid = await axios.post<{
                    result: string;
                    finalUnderName: string;
                }>(
                    `${BUILDER_BACKEND}/deploy`,
                    {
                        repository: selectedRepo.url,
                        installCommand: buildSettings.installCommand.value,
                        buildCommand: buildSettings.buildCommand.value,
                        outputDir: buildSettings.outPutDir.value,
                        branch: branch,
                        subDirectory: rootDir,
                        protocolLand: true,
                        repoName: selectedRepo.name,
                        walletAddress: activeAddress,
                        customArnsName: customArnsName || "",
                    },
                    {
                        timeout: 60 * 60 * 1000,
                        headers: { "Content-Type": "application/json" },
                    },
                );

                if (txid.status === 200) {
                    console.log("https://arweave.net/" + txid.data);
                    toast.success("Deployment successful");

                    const alter = await runLua(
                        `local res = db:exec[[
                                ALTER TABLE Deployments 
                                ADD COLUMN UnderName TEXT
                            ]]`,
                        managerProcess,
                    );
                    console.log("tablealtered", alter);

                    // Insert new deployment
                    const insertQuery = `
                        db:exec[[
                            INSERT INTO Deployments (
                                Name,
                                Repository, 
                                Branch,
                                InstallCommand,
                                BuildCommand,
                                OutputDir,
                                ArnsName,
                            ) VALUES (
                                '${projectName}',
                                '${selectedRepo.url}',
                                '${branch}',
                                '${buildSettings.installCommand.value}',
                                '${buildSettings.buildCommand.value}', 
                                '${buildSettings.outPutDir.value}',
                                '${finalArnsProcess}',
                            )
                        ]]
                    `;

                    const res = await runLua(insertQuery, managerProcess);
                    if (res.Error) return toast.error(res.Error);

                    // update query for updating deploymentId
                    const updateIdQuery = await runLua(
                        `db:exec[[UPDATE Deployments SET DeploymentId='${txid.data.result}' WHERE Name='${projectName}']]`,
                        managerProcess,
                    );
                    console.log("result of update id ", updateIdQuery);

                    // update query for updating UnderName
                    const underNameQuery = await runLua(
                        `local res = db:exec[[
                        UPDATE Deployments 
                        SET UnderName = '${txid.data.finalUnderName}' 
                        WHERE Name = '${projectName}'
                    ]]`,
                        managerProcess,
                    );
                    console.log("addedundername", underNameQuery);

                    await refresh();
                    await indexInMalik({
                        projectName: projectName,
                        description: "An awesome decentralized project",
                        txid: txid.data.finalUnderName,
                        owner: activeAddress,
                        link: `https://arweave.net/${txid.data}`,
                        arlink: finalArnsProcess,
                    });

                    if (activeTab === "existing" && arnsName) {
                        setArnsNameWithProcessId(
                            arnsName.processId,
                            txid.data.result,
                        );
                    }

                    navigate(`/deployment/card?repo=${projectName}`);
                } else {
                    toast.error("Deployment failed");
                    console.log(txid);
                }
            } catch (error) {
                clearIntervalPolling();
                setIsFetchingLogs(false);
                setIsWaitingForLogs(false);
                throw new Error("Deplyoment failed, unexpected error");
            }
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 406) {
                setLogError(
                    "Too many requests detected. Please try again later.",
                );

                setDeploymentSucceded(false);
                setDeploymentComplete(false);
                setDeploymentFailed(true);
                return;
            }
            console.error("Deployment error:", error);
            setLogError("Deployment failed");
            setDeploymentSucceded(false);
            setDeploymentComplete(false);
            setDeploymentFailed(true);
        } finally {
            setIsDeploying(false);
            setDeploymentComplete(true);
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
            <h1 className="text-2xl font-bold mb-6">
                Set up ur deployment process
            </h1>
            <div
                className={`rounded-lg ${
                    deploymentStarted
                        ? "opacity-70 pointer-events-none"
                        : "opacity-100"
                } mb-6 my-4`}
            >
                <NewDeploymentCard
                    projectName={projectName}
                    activeTab={activeTab}
                    customArnsName={customArnsName}
                    arnsName={arnsName}
                    selectedBranch={"main"}
                />
            </div>
            <div className="mt-10">
                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-neutral-400 text-sm font-medium mb-1"
                        >
                            Projects name
                        </label>
                        <Input
                            id="name"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Enter your project name here"
                            className="bg-[#0D0D0D]  p-4 placeholder:text-neutral-500 rounded-md mt-3 border-[#383838] text-white"
                            disabled={deploymentStarted}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="branch"
                            className="block text-neutral-400 text-sm font-medium mb-1"
                        >
                            Branch
                        </label>
                        <Input
                            id="Branch"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            placeholder="Enter your project name here"
                            className="bg-[#0D0D0D]  p-4 placeholder:text-neutral-500 rounded-md mt-3 border-[#383838] text-white"
                            disabled={deploymentStarted}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="rootdir"
                            className="block text-neutral-400 text-sm font-medium mb-1"
                        >
                            Root dir
                        </label>
                        <Input
                            id="rootdir"
                            value={rootDir}
                            onChange={(e) => setRootDir(e.target.value)}
                            placeholder="Enter your project root directory"
                            className="bg-[#0D0D0D]  p-4 placeholder:text-neutral-500 rounded-md mt-3 border-[#383838] text-white"
                            disabled={deploymentStarted}
                        />
                    </div>
                    <div>
                        <p className="text-sm pt-4 text-neutral-400 font-medium mb-3">
                            Build And Output Settings
                        </p>
                        <div
                            className={`bg-[#0C0C0C] p-6 rounded-lg mb-6 border border-[#383838] ${
                                deploymentStarted
                                    ? "opacity-70 pointer-events-none"
                                    : "opacity-100"
                            }`}
                        >
                            <div className="space-y-4">
                                <BuildDeploymentSetting
                                    buildSettings={buildSettings}
                                    onSettingChange={handleSettingChange}
                                    disabled={deploymentStarted}
                                />
                            </div>
                        </div>
                    </div>
                    <div
                        className={`${
                            deploymentStarted
                                ? "opacity-70 pointer-events-none"
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
                </div>
            </div>
            <Button
                className="w-full mt-10 bg-white hover:bg-neutral-200 text-black"
                disabled={deploymentStarted}
                onClick={handleDeployProject}
            >
                Deploy now
            </Button>

            {deploymentStarted && (
                <DeploymentLogs
                    logs={logs}
                    isFetchingLogs={isFetchingLogs}
                    isWaitingForLogs={isWaitingForLogs}
                    logError={logError}
                />
            )}
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

export default ConfigureProtocolLandProject;
