import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Logs } from "@/components/ui/logs";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const DeployingLogs = ({
    logs,
    logError,
    isFetchingLogs,
    isWaitingForLogs,
}: {
    logs: string[];
    logError: string;
    isFetchingLogs: boolean;
    isWaitingForLogs: boolean;
}) => {
    const [accordionValue, setAccordionValue] = useState<string | undefined>(
        undefined,
    );

    useEffect(() => {
        if (isFetchingLogs) {
            setAccordionValue("item-1");
        }
    }, [isFetchingLogs]);

    return (
        <div className="bg-arlink-bg-secondary-color p-6 rounded-lg mt-6 border border-[#383838]">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                    Deployment Process
                </h2>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm flex items-center gap-3 text-yellow-200">
                    <AlertTriangle className="text-yellow-400 flex-shrink-0 animate-pulse" />
                    <span>
                        Please keep this tab open during deployment. We're experiencing high traffic and deployments may take longer than usual.
                    </span>
                </p>
            </div>
            <div className="space-y-2 w-full">
                <Accordion
                    type="single"
                    value={accordionValue}
                    onValueChange={setAccordionValue}
                    collapsible
                    className="w-full"
                >
                    <AccordionItem
                        value="item-1"
                        className="rounded-lg w-full border overflow-hidden"
                    >
                        <AccordionTrigger className="p-4 w-full">
                            <div className="flex items-center w-full justify-between">
                                <div className="pl-2">Build logs</div>
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

            {logError !== "Waiting for logs..." && logError && (
                <div className=" border px-4 py-2 mt-3 rounded-md">
                    <p className="text-md font-medium">Deployment Error</p>
                    <p className="text-sm text-red-500 font-medium">
                        {logError}
                    </p>
                </div>
            )}
        </div>
    );
};

export default DeployingLogs;
