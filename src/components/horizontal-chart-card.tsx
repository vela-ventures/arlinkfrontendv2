import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ChartDetailInterface } from "@/types";

export const HorizontalChartCard = ({
    chartDetail,
    chartConfig,
}: {
    chartDetail: ChartDetailInterface;
    chartConfig: ChartConfig;
}) => {
    return (
        <Card className="py-0">
            <div className="flex items-start">
                <CardHeader>
                    <CardTitle className="text-base text-neutral-400">
                        {chartDetail.name}
                    </CardTitle>
                    <CardDescription className="flex flex-col space-y-2">
                        <h3 className="text-4xl font-semibold text-white">
                            {chartDetail.value}
                        </h3>
                        <div
                            className={`flex items-center gap-2 pr-3 pl-2 py-1 font-semibold text-xs rounded-full w-fit  
                ${chartDetail.volatility.type === "up" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-600"}
              `}
                        >
                            {chartDetail.volatility.type === "up" ? (
                                <ArrowUp size={18} />
                            ) : (
                                <ArrowDown size={18} />
                            )}
                            <span>{chartDetail.volatility.value}%</span>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center p-4">
                    <ChartContainer
                        config={chartConfig}
                        className="h-full my-auto  w-full"
                    >
                        <AreaChart
                            accessibilityLayer
                            data={chartDetail.data}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 10,
                            }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent />}
                            />
                            <defs>
                                <linearGradient
                                    id="fillDesktop"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-desktop)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-desktop)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <Area
                                dataKey="desktop"
                                type="natural"
                                fill="url(#fillDesktop)"
                                fillOpacity={0.4}
                                stroke="var(--color-desktop)"
                            />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </div>
        </Card>
    );
};
