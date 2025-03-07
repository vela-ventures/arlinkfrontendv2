import { enableAnalytics, getProjectPID } from "@/actions/analytics";
import { Button } from "@/components/ui/button";
import { useGlobalState } from "@/store/useGlobalState";
import { useActiveAddress } from "arweave-wallet-kit";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const Analytics = () => {
    const [searchParams] = useSearchParams();
    const projectName = searchParams.get("repo");
    const deployments = useGlobalState((state) => state.deployments);
    const walletAddress = useActiveAddress();
    const selectedProject = useMemo(() => {
        return deployments.find((project) => project.Name === projectName);
    }, []);

    // process Id states
    const [isCheckingProcessId, setIsCheckingProcessId] =
        useState<boolean>(false);
    const [processId, setProcessId] = useState<string | null>(null);

    //analytics states
    const [enablingAnalytics, setEnablingAnalytics] = useState<boolean>(false);

    // useEffects
    useEffect(() => {
        if (!selectedProject || !walletAddress) return;

        const init = async () => {
            setIsCheckingProcessId(true);
            try {
                const processId = await checkProcessId(selectedProject.Name);
                setProcessId(processId);
                console.log({ processId });
            } catch (error) {
                if (error instanceof Error) {
                    console.error(error);
                    toast.error(error.message);
                }
            } finally {
                setIsCheckingProcessId(false);
            }
        };

        init();
    }, []);

    const checkProcessId = async (projectName: string) => {
        console.log("checking process id...");
        const res = await getProjectPID(projectName);
        if (res.processId === null) {
            throw new Error("process Id is not available");
        }

        if (res.error) {
            throw new Error(res.errorMessage);
        }
        return res.processId;
    };

    const activateAnalytics = async () => {
        if (!selectedProject?.Name || !walletAddress) return;
        setEnablingAnalytics(true);
        await enableAnalytics(selectedProject.Name, walletAddress);
        setEnablingAnalytics(false);
    };

    // conditions
    if (!selectedProject || !projectName || !walletAddress)
        return <div>No project exists with the name ${projectName}</div>;

    return (
        <section>
            <Button
                disabled={isCheckingProcessId || enablingAnalytics}
                onClick={() => {
                    if (!processId) {
                        activateAnalytics();
                    }
                }}
            >
                {enablingAnalytics ? "Enabling..." : "Enable"} analytics
            </Button>
        </section>
    );
};

export default Analytics;
