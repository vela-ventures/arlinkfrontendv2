import { type ChartConfig } from "@/components/ui/chart";
import { lazy, Suspense } from "react";
const WorldMap = lazy(() => import("../components/ui/world-map.tsx"));

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartDetailInterface } from "@/types";

const WorldMapCard = ({
    chartDetail,
}: {
    chartDetail: ChartDetailInterface;
    chartConfig: ChartConfig;
}) => {
    const countryData = [
        { country: "USA", percentage: 100 },
        { country: "Canada", percentage: 80 },
        { country: "Brazil", percentage: 65 },
        { country: "UK", percentage: 90 },
        { country: "France", percentage: 75 },
        { country: "Germany", percentage: 85 },
        { country: "China", percentage: 95 },
        { country: "India", percentage: 70 },
        { country: "Japan", percentage: 88 },
        { country: "Australia", percentage: 82 },
        { country: "South Africa", percentage: 45 },
        { country: "Egypt", percentage: 30 },
        { country: "Russia", percentage: 60 },
        { country: "Mexico", percentage: 50 },
        { country: "Italy", percentage: 78 },
        { country: "Spain", percentage: 72 },
        { country: "Singapore", percentage: 93 },
        { country: "Thailand", percentage: 40 },
        { country: "Sweden", percentage: 87 },
        { country: "UAE", percentage: 55 },
        { country: "Israel", percentage: 68 },
        { country: "Argentina", percentage: 35 },
        { country: "Nigeria", percentage: 25 },
        { country: "Kenya", percentage: 20 },
        { country: "Saudi Arabia", percentage: 62 },
        { country: "Turkey", percentage: 48 },
        { country: "Indonesia", percentage: 38 },
        { country: "Vietnam", percentage: 32 },
        { country: "Netherlands", percentage: 83 },
        { country: "Switzerland", percentage: 91 },
        { country: "Poland", percentage: 58 },
        { country: "Ireland", percentage: 76 },
        { country: "New Zealand", percentage: 79 },
        { country: "Chile", percentage: 42 },
        { country: "Colombia", percentage: 36 },
        { country: "Malaysia", percentage: 53 },
        { country: "Philippines", percentage: 28 },
        { country: "Pakistan", percentage: 22 },
        { country: "Iran", percentage: 15 },
        { country: "Morocco", percentage: 33 },
    ];
    return (
        <Card className="py-0">
            <div className="">
                <CardHeader>
                    <CardTitle className="text-xl text-white">
                        {chartDetail.name}
                    </CardTitle>
                    <CardDescription className="flex text-sm flex-col space-y-2">
                        {chartDetail?.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center p-4">
                    <Suspense fallback={<div>Loading map...</div>}>
                        <WorldMap dots={countryData} />
                    </Suspense>
                </CardContent>
            </div>
        </Card>
    );
};

export default WorldMapCard;
