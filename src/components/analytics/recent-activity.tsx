import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentActivity {
    pageVisited: string;
    country: string;
    loadTime: string;
    browserDevice: string;
    timestamp: string;
}

const RecentActivityTable: React.FC<{ recentActivity: RecentActivity[] }> = ({
    recentActivity,
}) => {
    return (
        <Card className="border border-neutral-800 rounded-xl shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-white">
                    Recent Activity
                </CardTitle>
                <CardDescription className="text-neutral-400">
                    Latest visitor interactions
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    <Table className="rounded-t-md overflow-hidden mt-4">
                        <TableHeader className="rounded-xl overflow-hidden">
                            <TableRow className="bg-neutral-900 rounded-xl border border-neutral-800 hover:bg-neutral-900">
                                <TableHead className="text-gray-300 font-medium">
                                    Timestamp
                                </TableHead>
                                <TableHead className="text-gray-300 font-medium">
                                    Page Visited
                                </TableHead>
                                <TableHead className="text-gray-300 font-medium">
                                    Browser & Device
                                </TableHead>
                                <TableHead className="text-gray-300 font-medium">
                                    Country
                                </TableHead>
                                <TableHead className="text-gray-300 font-medium">
                                    Page Load Time
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                    </Table>

                    <ScrollArea className="max-h-64 overflow-auto border border-neutral-800 rounded-b-md ">
                        <Table className="border-neutral-900 border-t-none border-2 rounded-b-md overflow-hidden">
                            <TableBody>
                                {recentActivity.map((entry, index) => (
                                    <TableRow
                                        key={index}
                                        className="hover:bg-neutral-700 transition"
                                    >
                                        <TableCell className="text-gray-300">
                                            <p>
                                                {entry.timestamp.split("T")[0]}
                                            </p>
                                            <p className="text-xs text-neutral-400">
                                                {entry.timestamp.split("T")[1]}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {entry.pageVisited}
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            <p>
                                                {
                                                    entry.browserDevice.split(
                                                        " ",
                                                    )[0]
                                                }
                                            </p>
                                            <p className="text-xs text-neutral-400">
                                                {
                                                    entry.browserDevice.split(
                                                        " ",
                                                    )[1]
                                                }
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {entry.country}
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {entry.loadTime}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentActivityTable;
