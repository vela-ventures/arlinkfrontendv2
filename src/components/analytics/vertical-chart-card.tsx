import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

interface ChartDetailInterface {
    name: string;
    value: string;
    description?: string;
    volatility?: {
        type: "up" | "down";
        value: number;
    };
    data: Array<{
        value: number;
        date: string;
    }>;
}

export const VerticalChartCard = ({
    chartDetail,
    chartConfig,
}: {
    chartDetail: ChartDetailInterface;
    chartConfig: ChartConfig;
}) => {
    const safeId = chartDetail.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

    return (
        <Card className="overflow-hidden h-full flex flex-col">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">{chartDetail.name}</CardTitle>
                {chartDetail?.description && (
                    <CardDescription className="text-sm mb-2">
                        {chartDetail.description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="px-4 pt-0 flex-1 min-h-[350px] overflow-visible">
                <div className="w-full h-full">
                    <ChartContainer
                        config={chartConfig}
                        className="h-full w-full overflow-visible"
                    >
                        <AreaChart
                            accessibilityLayer
                            data={chartDetail.data}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 10,
                                bottom: 60, // Increased even more for animation space
                            }}
                            className="h-full w-full"
                        >
                            <CartesianGrid vertical={false} opacity={1} />

                            <YAxis hide />
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
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="white"
                                strokeWidth={2}
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6, strokeWidth: 2 }}
                                isAnimationActive={true}
                                animationDuration={1000}
                                animationBegin={0}
                                animationEasing="ease-out"
                            />
                        </AreaChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
};
