import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

export interface ChartDetailInterface {
    name: string;
    description?: string;
    value: string;
    volatility?: {
        type: "up" | "down";
        value: number;
    };
    data: { country: string; visitors: number }[];
}

interface BarChartProps extends ChartDetailInterface {
    yAxisDataKey: string;
    barDataKey: string;
    left?: number;
}

const defaultChartConfig = {
    visitors: {
        label: "Visitors",
    },
};

function BarChartCard({
    name,
    description,
    value,
    data,
    yAxisDataKey,
    barDataKey,
    left,
}: BarChartProps) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl">{name}</CardTitle>
                <CardDescription className="text-xs">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-2 flex-1 ">
                <ChartContainer
                    config={defaultChartConfig}
                    className="h-full w-full"
                >
                    <BarChart
                        accessibilityLayer
                        data={data}
                        layout="vertical"
                        margin={{
                            left: left ?? 60,
                            right: 40,
                            top: 10,
                            bottom: 10,
                        }}
                        width={500}
                        height={300}
                    >
                        <YAxis
                            dataKey={yAxisDataKey}
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={20}
                        />
                        <XAxis dataKey={barDataKey} type="number" hide={true} />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                        />
                        <Bar dataKey={barDataKey} fill="white" radius={5} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

export default BarChartCard;
