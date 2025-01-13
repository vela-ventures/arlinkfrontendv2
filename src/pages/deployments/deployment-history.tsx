import { useEffect, useState } from "react";
import {
    CalendarIcon,
    GitBranchIcon,
    Loader2,
    MoreHorizontalIcon,
    SearchIcon,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import useDeploymentManager, {
    getDeploymentHistory,
} from "@/hooks/useDeploymentManager";
import { useSearchParams } from "react-router-dom";
import { useGlobalState } from "@/store/useGlobalState";
import { DeploymentRecord } from "@/types";

interface Deployment {
    ID: number;
    Name: string;
    DeploymentID: string;
    AssignedUndername: string | null;
    Date: string;
    RepoUrl: string;
    Branch: string;
}

// const deployments: Deployment[] = [
//     {
//         ID: 1,
//         Name: "Project A",
//         DeploymentID: "dep_123",
//         AssignedUndername: "user1",
//         Date: "2025-01-13",
//         RepoUrl: "https://github.com/user/project-a",
//         Branch: "main",
//     },
//     {
//         ID: 2,
//         Name: "Project B",
//         DeploymentID: "dep_456",
//         AssignedUndername: "user2",
//         Date: "2025-01-12",
//         RepoUrl: "https://github.com/user/project-b",
//         Branch: "develop",
//     },
// ];

export default function DeploymentHistory() {
    // hooks

    const { deployments } = useDeploymentManager();
    const [searchParams] = useSearchParams();
    const repoName = searchParams.get("repo");
    const { managerProcess } = useGlobalState();
    const [history, setHistory] = useState<DeploymentRecord[]>([]);
    const [date, setDate] = useState<Date>();
    const foundDeployment = deployments.find((d) => d.Name === repoName);
    console.log(deployments);
    console.log({
        foundDeployment: foundDeployment?.Name,
        repoName,
    });

    // loading and error states
    const [loadingDeploymentHistory, setLoadingDeploymentHistory] =
        useState<boolean>(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    useEffect(() => {
        if (!repoName || !foundDeployment) return;
        const fetchHistory = async () => {
            setLoadingDeploymentHistory(true);
            const { history, error } = await getDeploymentHistory(
                foundDeployment?.Name,
                managerProcess,
            );

            console.log(history);
            if (error) {
                setHistoryError(error?.message);
            }
            setHistory(history);
            setLoadingDeploymentHistory(false);
        };

        fetchHistory();
    }, []);

    return (
        <div className="min-h-screen text-neutral-200">
            <div className="container mx-auto px-8 py-10 md:px-10">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold flex items-center tracking-tight text-neutral-100">
                            {loadingDeploymentHistory && (
                                <Loader2 className="animate-spin" />
                            )}
                            Deployments
                        </h1>
                        <div className="flex items-center space-x-2 text-sm text-neutral-400">
                            <GitBranchIcon className="h-4 w-4" />
                            <span>Deployment history</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                            <Input
                                placeholder="Search deployments..."
                                className="pl-9 w-full bg-arlink-bg-secondary-color border-neutral-800 text-neutral-200 placeholder-neutral-500"
                            />
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-[240px] justify-start text-left font-normal bg-arlink-bg-secondary-color border-neutral-800 text-neutral-200"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? (
                                            format(date, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0 bg-arlink-bg-secondary-color border-neutral-800"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        className="bg-arlink-bg-secondary-color text-neutral-200"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="space-y-4 sm:space-y-0 rounded-md sm:border-2 border-neutral-900 overflow-hidden">
                        {history.map((deployment, index) => (
                            <div
                                key={deployment.ID}
                                className="bg-arlink-bg-secondary-color sm:hover:bg-neutral-900 transition-colors"
                            >
                                <div
                                    className={`flex flex-col  sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 space-y-4 sm:space-y-0 sm:space-x-4 rounded-lg shadow-sm sm:rounded-none ${
                                        deployments.length === index + 1
                                            ? "sm:border-none"
                                            : "sm:border-b border border-neutral-900"
                                    } sm:shadow-none`}
                                >
                                    {/* Left Section */}
                                    <div className="space-y-1 sm:space-y-0.5">
                                        <div className="flex items-center justify-between sm:justify-start sm:space-x-2">
                                            <span className="font-semibold text-neutral-100">
                                                {deployment.Name}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <div className="flex items-center space-x-2 text-sm text-neutral-500">
                                                <GitBranchIcon className="size-3" />
                                                <span>main</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1 sm:flex-1">
                                        <span className="hidden text-xs sm:inline">
                                            {format(
                                                new Date(deployment.Date),
                                                "MMM d, yyyy",
                                            )}
                                        </span>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <span className="font-semibold">
                                                Transaction id:&nbsp;
                                            </span>
                                            <span className="font-mono text-neutral-400">
                                                {deployment.DeploymentID}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                                        <div className="text-sm text-neutral-400 sm:text-right">
                                            <div className="sm:hidden">
                                                {format(
                                                    new Date(deployment.Date),
                                                    "MMM d, yyyy",
                                                )}
                                            </div>
                                            <div>
                                                {deployment.AssignedUndername}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-300 hover:bg-neutral-800"
                                                >
                                                    <MoreHorizontalIcon className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Open menu
                                                    </span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="bg-arlink-bg-secondary-color border-neutral-800 text-neutral-200"
                                            >
                                                <DropdownMenuItem>
                                                    revert
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    assign undername
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
