import { ChartConfig } from "@/components/ui/chart";
import {
    ChartDetailInterface,
    HorizontalChartCard,
} from "@/components/ui/horizontal-chart-card";

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

const pageViewDetails: ChartDetailInterface = {
    name: "Page views",
    value: "97,123",
    volatility: {
        type: "up",
        value: 20,
    },
    data: [
        { month: "January", desktop: 186 },
        { month: "February", desktop: 305 },
        { month: "March", desktop: 237 },
        { month: "April", desktop: 73 },
        { month: "May", desktop: 209 },
        { month: "June", desktop: 214 },
        { month: "July", desktop: 200 },
    ],
};

const visitorDetails: ChartDetailInterface = {
    name: "Visitors ",
    value: "100",
    volatility: {
        type: "up",
        value: 20,
    },
    data: [
        { month: "January", desktop: 186 },
        { month: "February", desktop: 305 },
        { month: "March", desktop: 237 },
        { month: "April", desktop: 73 },
        { month: "May", desktop: 209 },
        { month: "June", desktop: 214 },
        { month: "July", desktop: 200 },
    ],
};
const avgLoadTimeDetails: ChartDetailInterface = {
    name: "avg load time",
    value: "0.2",
    volatility: {
        type: "up",
        value: 20,
    },
    data: [
        { month: "January", desktop: 186 },
        { month: "February", desktop: 305 },
        { month: "March", desktop: 237 },
        { month: "April", desktop: 73 },
        { month: "May", desktop: 209 },
        { month: "June", desktop: 214 },
        { month: "July", desktop: 200 },
    ],
};

const chartData: ChartDetailInterface[] = [
    pageViewDetails,
    visitorDetails,
    avgLoadTimeDetails,
];

function Analytics() {
    return (
        <div className="px-[60px] py-[30px]">
            <div className="grid gap-2 grid-cols-3">
                {chartData.map((data) => {
                    return (
                        <HorizontalChartCard
                            chartConfig={chartConfig}
                            chartDetail={data}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default Analytics;
