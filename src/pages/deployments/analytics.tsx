import { ChartConfig } from "@/components/ui/chart";
import { HorizontalChartCard } from "@/components/horizontal-chart-card";
import { VerticalChartCard } from "@/components/vertical-chart-card";
import { ChartDetailInterface } from "@/types";
import { BarChartCard } from "@/components/bar-chart-card";
// import { WorldMapCard } from "@/components/world-map-card";

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

const pageViewDetails: ChartDetailInterface = {
    name: "Page views",
    description: "Total number of times you have been accessed",
    value: "97,123",
    volatility: {
        type: "down",
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

const topCountries: ChartDetailInterface = {
    name: "Top Countries",
    description: "View your visitors are coming from",
    value: "97,123",
    volatility: {
        type: "down",
        value: 20,
    },
    data: [
        { browser: "chrome", visitors: 275, fill: "white" },
        { browser: "safari", visitors: 200, fill: "white" },
        { browser: "firefox", visitors: 187, fill: "white" },
        { browser: "edge", visitors: 173, fill: "white" },
        { browser: "other", visitors: 90, fill: "white" },
    ],
};

const visitorDetails: ChartDetailInterface = {
    name: "Visitors ",
    description: "Total number of times you have been accessed",
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
    description: "Total number of times you have been accessed",
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

const globalTrafficOverview: ChartDetailInterface = {
    name: "avg load time",
    description: "Track visitors distribution with an interactive world map",
    value: "0.2",
    volatility: {
        type: "up",
        value: 20,
    },
    data: [
        {
            start: {
                lat: 64.2008,
                lng: -149.4937,
            },
            end: {
                lat: 34.0522,
                lng: -118.2437,
            },
        },
        {
            start: { lat: 64.2008, lng: -149.4937 },
            end: { lat: -15.7975, lng: -47.8919 },
        },
        {
            start: { lat: -15.7975, lng: -47.8919 },
            end: { lat: 38.7223, lng: -9.1393 },
        },
        {
            start: { lat: 51.5074, lng: -0.1278 },
            end: { lat: 28.6139, lng: 77.209 },
        },
        {
            start: { lat: 28.6139, lng: 77.209 },
            end: { lat: 43.1332, lng: 131.9113 },
        },
        {
            start: { lat: 28.6139, lng: 77.209 },
            end: { lat: -1.2921, lng: 36.8219 },
        },
    ],
};

const firstRow: ChartDetailInterface[] = [
    pageViewDetails,
    visitorDetails,
    avgLoadTimeDetails,
];

const secondRow: ChartDetailInterface[] = [
    pageViewDetails,
    globalTrafficOverview,
];

const thirdRow: ChartDetailInterface[] = [
    topCountries,
    topCountries,
    topCountries,
];

function Analytics() {
    return (
        <div>
            <div className="md:container px-4 md:py-5 ">
                <div className="rounded-lg mt-6 border-[#383838] mb-6">
                    <h1 className="md:text-3xl text-xl font-semibold mb-2">
                        Web Analytics
                    </h1>
                    <p className="text-sm text-neutral-400">
                        Collect valuable insights on user behaviour and site
                        performance with detailed page view metrics. Gain
                        knowledge on top pages
                    </p>
                </div>
                <div className="space-y-2">
                    <div className="grid gap-2 grid-cols-3">
                        {firstRow.map((data) => {
                            return (
                                <HorizontalChartCard
                                    chartConfig={chartConfig}
                                    chartDetail={data}
                                />
                            );
                        })}
                    </div>
                    <div className="grid gap-2 grid-cols-2">
                        <VerticalChartCard
                            chartConfig={chartConfig}
                            chartDetail={secondRow[0]}
                        />
                        {/* <WorldMapCard */}
                        {/*     chartConfig={chartConfig} */}
                        {/*     chartDetail={secondRow[1]} */}
                        {/* /> */}
                    </div>
                    <div className="grid gap-2 grid-cols-3">
                        {thirdRow.map((data) => {
                            return <BarChartCard chartDetails={data} />;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Analytics;
