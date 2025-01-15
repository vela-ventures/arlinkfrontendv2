import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { connect, createDataItemSigner } from "@permaweb/aoconnect";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function timeAgo(isoDate: string): string {
    const timestamp = new Date(isoDate); // Convert ISO 8601 string to Date object
    const now = new Date(); // Get current time

    const differenceInSeconds = Math.floor(
        (now.getTime() - timestamp.getTime()) / 1000,
    ); // Difference in seconds

    // Calculate time components
    const minutes = Math.floor(differenceInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `· ${days}d ago`;
    }
    if (hours > 0) {
        return `· ${hours}h ago`;
    }
    if (minutes > 0) {
        return `· ${minutes}m ago`;
    }
    return "· just now";
}

export const BUILDER_BACKEND =
    import.meta.env.VITE_BACKEND_URL ??
    (import.meta.env.VITE_ENV === "test"
        ? "http://localhost:3050"
        : "https://vmi2322729.contaboserver.net");

export const TESTING_FETCH = "https://vmi2322729.contaboserver.net";

export function getTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const date = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
}

export async function setUndername(
    antProcess: string,
    manifestId: string,
    undername: string,
) {
    const ao = connect();
    const msgtags = [
        { name: "Action", value: "Set-Record" },
        { name: "Sub-Domain", value: undername },
        { name: "Transaction-Id", value: manifestId },
        { name: "TTL-Seconds", value: "3600" },
    ];
    try {
        const result = await ao.message({
            process: antProcess,
            tags: msgtags,
            signer: createDataItemSigner(window.arweaveWallet),
            data: "",
        });
        console.log("set arns message officially sent out ", result);
        return result;
    } catch (e) {
        console.error(e);
        return null;
    }
}
