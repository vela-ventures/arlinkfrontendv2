import { spawnReportProcess } from "@/hooks/use-report-manager";
import { runLua, spawnProcess } from "@/lib/ao-vars";
import { connect, createDataItemSigner } from "@permaweb/aoconnect";
import { toast } from "sonner";

const REGISTRY_PROCESS = "92kbvqIMFG6qKb3gKRBV6bbK58bJZSaB3Ls6xkKrnM4";

type GetProcessPIDResponse = {
    messageId: string;
    processId: string | null;
    error: boolean;
    errorMessage?: string;
};

export async function getProjectPID(
    projectName: string,
    managerProcess: string = REGISTRY_PROCESS,
): Promise<GetProcessPIDResponse> {
    const TARGET_PROCESS = managerProcess;
    const ao = connect();

    try {
        const message = await ao.message({
            process: TARGET_PROCESS,
            tags: [
                { name: "Action", value: "GetProjectPID" },
                { name: "Projectname", value: projectName },
                {
                    name: "walletaddr",
                    value: await window.arweaveWallet.getActiveAddress(),
                },
            ],
            signer: createDataItemSigner(window.arweaveWallet),
        });

        const { Messages, Error } = await ao.result({
            message: message,
            process: TARGET_PROCESS,
        });

        if (Messages && Messages.length > 0) {
            const status = Messages[0].Tags.Status;

            if (status === "Success") {
                return {
                    messageId: message,
                    processId: Messages[0].Data,
                    error: false,
                };
            } else {
                return {
                    messageId: message,
                    processId: null,
                    error: true,
                    errorMessage: Messages[0].Data,
                };
            }
        }

        if (Error) {
            return {
                messageId: message,
                processId: null,
                error: true,
                errorMessage: Error,
            };
        }

        return {
            messageId: message,
            processId: null,
            error: true,
            errorMessage: "No response received",
        };
    } catch (error) {
        console.error("Failed to fetch project PID:", error);
        throw error;
    }
}

export async function enableAnalytics(
    projectName: string,
    walletAddress: string,
) {
    try {
        const pid = await spawnReportProcess(projectName);
        const registration = await registerProject(
            projectName,
            pid,
            walletAddress,
        );

        if (registration.success) {
            return pid;
        }
    } catch (error) {
        throw new Error("failed to enable analytics");
    }
}

interface RegisterProjectReturnType {
    messageId: string | null;
    success: boolean;
    error: string | null;
}

export async function registerProject(
    projectName: string,
    processId: string,
    walletAddress: string,
): Promise<RegisterProjectReturnType> {
    const TARGET_PROCESS = REGISTRY_PROCESS;
    const ao = connect();

    try {
        // Send registration message
        const message = await ao.message({
            process: TARGET_PROCESS,
            tags: [
                { name: "Action", value: "RegisterProject" },
                { name: "Projectname", value: projectName },
                { name: "ProcessID", value: processId },
                { name: "walletaddr", value: walletAddress },
            ],
            signer: createDataItemSigner(window.arweaveWallet),
        });

        console.log("Registration message sent with ID:", message);

        const { Messages, Error } = await ao.result({
            message: message,
            process: TARGET_PROCESS,
        });

        if (Messages && Messages.length > 0) {
            return {
                messageId: message,
                success: Messages[0].Tags.Status === "Success",
                error: null,
            };
        }

        if (Error) {
            return {
                messageId: message,
                success: false,
                error: Error,
            };
        }

        return {
            messageId: message,
            success: false,
            error: "No response received",
        };
    } catch (error) {
        console.error("Failed to register project:", error);
        throw error;
    }
}
