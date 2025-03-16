import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { connect, createDataItemSigner } from "@permaweb/aoconnect";
import { ANT, ARIO, ArconnectSigner } from "@ar.io/sdk/web";
import Arweave from "arweave";

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
        { name: "TTL-Seconds", value: "900" },
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

export async function getPrimaryname(walletaddy: string) {
    try {
        // Initialize Arweave
        const arweave = Arweave.init({});

        // step 1 init ario
        const ario = ARIO.init({
            signer: new ArconnectSigner(window.arweaveWallet),
        });

        // step 2 get primary name from wallet
        const nameResponse = await ario.getPrimaryName({
            address: walletaddy,
        });

        // Check if name exists
        if (!nameResponse?.name) {
            throw new Error("No primary name found");
        }

        const primaryname = nameResponse.name;

        // step 3 get process id from primaryname
        const recordResponse = await ario.getArNSRecord({ name: primaryname });

        // Check if record exists and has processId
        if (!recordResponse?.processId) {
            throw new Error("No process ID found");
        }

        const pid = recordResponse.processId;

        // step 4 get logo from process id
        const ant = ANT.init({
            signer: new ArconnectSigner(window.arweaveWallet),
            processId: pid,
        });

        const logoTxId = await ant.getLogo();
        const logo = logoTxId;

        return { primaryname, logo };
    } catch (error) {
        console.error("Error in getPrimaryname:", error);
        throw error;
    }
}

export const countryCoordinates: Record<string, { lat: number; lng: number }> =
    {
        usa: { lat: 37.0902, lng: -95.7129 },
        "united states": { lat: 37.0902, lng: -95.7129 },
        canada: { lat: 56.1304, lng: -106.3468 },
        mexico: { lat: 23.6345, lng: -102.5528 },
        brazil: { lat: -14.235, lng: -51.9253 },
        argentina: { lat: -38.4161, lng: -63.6167 },
        uk: { lat: 55.3781, lng: -3.436 },
        "united kingdom": { lat: 55.3781, lng: -3.436 },
        france: { lat: 46.2276, lng: 2.2137 },
        germany: { lat: 51.1657, lng: 10.4515 },
        italy: { lat: 41.8719, lng: 12.5674 },
        spain: { lat: 40.4637, lng: -3.7492 },
        russia: { lat: 61.524, lng: 105.3188 },
        china: { lat: 35.8617, lng: 104.1954 },
        india: { lat: 20.5937, lng: 78.9629 },
        japan: { lat: 36.2048, lng: 138.2529 },
        australia: { lat: -25.2744, lng: 133.7751 },
        "south africa": { lat: -30.5595, lng: 22.9375 },
        egypt: { lat: 26.8206, lng: 30.8025 },
        nigeria: { lat: 9.082, lng: 8.6753 },
        kenya: { lat: -0.0236, lng: 37.9062 },
        "saudi arabia": { lat: 23.8859, lng: 45.0792 },
        uae: { lat: 23.4241, lng: 53.8478 },
        "united arab emirates": { lat: 23.4241, lng: 53.8478 },
        "south korea": { lat: 35.9078, lng: 127.7669 },
        indonesia: { lat: -0.7893, lng: 113.9213 },
        thailand: { lat: 15.87, lng: 100.9925 },
        vietnam: { lat: 14.0583, lng: 108.2772 },
        turkey: { lat: 38.9637, lng: 35.2433 },
        iran: { lat: 32.4279, lng: 53.688 },
        pakistan: { lat: 30.3753, lng: 69.3451 },
        bangladesh: { lat: 23.685, lng: 90.3563 },
        philippines: { lat: 12.8797, lng: 121.774 },
        malaysia: { lat: 4.2105, lng: 101.9758 },
        singapore: { lat: 1.3521, lng: 103.8198 },
        "new zealand": { lat: -40.9006, lng: 174.886 },
        sweden: { lat: 60.1282, lng: 18.6435 },
        norway: { lat: 60.472, lng: 8.4689 },
        denmark: { lat: 56.2639, lng: 9.5018 },
        finland: { lat: 61.9241, lng: 25.7482 },
        poland: { lat: 51.9194, lng: 19.1451 },
        ukraine: { lat: 48.3794, lng: 31.1656 },
        greece: { lat: 39.0742, lng: 21.8243 },
        portugal: { lat: 39.3999, lng: -8.2245 },
        ireland: { lat: 53.1424, lng: -7.6921 },
        switzerland: { lat: 46.8182, lng: 8.2275 },
        austria: { lat: 47.5162, lng: 14.5501 },
        belgium: { lat: 50.5039, lng: 4.4699 },
        netherlands: { lat: 52.1326, lng: 5.2913 },
        "czech republic": { lat: 49.8175, lng: 15.473 },
        hungary: { lat: 47.1625, lng: 19.5033 },
        romania: { lat: 45.9432, lng: 24.9668 },
        bulgaria: { lat: 42.7339, lng: 25.4858 },
        serbia: { lat: 44.0165, lng: 21.0059 },
        croatia: { lat: 45.1, lng: 15.2 },
        israel: { lat: 31.0461, lng: 34.8516 },
        morocco: { lat: 31.7917, lng: -7.0926 },
        algeria: { lat: 28.0339, lng: 1.6596 },
        tunisia: { lat: 33.8869, lng: 9.5375 },
        libya: { lat: 26.3351, lng: 17.2283 },
        ethiopia: { lat: 9.145, lng: 40.4897 },
        tanzania: { lat: -6.369, lng: 34.8888 },
        uganda: { lat: 1.3733, lng: 32.2903 },
        ghana: { lat: 7.9465, lng: -1.0232 },
        cameroon: { lat: 7.3697, lng: 12.3547 },
        "ivory coast": { lat: 7.54, lng: -5.5471 },
        angola: { lat: -11.2027, lng: 17.8739 },
        mozambique: { lat: -18.6657, lng: 35.5296 },
        zimbabwe: { lat: -19.0154, lng: 29.1549 },
        chile: { lat: -35.6751, lng: -71.543 },
        peru: { lat: -9.19, lng: -75.0152 },
        colombia: { lat: 4.5709, lng: -74.2973 },
        venezuela: { lat: 6.4238, lng: -66.5897 },
        cuba: { lat: 21.5218, lng: -77.7812 },
        jamaica: { lat: 18.1096, lng: -77.2975 },
        haiti: { lat: 18.9712, lng: -72.2852 },
        "dominican republic": { lat: 18.7357, lng: -70.1627 },
        "puerto rico": { lat: 18.2208, lng: -66.5901 },
        guatemala: { lat: 15.7835, lng: -90.2308 },
        "costa rica": { lat: 9.7489, lng: -83.7534 },
        panama: { lat: 8.538, lng: -80.7821 },
    };
