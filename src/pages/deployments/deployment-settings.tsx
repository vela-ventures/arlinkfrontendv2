"use client";

import {
    Rocket,
    Trash2,
    RefreshCw,
    ArrowLeft,
    Loader2,
    ChevronDown,
    Check,
    ChevronsUpDown,
    ExternalLink,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BUILDER_BACKEND, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGlobalState } from "@/store/useGlobalState";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { runLua, setArnsName as setArnsNameWithProcessId } from "@/lib/ao-vars";
import { useEffect, useState } from "react";
import useDeploymentManager from "@/hooks/useDeploymentManager";
import axios from "axios";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Logs } from "@/components/ui/logs";
import { handleFetchExistingArnsName, handleFetchLogs } from "../depoly/utilts";
import { useActiveAddress } from "arweave-wallet-kit";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { ArnsName } from "@/types";
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { CommandGroup } from "cmdk";
import DomainSelection from "@/components/shared/domain-selection";

export default function DeploymentSetting() {
    // global states
    const [searchParams] = useSearchParams();
    const { managerProcess, deployments, refresh } = useDeploymentManager();
    const repo = searchParams.get("repo");
    const navigate = useNavigate();
    const globalState = useGlobalState();
    const deployment = globalState.deployments.find((d) => d.Name === repo);

    // setting states
    const [activeTab, setActiveTab] = useState("redeploy");
    const [showSidebar, setShowSidebar] = useState(true);
    const [error, setError] = useState<string>("");

    // loading state
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [isRedeploying, setIsRedeploying] = useState<boolean>(false);
    const [buildOutput, setBuildOutput] = useState<string[]>([]);
    const [isWaitingForLogs, setIsWaitingForLogs] = useState<boolean>(false);
    const [isFetchingLogs, setIsFetchingLogs] = useState<boolean>(false);

    //logs
    const [logs, setLogs] = useState<string[]>([]);
    const [logError, setLogError] = useState<string>("");
    const [accordionValue, setAccordionValue] = useState<string | undefined>(
        undefined,
    );

    const toggleSidebar = () => setShowSidebar(!showSidebar);
    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
        setShowSidebar(false);
    };

    // arns data
    const activeAddress = useActiveAddress();
    // const [arnsNames, setArnsNames] = useState<ArnsName[]>([
    //     { name: "my-app-1.arweave", processId: "process-123" },
    //     { name: "my-app-2.arweave", processId: "process-456" },
    //     { name: "test-app.arweave", processId: "process-789" },
    //     { name: "demo-app.arweave", processId: "process-012" },
    // ]);

    const [arnsNames, setArnsNames] = useState<ArnsName[]>([]);
    const [existingArnsLoading, setExistingArnsLoading] =
        useState<boolean>(false);
    const [arnsDropdownModal, setArnsDropDownModal] = useState(false);
    const [arnsName, setArnsName] = useState<ArnsName | undefined>(undefined);
    const [arnsProcess, setArnsProcess] = useState<string | undefined>(
        undefined,
    );
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [updatingArns, setUpdatingArns] = useState<boolean>(false);

    async function deleteDeployment() {
        setIsDeleting(true);
        if (!deployment) return toast.error("Deployment not found");
        if (!globalState.managerProcess)
            return toast.error("Manager process not found");

        const query = `local res = db:exec[[
          DELETE FROM Deployments
          WHERE Name = '${deployment.Name}'
        ]]`;

        try {
            const res = await runLua(query, globalState.managerProcess);
            if (res.Error) {
                toast.error(res.Error);
                setError("Failed to delete deployment. Please try again.");
                return;
            }
            console.log(res);
            await refresh();

            toast.success("Deployment deleted successfully");
            navigate("/dashboard");
        } catch (error) {
            console.error("Error deleting deployment:", error);
            toast.error("An error occurred while deleting the deployment");
            setError("Failed to delete deployment. Please try again later.");
        } finally {
            setIsDeleting(false);
        }
    }

    async function redeploy() {
        if (!deployment) return;
        const projName = deployment.Name;
        const repoUrl = deployment.RepoUrl;
        const installCommand = deployment.InstallCMD;
        const buildCommand = deployment.BuildCMD;
        const outputDir = deployment.OutputDIR;
        const arnsProcess = deployment.ArnsProcess;
        const branch = deployment.Branch || "main";
        setIsRedeploying(true);
        setBuildOutput([]);
        setError("");

        try {
            handleFetchLogs({
                projectName: projName,
                repoUrl,
                setLogs,
                setIsWaitingForLogs,
                setIsFetchingLogs,
                isWaitingForLogs,
                setLogError,
            });
            const txid = await axios.post(`${BUILDER_BACKEND}/deploy`, {
                repository: repoUrl,
                branch,
                installCommand,
                buildCommand,
                outputDir,
                subDirectory: "./",
            });

            if (txid.status == 200) {
                toast.success("Deployment successful");

                await runLua("", arnsProcess, [
                    { name: "Action", value: "Set-Record" },
                    { name: "Sub-Domain", value: "@" },
                    { name: "Transaction-Id", value: txid.data },
                    { name: "TTL-Seconds", value: "3600" },
                ]);

                await runLua(
                    `db:exec[[UPDATE Deployments SET DeploymentId='${txid.data}' WHERE Name='${projName}']]`,
                    globalState.managerProcess,
                );

                navigate(`/deployment?repo=${projName}`);
                await refresh();
            } else {
                toast.error("Deployment failed");
                console.log(txid);
                setError("Deployment failed. Please try again.");
            }
        } catch (error) {
            toast.error("Deployment failed");
            console.log(error);
            setError(
                "An error occurred during deployment. Please try again later.",
            );
        } finally {
            setIsRedeploying(false);
        }
    }

    useEffect(() => {
        console.log(arnsNames);
    }, [arnsNames]);

    async function handleArnsSelection(arnsName: ArnsName) {
        setArnsProcess(arnsName.processId);
        setArnsName(
            arnsNames.find((arns) => arns.processId === arnsName.processId),
        );
        setArnsDropDownModal(false);
    }

    useEffect(() => {
        if (isFetchingLogs) {
            setAccordionValue("item-1");
        }
    }, [isFetchingLogs]);

    const handleFetchArns = async () => {
        await handleFetchExistingArnsName({
            setArnsNames,
            activeAddress,
            setExistingArnsLoading,
        });
    };

    useEffect(() => {
        handleFetchArns();
    }, []);

    const hanldeUpdateArns = async () => {
        try {
            setUpdatingArns(true);
            if (!arnsName) toast.error("select an arns name");
            if (deployment && arnsName) {
                const txid = await setArnsNameWithProcessId(
                    arnsName.processId,
                    deployment.DeploymentId,
                );
                setTransactionId(txid);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setUpdatingArns(false);
        }
    };

    useEffect(() => {
        if (transactionId) {
            setIsOpen(true);
        }
    }, [transactionId]);

    return (
        <div className="flex flex-col z-0 md:py-8 md:flex-row container bg-black min-h-[80vh]">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px] bg-neutral-950 border border-neutral-800">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-100">
                            Your arns will be set shortly
                        </DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            This is the transactionId{" "}
                            <strong>{transactionId}</strong>, you can use this
                            transactionId to keep the track of your progress
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <div className="col-span-4 text-neutral-100">
                                Link
                                <div className="hover:underline pt-1 text-neutral-300">
                                    <Link
                                        to={`https://www.ao.link/#/message/${transactionId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex text-sm hover:underline items-center gap-2 hover:text-neutral-100 transition-colors duration-200"
                                    >
                                        Check to see the progress
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setTransactionId(null);
                                setIsOpen(false);
                            }}
                            className="bg-neutral-800 text-neutral-100 border-neutral-700 hover:bg-neutral-700 hover:text-neutral-100"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <div
                className={cn(
                    "w-full md:w-48 z-20 border-neutral-800 md:p-4",
                    showSidebar ? "block" : "hidden md:block",
                    "md:static inset-0 z-50 py-4 bg-black md:bg-transparent",
                )}
            >
                <nav className="space-y-1">
                    {["redeploy", "delete", "configure-arns"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabClick(tab)}
                            className={cn(
                                "flex items-center w-full md:px-3 py-2 text-sm rounded-md transition-colors",
                                activeTab === tab
                                    ? "md:bg-neutral-800 md:text-neutral-100"
                                    : "text-neutral-400 md:hover:bg-neutral-800/50 md:hover:text-neutral-100",
                            )}
                        >
                            {tab === "redeploy" && (
                                <Rocket className="mr-2 h-4 w-4" />
                            )}
                            {tab === "delete" && (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            {tab === "configure-arns" && (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {tab.charAt(0).toUpperCase() +
                                tab.slice(1).replace("-", " ")}
                        </button>
                    ))}
                </nav>
            </div>

            <div
                className={cn(
                    "flex-1 rounded-md mt-4 md:px-4 md:py-4 md:mt-0",
                    showSidebar ? "hidden md:block" : "block",
                )}
            >
                <div className="md:hidden mb-4 flex justify-between items-center">
                    {!showSidebar && (
                        <Button
                            className="bg-transparen p-0 hover:bg-transparent text-neutral-400"
                            onClick={toggleSidebar}
                        >
                            <ArrowLeft />
                            Go back
                        </Button>
                    )}
                </div>

                {activeTab === "redeploy" && (
                    <>
                        <div className="space-y-1">
                            <h2 className="text-2xl md:text-3xl font-bold text-neutral-100">
                                Redeploy
                            </h2>
                            <p className="text-sm text-neutral-400">
                                Are you sure you want to redeploy your
                                application?
                            </p>
                        </div>
                        <Button
                            className="bg-neutral-800 mt-4 text-neutral-100 hover:bg-neutral-700"
                            disabled={isRedeploying}
                            onClick={redeploy}
                        >
                            {isRedeploying ? (
                                <div className="flex items-center gap-4">
                                    <Loader2 className="animate-spin" />
                                    Deploying
                                </div>
                            ) : (
                                <p>Redeploy</p>
                            )}
                        </Button>
                        <div className="space-y-2 w-full mt-8">
                            <Accordion
                                type="single"
                                value={accordionValue}
                                onValueChange={setAccordionValue}
                                collapsible
                                className="w-full"
                            >
                                <AccordionItem
                                    value="item-1"
                                    className="rounded-lg w-full bg-neutral-950 border border-neutral-900 overflow-hidden"
                                >
                                    <AccordionTrigger className="p-4 w-full">
                                        <div className="flex items-center w-full justify-between">
                                            <div className="pl-2">
                                                Build logs
                                            </div>
                                            {isWaitingForLogs && (
                                                <div className="text-xs flex items-center pr-4 gap-2">
                                                    <Loader2 className="text-neutral-600 animate-spin" />
                                                    <span className="text-neutral-200">
                                                        Build is starting
                                                    </span>
                                                </div>
                                            )}
                                            {isFetchingLogs && (
                                                <div className="text-xs flex items-center pr-4 gap-2">
                                                    <Loader2 className="text-neutral-600 animate-spin" />
                                                    <span className="text-neutral-200">
                                                        Fetching logs
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Logs logs={logs} />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </>
                )}

                {activeTab === "delete" && (
                    <>
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-bold text-neutral-100">
                                Delete
                            </h2>
                            <p className="text-sm text-neutral-400">
                                Are you sure you want to delete your
                                application? This action cannot be undone.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="mt-4"
                                    variant="destructive"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <div className="flex items-center gap-4">
                                            <Loader2 className="animate-spin" />
                                            Deleting
                                        </div>
                                    ) : (
                                        <p>Delete Project</p>
                                    )}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will
                                        permanently delete your deployment.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-700 hover:bg-red-800 text-white font-bold"
                                        onClick={deleteDeployment}
                                    >
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}

                {activeTab === "configure-arns" && (
                    <>
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-bold text-neutral-100">
                                Configure Arns
                            </h2>
                            <div className="space-y-2">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="current"
                                        className="text-sm text-neutral-400"
                                    >
                                        Current ARN
                                    </Label>
                                    <Input
                                        id="current"
                                        value={deployment?.UnderName}
                                        placeholder="current arns will be displayed here?"
                                        className="bg-neutral-900 border-neutral-800 text-neutral-100 text-xs md:text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="current"
                                        className="text-sm pt-2 text-neutral-400"
                                    >
                                        Available arns
                                    </Label>
                                    {existingArnsLoading ? (
                                        <Skeleton className="w-full flex items-center justify-between gap-3 px-3 h-10 text-center focus:ring-0 focus:ring-offset-0 outline-none  bg-neutral-900 border-[#383838] text-white">
                                            <div className="flex items-center gap-3">
                                                Fetching existing arns
                                                <Loader2
                                                    size={15}
                                                    className="animate-spin"
                                                />
                                            </div>
                                            <ChevronDown size={15} />
                                        </Skeleton>
                                    ) : (
                                        <div>
                                            <Popover
                                                open={arnsDropdownModal}
                                                onOpenChange={
                                                    setArnsDropDownModal
                                                }
                                            >
                                                <PopoverTrigger
                                                    className="w-full border  bg-arlink-bg-secondary-color border-neutral-700"
                                                    asChild
                                                >
                                                    <Button
                                                        variant="outline"
                                                        aria-expanded={
                                                            arnsDropdownModal
                                                        }
                                                        className=" justify-between"
                                                    >
                                                        {arnsName
                                                            ? arnsName.name
                                                            : "Select an arns name"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="p-0 transition-all border-[#383838] bg-arlink-bg-secondary-color
                                                 w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height]
                                             "
                                                >
                                                    <Command className="w-full bg-arlink-bg-secondary-color">
                                                        <CommandInput placeholder="Select an existing arns..." />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                No arns found.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {arnsNames.map(
                                                                    (
                                                                        arnsObj,
                                                                    ) => (
                                                                        <CommandItem
                                                                            key={
                                                                                arnsObj.processId
                                                                            }
                                                                            value={
                                                                                arnsObj.name
                                                                            }
                                                                            className="transition-all duration-75"
                                                                            onSelect={() => {
                                                                                handleArnsSelection(
                                                                                    {
                                                                                        processId:
                                                                                            arnsObj.processId,
                                                                                        name: arnsObj.name,
                                                                                    },
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    arnsName?.name ===
                                                                                        arnsObj.name
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0",
                                                                                )}
                                                                            />
                                                                            {
                                                                                arnsObj.name
                                                                            }
                                                                        </CommandItem>
                                                                    ),
                                                                )}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={hanldeUpdateArns}
                            className="bg-neutral-800 mt-4 text-neutral-100 hover:bg-neutral-700"
                            disabled={updatingArns}
                        >
                            {updatingArns ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating ARN...
                                </>
                            ) : (
                                "Update ARN"
                            )}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
