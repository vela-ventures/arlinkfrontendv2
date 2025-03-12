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
import { Check, ClipboardCopy, Code, LineChart, CopyCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

interface EnableAnalyticsProps {
    walletAddress: string;
    handleEnabledAnalytics: () => void;
    handleProcessId: (value: string) => void;
    processId: string | null;
}

const EnableAnalytics = ({
    walletAddress,
    handleEnabledAnalytics,
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
                <Button
                    className="font-medium mt-4"
                    size="sm"
                    disabled={enablingAnalytics}
                    onClick={() => activateAnalytics(repoName || "default")}
                >
                    {enablingAnalytics ? (
                        <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-white"></div>
                            Enabling...
                        </>
                    ) : (
                        <>
                            <LineChart className="mr-2 h-4 w-4" />
                            Enable Analytics
                        </>
                    )}
                </Button>
            )}
            <div className="w-full border-b border-neutral-800 my-6" />
            {innerProcessId && (
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
            )}
        </div>
    );
};

export default EnableAnalytics;
