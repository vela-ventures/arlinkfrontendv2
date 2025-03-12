import { MostUsedWalletInterface } from "@/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { motion } from "framer-motion";

const MostUsedWallets = ({ data }: { data: MostUsedWalletInterface }) => {
    const processData = data.data.map((item) => {
        const countryKey =
            Object.keys(item).find(
                (key) => key !== "visitors" && key !== "percentage",
            ) || "";

        return {
            visitors: item.visitors,
            wallet: item[countryKey as keyof typeof item] as string,
            percentange: item.percentage,
        };
    });

    const sortedData = processData.sort(
        (a, b) => b.percentange - a.percentange,
    );

    const others = sortedData.slice(4).reduce((acc, item) => {
        return acc + item.percentange;
    }, 0);

    return (
        <Card className="rounded-xl">
            <CardHeader>
                <CardTitle>{data.name}</CardTitle>
                <CardDescription>{data.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2">
                    {sortedData.slice(0, 4).map((item) => {
                        return (
                            <div
                                key={item.wallet}
                                className="flex group text-sm items-center justify-between relative isolat"
                            >
                                <motion.div
                                    viewport={{
                                        once: true,
                                    }}
                                    initial={{
                                        width: "0px",
                                    }}
                                    whileInView={{
                                        width: `${item.percentange}%`,
                                    }}
                                    transition={{
                                        duration: 1.0,
                                    }}
                                    className={`bg-neutral-900 group-hover:bg-neutral-700 transition-all rounded-md absolute inset-0 z-0`}
                                ></motion.div>
                                <div className="flex items-center gap-2 relative z-10 py-2 px-2">
                                    <span className="font-medium">
                                        {item.wallet}
                                    </span>
                                </div>
                                <span className="font-medium relative z-10 pr-2">
                                    {item.percentange}%
                                </span>
                            </div>
                        );
                    })}
                    <div>
                        <div className="flex group text-sm items-center justify-between relative isolat">
                            <motion.div
                                initial={{
                                    width: "0px",
                                }}
                                whileInView={{
                                    width: `${others}%`,
                                }}
                                transition={{
                                    duration: 0.8,
                                    ease: "easeOut",
                                }}
                                className={`bg-neutral-900 group-hover:bg-neutral-700 transition-all rounded-md absolute inset-0 z-0`}
                            ></motion.div>
                            <div className="flex items-center gap-2 relative z-10 py-2 px-2">
                                <span className="font-medium">Others</span>
                            </div>
                            <span className="font-medium relative z-10 pr-2">
                                {others}%
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MostUsedWallets;
