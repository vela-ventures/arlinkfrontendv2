import { checkProcessId } from "@/actions/analytics";
import AnalyticsOverview from "@/components/analytics/analytics-overview";
import EnableAnalytics from "@/components/analytics/enable-analytics";
import AnalyticsDashboardSkeleton from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalState } from "@/store/useGlobalState";
import { useActiveAddress } from "arweave-wallet-kit";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const Analytics = () => {
    const [searchParams] = useSearchParams();
    const projectName = searchParams.get("repo");
    const deployments = useGlobalState((state) => state.deployments);
    const selectedProject = useMemo(() => {
        return deployments.find((project) => project.Name === projectName);
    }, []);
    const walletAddress = useActiveAddress();
    const [completedAnalyticsProcess, setCompletedAnalyticsProcess] =
        useState<boolean>(false);

    // process Id states
    const [isCheckingProcessId, setIsCheckingProcessId] =
        useState<boolean>(false);
    const [processId, setProcessId] = useState<string | null>(null);

    const handleProcessId = (value: string) => {
        setProcessId(value);
    };

    // useEffects
    useEffect(() => {
        if (!selectedProject || !walletAddress) return;

        const init = async () => {
            setIsCheckingProcessId(true);
            try {
                const processId = await checkProcessId(
                    selectedProject.Name,
                    walletAddress,
                );
                setProcessId(processId);
                console.log(processId);
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

    const handlehandleEnabledAnalytics = () => {
        setCompletedAnalyticsProcess(true);
    };

    // conditions
    if (!selectedProject || !projectName || !walletAddress)
        return <div>No project exists with the name ${projectName}</div>;

    if (isCheckingProcessId) {
        return (
            <div className="py-10 container space-y-4">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-20 w-2/3" />
                </div>
                <h3 className="text-xl font-semibold my-4">Analytics metric</h3>
                <AnalyticsDashboardSkeleton />
            </div>
        );
    }

    return (
        <section className="py-10 container">
            <header className="space-y-4">
                {/* if we don't have process Id show the  Analytics Integration header */}
                <div className="space-y-2">
                    {processId ? (
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-100">
                            Web analytics
                        </h1>
                    ) : (
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-100">
                            Analytics Integration
                        </h1>
                    )}
                    <p className="mt-2 text-base max-w-xl text-neutral-500">
                        Collect valuable insights on user behaviour and site
                        performance with detailed page view metrics. Gain
                        knowledge on top pages.
                    </p>
                </div>
                {!processId && (
                    <EnableAnalytics
                        walletAddress={walletAddress}
                        handleProcessId={handleProcessId}
                        processId={processId}
                    />
                )}
            </header>
            {processId && (
                <>
                    <AnalyticsOverview processId={processId} />
                </>
            )}
        </section>
    );
};

export default Analytics;
