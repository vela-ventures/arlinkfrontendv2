import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { index } from "arweave-indexer";

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

// export const indexInMalik = async ({
// 	title,
// description,
// 						txid,
// 						link,
// 						owner,
// 						arlink
// }) => {

// }

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
