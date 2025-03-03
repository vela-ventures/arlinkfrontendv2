import { type ChartConfig } from "@/components/ui/chart";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartDetailInterface } from "@/types";
import { WorldMap } from "./ui/world-map";

export const WorldMapCard = ({
    chartDetail,
}: {
    chartDetail: ChartDetailInterface;
    chartConfig: ChartConfig;
}) => {
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
                    <WorldMap dots={chartDetail.data} />
                </CardContent>
            </div>
        </Card>
    );
};
