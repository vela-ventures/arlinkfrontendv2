import { useEffect, useState } from "react";
import {
    CalendarIcon,
    Check,
    ChevronsUpDown,
    Cog,
    Copy,
    ExternalLink,
    GitBranch,
    GitBranchIcon,
    Github,
    Loader2,
    RefreshCcw,
    SearchIcon,
    Tornado,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import useDeploymentManager, {
    getDeploymentHistory,
} from "@/hooks/useDeploymentManager";
import { Link, useSearchParams } from "react-router-dom";
import { useGlobalState } from "@/store/useGlobalState";
import { DeploymentRecord, TDeployment } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { setArnsName } from "@/lib/ao-vars";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function DeploymentHistory() {
    // hooks

    const { deployments } = useDeploymentManager();
    const [searchParams] = useSearchParams();
    const repoName = searchParams.get("repo");
    const { managerProcess } = useGlobalState();
    const [history, setHistory] = useState<DeploymentRecord[]>([]);
    const [date, setDate] = useState<Date>();
    const foundDeployment = deployments.find((d) => d.Name === repoName);
    const [deploymentName, setDeploymentName] = useState<string>("");

    // loading and error states
    const [loadingDeploymentHistory, setLoadingDeploymentHistory] =
        useState<boolean>(false);
    const [historyError, setHistoryError] = useState<string | null>("");

    if (!foundDeployment) return;

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
            setHistory(history.reverse());
            setLoadingDeploymentHistory(false);
        };

        fetchHistory();
    }, []);

    return (
        <div className="min-h-screen text-neutral-200">
            <div className="container mx-auto px-4 py-10 md:px-10">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold flex items-center tracking-tight text-neutral-100">
                            Deployments
                        </h1>
                        <div className="flex items-center space-x-2 text-sm text-neutral-400">
                            <GitBranchIcon className="h-4 w-4" />
                            <span>Deployment history</span>
                        </div>
                    </div>

                    <Separator />
                    {/* <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                            <Input
                                placeholder="Search deployments..."
                                className="pl-9 w-full bg-arlink-bg-secondary-color border-neutral-800 text-neutral-200 placeholder-neutral-500"
                                onChange={(e) =>
                                    setDeploymentName(e.target.value)
                                }
                                value={deploymentName}
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
                    </div> */}

                    <div className="space-y-2 rounded-md">
                        {loadingDeploymentHistory ? (
                            <>
                                <MinimalDeploymentSkeleton />
                                <MinimalDeploymentSkeleton />
                                <MinimalDeploymentSkeleton />
                                <MinimalDeploymentSkeleton />
                                <MinimalDeploymentSkeleton />
                            </>
                        ) : (
                            history.map((deployment, index) => (
                                <DeploymentHistoryCard
                                    key={index}
                                    deployment={deployment}
                                    currentDeployment={foundDeployment}
                                    index={index}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const DeploymentHistoryCard = ({
    deployment,
    currentDeployment,
    index,
}: {
    deployment: DeploymentRecord;
    currentDeployment: TDeployment;
    index: number;
}) => {
    const [rollBackStarted, setRollBackStarted] = useState(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const [rollBackTransactionIdFetched, setRollBackTransactionIdFetched] =
        useState(false);

    const [transactionId, setTransactionId] = useState<string | null>(null);

    const handleRollBack = async (deploymentID: string) => {
        if (!currentDeployment.ArnsProcess)
            return toast.error("You don't own any arns");
        setRollBackStarted(true);
        const txid = await setArnsName(
            currentDeployment.ArnsProcess,
            deploymentID,
        );

        setRollBackStarted(false);
        if (txid) {
            setTransactionId(deploymentID);
            setRollBackTransactionIdFetched(true);
        } else {
            toast.error("Failed to rollback");
        }
    };

    useEffect(() => {
        if (transactionId) {
            setIsOpen(true);
        }
    }, [transactionId]);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[600px] bg-neutral-950 border border-neutral-800">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-100 text-lg">
                            Your arns will be set shortly
                        </DialogTitle>
                        <DialogDescription className="text-neutral-400 mt-">
                            <div className="pt-2 leading-relaxed">
                                This is the transaction Id
                                <br />
                                <strong className="text-white">
                                    {transactionId}
                                </strong>
                                ,
                                <br />
                                you can use this transactionId to keep the track
                                of your progress
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <div className="col-span-4 text-neutral-100">
                                <span className="text-xs">Link</span>
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
                key={`${deployment.DeploymentID}`}
                className="p-4 sm:p-6 flex flex-col sm:flex-row rounded-md border border-neutral-900 bg-arlink-bg-secondary-color/80 hover:bg-arlink-bg-secondary-color items-start sm:items-center justify-between"
            >
                {/* left - column */}
                <div className="space-y-4 sm:space-y-6 w-full sm:w-auto">
                    <div className="space-y-2">
                        <h3 className="text-lg sm:text-xl flex flex-wrap items-center gap-2 sm:gap-4 font-semibold">
                            {deployment.Name}
                            {index === 0 && (
                                <span className="inline-flex items-center text-sm gap-2">
                                    <span className="size-2 inline-block rounded-full bg-cyan-200" />{" "}
                                    Current
                                </span>
                            )}
                        </h3>
                        <div className="flex flex-col text-sm text-neutral-500 mt-1">
                            <div className="flex-center gap-2">
                                <span className="text-white">Id</span>
                                <span className="pl-4 text-wrap">
                                    {deployment.DeploymentID}
                                </span>
                                <button
                                    type="button"
                                    aria-label="Copy deployment ID"
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                            <div className="flex-center gap-2">
                                <span className="text-white">Live</span>{" "}
                                <Link
                                    to={`https://${currentDeployment?.UnderName}_arlink.arweave.net`}
                                    className="hover:underline"
                                    target="_blank"
                                >
                                    https://
                                    {currentDeployment?.UnderName}
                                    _arlink.arweave.net
                                </Link>
                                <button
                                    type="button"
                                    aria-label="Copy deployment ID"
                                >
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {index !== 0 && (
                            <Dialog>
                                <DialogTrigger>
                                    <Button
                                        size={"sm"}
                                        className="flex items-center -transparent text-sm gap-2 px-4 font-semibold rounded-xl"
                                        disabled={rollBackTransactionIdFetched}
                                    >
                                        <RefreshCcw />
                                        Roll back
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-neutral-950 border-neutral-900 ">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {rollBackTransactionIdFetched
                                                ? "Your roll back is in process"
                                                : "Roll back your changes"}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {rollBackTransactionIdFetched
                                                ? "Roll back is in progress you can close this"
                                                : "Do you want to roll back to this deployment? "}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <div className="w-full ">
                                            {!rollBackTransactionIdFetched ? (
                                                <Button
                                                    className="font-semibold tracking-tight rounded-lg"
                                                    size={"sm"}
                                                    disabled={rollBackStarted}
                                                    onClick={() => {
                                                        handleRollBack(
                                                            deployment.DeploymentID,
                                                        );
                                                    }}
                                                >
                                                    {rollBackStarted && (
                                                        <Loader2 className="animate-spin" />
                                                    )}
                                                    {rollBackStarted
                                                        ? "Saving"
                                                        : "Save"}{" "}
                                                    changes
                                                </Button>
                                            ) : (
                                                <DialogClose>Close</DialogClose>
                                            )}
                                        </div>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                        <Dialog>
                            <DialogTrigger>
                                <Button
                                    size={"sm"}
                                    variant={"outline"}
                                    className="flex items-center bg-transparent text-sm gap-2 px-4 font-semibold rounded-xl"
                                >
                                    <Cog />
                                    Manage arns
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-neutral-950 border-neutral-900">
                                <DialogHeader>
                                    <DialogTitle>
                                        Manage your arns here
                                    </DialogTitle>
                                    <DialogDescription>
                                        <ArnsTabSelector />
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                {/* right - column */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 mt-4 sm:mt-0">
                    {/* first column */}
                    <div className="space-y-4 sm:space-y-8 sm:text-normal text-sm flex flex-col items-start">
                        <Link
                            to={`${currentDeployment.RepoUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center hover:underline cursor-pointer gap-2"
                        >
                            <Github size={20} /> Github
                        </Link>
                        <Link
                            to={`https://arweave.net/${deployment.DeploymentID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center hover:underline cursor-pointer gap-2"
                        >
                            <ExternalLink size={20} /> Visit
                        </Link>
                    </div>
                    <div className="space-y-4 sm:space-y-8 flex flex-col items-start sm:items-end">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center space-x-2 rounded-full bg-neutral-800/30 px-3 py-1">
                                <GitBranch className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-400" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-full bg-neutral-800/30 px-3 py-1">
                                <div className="w-2 h-2 rounded-full bg-neutral-400" />
                                <span className="text-neutral-400 text-sm -translate-y-[1.5px]">
                                    {currentDeployment.Branch}
                                </span>
                            </div>
                        </div>
                        <p className="font-semibold text-sm">
                            {deployment.Date}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

const ArnsTabSelector = () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");

    const frameworks = [
        {
            value: "next.js",
            label: "Next.js",
        },
        {
            value: "sveltekit",
            label: "SvelteKit",
        },
        {
            value: "nuxt.js",
            label: "Nuxt.js",
        },
        {
            value: "remix",
            label: "Remix",
        },
        {
            value: "astro",
            label: "Astro",
        },
    ];
    return (
        <Tabs defaultValue="account" className="w-full mt-4">
            <TabsList className="grid bg-neutral-900 w-full grid-cols-2">
                <TabsTrigger value="account">Switch arns</TabsTrigger>
                <TabsTrigger value="password">Undername</TabsTrigger>
            </TabsList>
            <TabsContent
                value="account"
                className="bg-arlink-bg-secondary-color"
            >
                <Card className="border-none p-0">
                    <CardHeader className="px-2">
                        <CardTitle>Switch arns</CardTitle>
                        <CardDescription>
                            Switch to any arns you own easily
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 px-2">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger
                                className="w-full ring-0 focus-visible:ring-0 focus-visible:ring-transparent bg-arlink-bg-secondary-color"
                                asChild
                            >
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between"
                                >
                                    {value
                                        ? frameworks.find(
                                              (framework) =>
                                                  framework.value === value,
                                          )?.label
                                        : "Select an arns..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] bg-arlink-bg-secondary-color p-0">
                                <Command>
                                    <CommandInput placeholder="Search your anrs" />
                                    <CommandList>
                                        <CommandEmpty>
                                            No framework found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {frameworks.map((framework) => (
                                                <CommandItem
                                                    key={framework.value}
                                                    value={framework.value}
                                                    onSelect={(
                                                        currentValue,
                                                    ) => {
                                                        setValue(
                                                            currentValue ===
                                                                value
                                                                ? ""
                                                                : currentValue,
                                                        );
                                                        setOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            value ===
                                                                framework.value
                                                                ? "opacity-100"
                                                                : "opacity-0",
                                                        )}
                                                    />
                                                    {framework.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </CardContent>
                    <CardFooter className="px-2">
                        <Button
                            size={"sm"}
                            className="flex items-center text-sm gap-2 px-4 font-semibold"
                            onClick={() => setOpen(true)}
                        >
                            Switch arns
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
            <TabsContent value="password">
                <Card className=" border-none p-0">
                    <CardHeader className="px-2">
                        <CardTitle>Undername</CardTitle>
                        <CardDescription>
                            Manage your undername here
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 px-2">
                        <div className="space-y-1">
                            <Label htmlFor="current">Current undername</Label>
                            <Input
                                className="bg-arlink-bg-secondary-color"
                                id="current"
                                type="text"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="new">New undername</Label>
                            <Input
                                className="bg-arlink-bg-secondary-color"
                                id="new"
                                type="text"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="px-2">
                        <Button>Save password</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    );
};

function MinimalDeploymentSkeleton() {
    return (
        <div className="p-4 rounded-md border border-neutral-900 bg-arlink-bg-secondary-color/80">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                {/* Left column */}
                <div className="space-y-4">
                    <Skeleton className="h-6 w-40" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" className="bg-transparent">
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            <Skeleton className="h-4 w-16" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent"
                        >
                            <Skeleton className="h-4 w-24" />
                        </Button>
                    </div>
                </div>
                {/* Right column */}
                <div className="flex flex-col sm:items-end gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Button size="sm" variant="ghost">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        <Skeleton className="h-4 w-16" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
