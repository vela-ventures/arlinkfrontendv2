"use client";

import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

// Define the interface here to ensure it matches the data structure
interface ChartDetailInterface {
    name: string;
    value: string;
    volatility?: {
        type: "up" | "down";
        value: number;
    };
    data: Array<{
        value: number;
        date: string;
    }>;
}

export const HorizontalChartCard = ({
    chartDetail,
    chartConfig,
}: {
    chartDetail: ChartDetailInterface;
    chartConfig: ChartConfig;
}) => {
    // Create a safe ID for the gradient by removing spaces and special characters
    const safeId = chartDetail.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

    return (
        <Card className="p-1 h-full">
            <div className="flex flex-row items-start h-full gap-2">
                <div className="w-[120px] flex flex-col justify-center p-4">
                    <h3 className="text-xs text-neutral-400 font-medium">
                        {chartDetail.name}
                    </h3>
                    <div className="mt-2">
                        <p className="text-4xl font-semibold text-white">
                            {chartDetail.value.slice(0, 5)}
                        </p>
                    </div>
                </div>

                <div className="flex-1 h-full min-h-[130px]">
                    <ChartContainer
                        config={chartConfig}
                        className="w-full h-full"
                    >
                        <AreaChart
                            accessibilityLayer
                            data={chartDetail.data}
                            margin={{
                                top: 15,
                                right: 15,
                                left: 0,
                                bottom: 35,
                            }}
                            className="h-full w-full"
                        >
                            <YAxis
                                hide
                                domain={["dataMin - 10", "dataMax + 10"]}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent />}
                            />
                            <defs>
                                <linearGradient
                                    id={`fill-${safeId}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-primary)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-primary)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <Area
                                dataKey="value"
                                type="natural"
                                fill={`url(#fill-${safeId})`}
                                fillOpacity={0.4}
                                stroke="var(--color-primary)"
                                strokeWidth={2}
                                isAnimationActive={true}
                                animationDuration={1000}
                                animationBegin={0}
                                animationEasing="ease-out"
                                baseValue="dataMin"
                            />
                        </AreaChart>
                    </ChartContainer>
                </div>
            </div>
        </Card>
    );
};
