import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsSkeleton() {
    return (
        <div className="container relative mx-auto p-8 space-y-2 text-neutral-200 min-h-screen">
            <div className="fixed inset-0 bg-gradient-to-t z-40 from-black to-transparent pointer-events-none"></div>
            <div className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <h1 className="text-4xl font-bold text-neutral-100 mb-4">
                    Coming Soon
                </h1>
                <p className="text-lg text-neutral-400 mb-8">
                    Analytics features are currently under development
                </p>
                <a
                    href="/dashboard"
                    className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                    Back to Dashboard
                </a>
            </div>
            <div className="opacity-60">
                <div className="absolute inset-0"></div>
                {/* Main Chart */}
                <Card className="p-4 mb-8 bg-neutral-950 border-neutral-800">
                    <div className="text-xl font-semibold mb-4">
                        Analytics Overview
                    </div>
                    <Skeleton className="h-8 w-40 mb-4 bg-neutral-900" />
                    <Skeleton className="h-[300px] w-full bg-neutral-900" />
                </Card>

                {/* Recent Activity Table */}
                <Card className="p-4  bg-neutral-950 border-neutral-800">
                    <div className="text-xl font-semibold mb-4">
                        Recent Activity
                    </div>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="flex justify-between items-center"
                            >
                                <div className="text-sm text-neutral-400">
                                    Activity {i + 1}
                                </div>
                                <Skeleton className="h-4 w-1/3 bg-neutral-900" />
                                <Skeleton className="h-4 w-1/4 bg-neutral-900" />
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
