import { enableAnalytics } from "@/actions/analytics";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Check,
    ClipboardCopy,
    Code,
    LineChart,
    CopyCheck,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useSearchParams } from "react-router-dom";

interface EnableAnalyticsProps {
    walletAddress: string;
    handleProcessId: (value: string) => void;
    processId: string | null;
}

const EnableAnalytics = ({
    walletAddress,
    handleProcessId,
    processId,
}: EnableAnalyticsProps) => {
    const [enablingAnalytics, setEnablingAnalytics] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [searchParams] = useSearchParams();
    const repoName = searchParams.get("repo") || "Default Project";
    const [innerProcessId, setInnerProcessId] = useState<string | null>(
        processId,
    );

    const scriptTag = `<script type="module" src="https://analytics_arlink.ar.io/browser.js" 
    data-process-id="${processId}" 
    data-track-url-hashes="true" 
    data-debug="true"></script>`;

    const activateAnalytics = async (projectName: string) => {
        if (!walletAddress) return;
        setEnablingAnalytics(true);
        try {
            const result = await enableAnalytics(projectName, walletAddress);
            if (result) {
                setInnerProcessId(result);
            }
        } catch (error) {
            console.log(error);
            console.error("Failed to enable analytics:", error);
        } finally {
            setEnablingAnalytics(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(scriptTag);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const scriptLines = scriptTag
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    return (
        <div className="space-y-6">
            {!innerProcessId && (
                <div className="flex items-center gap-2 pt-4">
                    <Button
                        className="font-semibold hover:bg-neutral-400"
                        size="sm"
                        disabled={enablingAnalytics}
                        onClick={() => activateAnalytics(repoName || "default")}
                    >
                        {enablingAnalytics ? (
                            <>
                                <div className=" h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-white"></div>
                                Enabling...
                            </>
                        ) : (
                            <>
                                <LineChart className=" h-4 w-4" />
                                Enable
                            </>
                        )}
                    </Button>
                    <Link
                        to="/hello"
                        className="text-sm transition-all flex items-center gap-1 px-4 rounded-md py-2 hover:bg-neutral-800"
                    >
                        Learn More
                        <ExternalLink
                            size={15}
                            className="-translate-y-[0.3]"
                        />
                    </Link>
                </div>
            )}
            <div className="w-full border-b border-neutral-800 my-6" />
            {innerProcessId ? (
                <motion.div
                    initial={{
                        opacity: 0,
                        translateY: 50,
                    }}
                    animate={{
                        opacity: 1,
                        translateY: 0,
                    }}
                >
                    <Card className="bg-arlink-bg-secondary-color border-neutral-800 hover:border-neutral-700 group transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-2xl font-semibold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Code className="h-5 w5" />
                                    {repoName}
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-neutral-400">
                                Add this script at the very end in your HTML to
                                enable Arlink analytics on your website:
                            </p>

                            <motion.div
                                className="relative mt-2 hover:border-neutral-600 rounded-md border border-neutral-800 bg-black/50 p-4 overflow-hidden"
                                initial={{ opacity: 0.9 }}
                                animate={{ opacity: 1 }}
                                onHoverStart={() => setIsHovered(true)}
                                onHoverEnd={() => setIsHovered(false)}
                            >
                                <div className="flex">
                                    {/* Line numbers */}
                                    <div className="pr-4 space-y-1 text-neutral-500 select-none border-r border-neutral-800 mr-4">
                                        {scriptLines.map((_, index) => (
                                            <div
                                                key={index}
                                                className="text-xs font-mono"
                                            >
                                                {index + 1}
                                            </div>
                                        ))}
                                    </div>

                                    <pre className="text-xs sm:text-sm font-mono text-neutral-300 overflow-x-auto w-full">
                                        <code className="language-markup">
                                            {scriptTag}
                                        </code>
                                    </pre>
                                </div>

                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-black/30 flex items-center justify-center"
                                        >
                                            <motion.div
                                                initial={{ scale: 0.9 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0.9 }}
                                                className="bg-neutral-900 border border-neutral-700 rounded-lg p-2 shadow-xl"
                                            >
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className={cn(
                                                        "bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700",
                                                        copied &&
                                                            "bg-green-900/50 text-green-400 border-green-800",
                                                    )}
                                                    onClick={copyToClipboard}
                                                >
                                                    {copied ? (
                                                        <>
                                                            <CopyCheck className="h-4 w-4 mr-2" />
                                                            Copied to clipboard
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ClipboardCopy className="h-4 w-4 mr-2" />
                                                            Copy script tag
                                                        </>
                                                    )}
                                                </Button>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Copy button always visible */}
                                <motion.div
                                    className="absolute top-3 right-3"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={cn(
                                            "h-8 w-8 rounded-full bg-neutral-800/80 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200",
                                            copied &&
                                                "bg-green-900/20 text-green-500 hover:bg-green-900/30 hover:text-green-400",
                                        )}
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <ClipboardCopy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </motion.div>

                                <AnimatePresence>
                                    {copied && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute -top-8 right-3 text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded"
                                        >
                                            Copied!
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </CardContent>
                        <CardFooter className="flex gap-2 justify-between">
                            <Button
                                size="sm"
                                onClick={() => handleProcessId(innerProcessId)}
                            >
                                Done
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-neutral-700 hover:bg-neutral-800"
                            >
                                View Documentation
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            ) : (
                <AnalytisSkeleton />
            )}
        </div>
    );
};

const AnalytisSkeleton = () => {
    const barChartsData = [
        {
            title: "Global Traffic",
            description: "Where your visitors are coming from",
            data: [
                { name: "USA", value: 40 },
                { name: "Canada", value: 20 },
                { name: "Germany", value: 15 },
                { name: "Japan", value: 10 },
                { name: "France", value: 9 },
                { name: "Others", value: 6 },
            ],
        },
        {
            title: "Most Used Browser",
            description: "Track the browser used to access your site",
            data: [
                { name: "Chrome", value: 40 },
                { name: "Brave", value: 20 },
                { name: "Zen", value: 15 },
                { name: "Safari", value: 10 },
                { name: "Mozilla", value: 9 },
                { name: "Others", value: 6 },
            ],
        },
        {
            title: "Top Wallets",
            description: "Crypto wallets that your visitors have installed",
            data: [
                { name: "ArConnect", value: 40 },
                { name: "Phantom", value: 20 },
                { name: "Meta mask", value: 15 },
                { name: "Japan", value: 10 }, // Note: This looks like a data error in your original
                { name: "France", value: 9 }, // Note: This looks like a data error in your original
                { name: "Others", value: 6 },
            ],
        },
    ];
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-9 gap-4 h-[175px]">
                <div className="rounded-xl  flex gap-3 p-4 transition-all col-span-3 border hover:border-neutral-600 border-neutral-800 ">
                    <header className="text-sm flex flex-col gap-2">
                        <div className="text-neutral-200 font-semibold text-base">
                            Page Views
                        </div>
                        <div className="h-full  bg-neutral-900 rounded-md"></div>
                    </header>
                    <section className="flex-1 h-full bg-neutral-900 rounded-md"></section>
                </div>
                <div className="rounded-xl  flex gap-3 p-4 transition-all col-span-3 border hover:border-neutral-600 border-neutral-800 ">
                    <header className="text-sm flex flex-col gap-2">
                        <div className="text-neutral-200 font-semibold text-base">
                            Top Visitors
                        </div>
                        <div className="h-full  bg-neutral-900 rounded-md"></div>
                    </header>
                    <section className="flex-1 h-full bg-neutral-900 rounded-md"></section>
                </div>
                <div className="rounded-xl  flex gap-3 p-4 transition-all col-span-3 border hover:border-neutral-600 border-neutral-800 ">
                    <header className="text-sm flex flex-col gap-2">
                        <div className="text-neutral-200 font-semibold text-base">
                            Avg Load Time
                        </div>
                        <div className="h-full  bg-neutral-900 rounded-md"></div>
                    </header>
                    <section className="flex-1 h-full bg-neutral-900 rounded-md"></section>
                </div>
            </div>
            <div className="grid grid-cols-12 h-[400px] gap-4">
                <div className="rounded-xl p-5 flex flex-col gap-4 transition-all col-span-5 border hover:border-neutral-600 border-neutral-800 h-full">
                    <header className="space-y-0.5">
                        <div className="text-xl font-semibold">Page views</div>
                        <p className="text-sm text-neutral-400">
                            Total number of time your page has been accessed
                        </p>
                    </header>
                    <section className="flex-1 bg-neutral-900 rounded-md"></section>
                </div>
                <div className="rounded-xl p-5 flex flex-col gap-4 transition-all col-span-7 border hover:border-neutral-600 border-neutral-800 h-full">
                    <header className="space-y-0.5">
                        <div className="text-xl font-semibold">
                            Global Traffic
                        </div>
                        <p className="text-sm text-neutral-400">
                            Track visitor distribution with an interactive world
                            map
                        </p>
                    </header>
                    <section className="flex-1 bg-neutral-900 rounded-md"></section>
                </div>
            </div>
            <div className="grid grid-cols-9 h-[400px] gap-4">
                {barChartsData.map((chart, index) => (
                    <AnalyticsBarChart
                        key={index}
                        title={chart.title}
                        description={chart.description}
                        data={chart.data}
                    />
                ))}
            </div>
            <div className="grid grid-cols-12 h-[400px] gap-4">
                <div className="rounded-xl p-5 flex flex-col gap-4 transition-all col-span-5 border hover:border-neutral-600 border-neutral-800 h-full">
                    <header className="space-y-0.5">
                        <div className="text-xl font-semibold">Top Pages</div>
                        <p className="text-sm text-neutral-400">
                            See your most visited pages at glance{" "}
                        </p>
                    </header>
                    <section className="flex-1 bg-neutral-900 rounded-md"></section>
                </div>
                <div className="rounded-xl p-5 flex flex-col gap-4 transition-all col-span-7 border hover:border-neutral-600 border-neutral-800 h-full">
                    <header className="space-y-0.5">
                        <div className="text-xl font-semibold">
                            Recent Activity
                        </div>
                        <p className="text-sm text-neutral-400">
                            Latest visitor interactions
                        </p>
                    </header>
                    <section className="flex-1 bg-neutral-900 rounded-md"></section>
                </div>
            </div>{" "}
        </div>
    );
};

const AnalyticsBarChart = ({ title, description, data }) => {
    return (
        <div className="rounded-xl justify-between flex flex-col p-5 gap-4 transition-all col-span-3 border hover:border-neutral-600 border-neutral-800 h-full">
            <header className="space-y-0.5">
                <div className="text-xl font-semibold">{title}</div>
                <p className="text-sm text-neutral-400">{description}</p>
            </header>
            <section className="flex flex-col gap-2">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className="h-[40px] w-full relative rounded-md items-center p-2 flex justify-between"
                    >
                        <span className="text-lg relative z-10 font-medium">
                            {item.name}
                        </span>
                        <span className="text-lg relative z-10 font-medium">
                            {item.value}%
                        </span>
                        <div
                            className="bg-neutral-900 absolute inset-0 rounded-md"
                            style={{ width: `${item.value}%` }}
                        ></div>
                    </div>
                ))}
            </section>
        </div>
    );
};
export default EnableAnalytics;
