import type { ArnsName, ProtocolLandRepo, Repository } from "@/types";
import { BUILDER_BACKEND } from "@/lib/utils";
import { Octokit } from "@octokit/rest";
import { index } from "arweave-indexer";
import axios, { isAxiosError } from "axios";
import type React from "react";
import { toast } from "sonner";
import { SetStateAction } from "react";
import fetchUserRepos from "@/lib/fetchprotolandrepo";
import { getWalletOwnedNames } from "@/lib/get-arns";

export async function fetchRepositories({
    githubToken,
    setRepositories,
}: {
    githubToken: string | null;
    setRepositories: React.Dispatch<React.SetStateAction<Repository[]>>;
}) {
    if (!githubToken) return;

    const octokit = new Octokit({ auth: githubToken });
    const { data: user } = await octokit.users.getAuthenticated();
    console.log("Authenticated as:", user.login);
    try {
        const response = await octokit.repos.listForAuthenticatedUser({
            per_page: 100,
            page: 1,
            sort: "updated",
            direction: "desc",
        });

        setRepositories(response.data as Repository[]);
    } catch (error) {
        console.error("Error fetching repositories:", error);
        toast.error("Failed to fetch repositories");
    }
}

export const indexInMalik = async ({
    projectName,
    description,
    txid,
    owner,
    link,
    arlink,
}: {
    projectName: string;
    description: string;
    txid: string;
    owner: string | undefined;
    link: string;
    arlink: string | null;
}) => {
    await index(
        // @ts-ignore
        JSON.stringify({
            title: projectName,
            description,
            txid,
            link,
            owner,
            arlink,
        }),
        window.arweaveWallet,
    );
};

export async function fetchRepositoryByName({
    githubToken,
    repo,
}: {
    githubToken: string | null;
    repo: string;
}): Promise<Repository | null> {
    if (!githubToken) {
        toast.error("No GitHub token provided");
        return null;
    }

    const octokit = new Octokit({ auth: githubToken });

    try {
        const { data: user } = await octokit.users.getAuthenticated();

        const response = await octokit.repos.get({
            owner: user.login,
            repo,
        });

        return response.data as Repository;
    } catch (error) {
        console.error("Error fetching repository:", error);
        if ((error as { status?: number }).status === 404) {
            toast.error("Repository not found");
        } else if ((error as { status?: number }).status === 401) {
            toast.error("Invalid or expired GitHub token");
        } else if ((error as { status?: number }).status === 403) {
            toast.error("Token doesn't have required permissions");
        } else {
            toast.error("Failed to fetch repository");
        }
        return null;
    }
}

interface DirectoryStructure {
    name: string;
    path: string;
    type: "dir" | "file";
    children?: DirectoryStructure[];
}

export async function analyzeRepoStructure(
    owner: string,
    repo: string,
    githubToken: string,
): Promise<DirectoryStructure[]> {
    // because we are caling this recursively I guess it is draining the api request for me
    // so kindly look into this
    async function getContents(path = ""): Promise<DirectoryStructure[]> {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
                {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: "application/vnd.github.v3+json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.statusText}`);
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                const contents = await Promise.all(
                    data.map(async (item) => {
                        const structure: DirectoryStructure = {
                            name: item.name,
                            path: item.path,
                            type: item.type as "dir" | "file",
                        };

                        // Recursively get contents of directories
                        if (
                            item.type === "dir" &&
                            !["node_modules", ".git", "dist"].includes(
                                item.name,
                            )
                        ) {
                            structure.children = await getContents(item.path);
                        }

                        return structure;
                    }),
                );

                return contents.filter(
                    (item) =>
                        ![
                            "node_modules",
                            ".git",
                            ".github",
                            "dist",
                            "build",
                        ].includes(item.name),
                );
            }
        } catch (error) {
            console.error(`Error fetching contents for ${path}:`, error);
            return [];
        }

        return [];
    }

    const structure = await getContents();
    return findFrontendDirs(structure);
}

function findFrontendDirs(
    structure: DirectoryStructure[],
): DirectoryStructure[] {
    const frontendIndicators = [
        "package.json",
        "src",
        "public",
        "index.html",
        "vite.config.ts",
        "next.config.js",
        "angular.json",
        "webpack.config.js",
        "tsconfig.json",
    ];

    return structure.filter((item) => {
        if (item.type === "dir") {
            return item.children?.some((child) =>
                frontendIndicators.includes(child.name.toLowerCase()),
            );
        }
        return false;
    });
}

export function extractRepoName(url: string): string {
    return url
        .replace(/\.git|\/$/, "")
        .split("/")
        .pop() as string;
}

export const extractGithubPath = (url: string): string => {
    const githubPrefix = "https://github.com/";
    if (!url.startsWith(githubPrefix)) {
        throw new Error("Invalid GitHub URL");
    }

    const path = url.slice(githubPrefix.length);

    const parts = path.split("/");
    if (parts.length < 2) {
        throw new Error("Invalid GitHub repository URL format");
    }

    return `${parts[0]}/${parts[1]}`;
};

export function extractOwnerName(url: string): string {
    return url.split("/").reverse()[1];
}

export function createTokenizedRepoUrl(repoUrl: string, token: string): string {
    const [, , , username, repo] = repoUrl.split("/");
    return `https://${token}@github.com/${username}/${repo}.git`;
}

export const detectFrameworkImage = (
    outputDir: string,
): {
    name: string;
    svg: string;
    dir: string;
} => {
    switch (outputDir.toLowerCase()) {
        case ".next":
            return {
                dir: ".next",
                name: "Next.js",
                svg: "nextjs.svg",
            };
        case "./out":
            return {
                dir: "./out",
                name: "Next.js",
                svg: "nextjs.svg",
            };
        case "./build":
            return {
                dir: "./build",
                name: "Create React App",
                svg: "react.svg",
            };
        case "public":
            return {
                dir: "public",
                name: "Gatsby",
                svg: "gatsby.svg",
            };
        case "./public":
            return {
                dir: "./public",
                name: "Gatsby",
                svg: "gatsby.svg",
            };
        case "./dist":
            return {
                dir: "./dist",
                name: "Vite",
                svg: "vite.svg",
            };
        default:
            return {
                dir: "unknown",
                name: "Unknown",
                svg: "unknown.svg",
            };
    }
};

export const handleFetchLogs = async ({
    projectName,
    repoUrl,
    setLogs,
    setLogError,
    setIsWaitingForLogs,
    setIsFetchingLogs,
    protocolLand,
    walletAddress,
}: {
    projectName: string;
    repoUrl: string;
    setLogs: React.Dispatch<React.SetStateAction<string[]>>;
    setLogError: React.Dispatch<React.SetStateAction<string>>;
    setIsWaitingForLogs: React.Dispatch<React.SetStateAction<boolean>>;
    setIsFetchingLogs: React.Dispatch<React.SetStateAction<boolean>>;
    isWaitingForLogs: boolean;
    protocolLand?: boolean;
    walletAddress?: string;
}) => {
    if (!projectName || !repoUrl) return;

    const owner = protocolLand ? walletAddress : extractOwnerName(repoUrl);
    const repo = protocolLand ? repoUrl : extractRepoName(repoUrl);
    const startTime = Date.now();
    const waitTime = 6000000;
    let intervalId: NodeJS.Timeout | null = null;

    const delay = (ms: number) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve("resolved");
            }, ms);
        });
    };

    const stopPolling = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    const logPoll = async () => {
        try {
            const logs = await axios.get(
                `${BUILDER_BACKEND}/backend/logs/${owner}/${repo}`,
            );
            setLogs(logs.data.split("\n"));
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 500) {
                setLogError("Deployment failed, please try again");
                setIsFetchingLogs(false);
                stopPolling();
            }
            if (isAxiosError(error) && error.response?.status === 406) {
                setLogError(
                    "Too many requests detected. Please try again later.",
                );
                stopPolling();
            }
            if (isAxiosError(error) && error.response?.status === 404) {
                const elapsedTime = Date.now() - startTime;
                if (elapsedTime < waitTime) {
                    setLogError("Waiting for logs...");
                } else {
                    setLogError(
                        "Deployment failed, please check logs to find the issue.",
                    );
                    setIsFetchingLogs(false);
                    stopPolling();
                }
            } else {
                setLogError("Deployment failed, please try again");
                setIsFetchingLogs(false);
                stopPolling();
            }
        }
    };

    setIsWaitingForLogs(true);
    await delay(10000);
    setIsWaitingForLogs(false);
    setIsFetchingLogs(true);
    logPoll();

    intervalId = setInterval(logPoll, 2000);

    // Ensure polling stops after 5 seconds regardless of errors
    setTimeout(() => {
        setIsFetchingLogs(false);
        stopPolling();
    }, waitTime);
};

export async function fetchProtocolLandRepos({
    address,
    setProtocolLandRepos,
}: {
    address: string | undefined;
    setProtocolLandRepos: React.Dispatch<SetStateAction<ProtocolLandRepo[]>>;
}) {
    if (!address) {
        toast.error("Please connect your wallet first");
        return;
    }
    try {
        const repos = await fetchUserRepos(address);
        console.log({
            protocolLandRepos: repos,
        });
        setProtocolLandRepos(repos);
    } catch (error) {
        console.error("Error fetching repositories:", error);
        toast.error("Failed to fetch repositories");
    }
}

export async function handleFetchExistingArnsName({
    setExistingArnsLoading,
    activeAddress,
    setArnsNames,
}: {
    setExistingArnsLoading: React.Dispatch<SetStateAction<boolean>>;
    activeAddress: string | undefined;
    setArnsNames: React.Dispatch<SetStateAction<ArnsName[]>>;
}) {
    setExistingArnsLoading(true);
    if (!activeAddress) {
        toast.error("wallet address not found");
        return;
    }
    try {
        // our logic of fetching the arns name
        const names = await getWalletOwnedNames(activeAddress);
        setArnsNames(names);
    } catch (error) {
        console.error("Error fetching ArNS names:", error);
        toast.error("Failed to fetch ArNS names");
    } finally {
        setExistingArnsLoading(false);
    }
}

export function getCountryCode(countryName: string): string {
    const countryMap: Record<string, string> = {
        Afghanistan: "af",
        Albania: "al",
        Algeria: "dz",
        Andorra: "ad",
        Angola: "ao",
        "Antigua and Barbuda": "ag",
        Argentina: "ar",
        Armenia: "am",
        Australia: "au",
        Austria: "at",
        Azerbaijan: "az",
        Bahamas: "bs",
        Bahrain: "bh",
        Bangladesh: "bd",
        Barbados: "bb",
        Belarus: "by",
        Belgium: "be",
        Belize: "bz",
        Benin: "bj",
        Bhutan: "bt",
        Bolivia: "bo",
        "Bosnia and Herzegovina": "ba",
        Botswana: "bw",
        Brazil: "br",
        Brunei: "bn",
        Bulgaria: "bg",
        "Burkina Faso": "bf",
        Burundi: "bi",
        "Cabo Verde": "cv",
        Cambodia: "kh",
        Cameroon: "cm",
        Canada: "ca",
        "Central African Republic": "cf",
        Chad: "td",
        Chile: "cl",
        China: "cn",
        Colombia: "co",
        Comoros: "km",
        "Congo (Congo-Brazzaville)": "cg",
        "Congo (Congo-Kinshasa)": "cd",
        "Costa Rica": "cr",
        Croatia: "hr",
        Cuba: "cu",
        Cyprus: "cy",
        Czechia: "cz",
        Denmark: "dk",
        Djibouti: "dj",
        Dominica: "dm",
        "Dominican Republic": "do",
        Ecuador: "ec",
        Egypt: "eg",
        "El Salvador": "sv",
        "Equatorial Guinea": "gq",
        Eritrea: "er",
        Estonia: "ee",
        Eswatini: "sz",
        Ethiopia: "et",
        Fiji: "fj",
        Finland: "fi",
        France: "fr",
        Gabon: "ga",
        Gambia: "gm",
        Georgia: "ge",
        Germany: "de",
        Ghana: "gh",
        Greece: "gr",
        Grenada: "gd",
        Guatemala: "gt",
        Guinea: "gn",
        "Guinea-Bissau": "gw",
        Guyana: "gy",
        Haiti: "ht",
        Honduras: "hn",
        Hungary: "hu",
        Iceland: "is",
        India: "in",
        Indonesia: "id",
        Iran: "ir",
        Iraq: "iq",
        Ireland: "ie",
        Israel: "il",
        Italy: "it",
        Jamaica: "jm",
        Japan: "jp",
        Jordan: "jo",
        Kazakhstan: "kz",
        Kenya: "ke",
        Kiribati: "ki",
        Kuwait: "kw",
        Kyrgyzstan: "kg",
        Laos: "la",
        Latvia: "lv",
        Lebanon: "lb",
        Lesotho: "ls",
        Liberia: "lr",
        Libya: "ly",
        Liechtenstein: "li",
        Lithuania: "lt",
        Luxembourg: "lu",
        Madagascar: "mg",
        Malawi: "mw",
        Malaysia: "my",
        Maldives: "mv",
        Mali: "ml",
        Malta: "mt",
        "Marshall Islands": "mh",
        Mauritania: "mr",
        Mauritius: "mu",
        Mexico: "mx",
        Moldova: "md",
        Monaco: "mc",
        Mongolia: "mn",
        Montenegro: "me",
        Morocco: "ma",
        Mozambique: "mz",
        Myanmar: "mm",
        Namibia: "na",
        Nauru: "nr",
        Nepal: "np",
        Netherlands: "nl",
        "New Zealand": "nz",
        Nicaragua: "ni",
        Niger: "ne",
        Nigeria: "ng",
        "North Korea": "kp",
        "North Macedonia": "mk",
        Norway: "no",
        Oman: "om",
        Pakistan: "pk",
        Palau: "pw",
        Panama: "pa",
        "Papua New Guinea": "pg",
        Paraguay: "py",
        Peru: "pe",
        Philippines: "ph",
        Poland: "pl",
        Portugal: "pt",
        Qatar: "qa",
        Romania: "ro",
        Russia: "ru",
        Rwanda: "rw",
        "Saint Kitts and Nevis": "kn",
        "Saint Lucia": "lc",
        "Saint Vincent and the Grenadines": "vc",
        Samoa: "ws",
        "San Marino": "sm",
        "Sao Tome and Principe": "st",
        "Saudi Arabia": "sa",
        Senegal: "sn",
        Serbia: "rs",
        Seychelles: "sc",
        "Sierra Leone": "sl",
        Singapore: "sg",
        Slovakia: "sk",
        Slovenia: "si",
        "Solomon Islands": "sb",
        Somalia: "so",
        "South Africa": "za",
        "South Korea": "kr",
        "South Sudan": "ss",
        Spain: "es",
        "Sri Lanka": "lk",
        Sudan: "sd",
        Suriname: "sr",
        Sweden: "se",
        Switzerland: "ch",
        Syria: "sy",
        Taiwan: "tw",
        Tajikistan: "tj",
        Tanzania: "tz",
        Thailand: "th",
        "Timor-Leste": "tl",
        Togo: "tg",
        Tonga: "to",
        "Trinidad and Tobago": "tt",
        Tunisia: "tn",
        Turkey: "tr",
        Turkmenistan: "tm",
        Tuvalu: "tv",
        Uganda: "ug",
        Ukraine: "ua",
        "United Arab Emirates": "ae",
        "United Kingdom": "gb",
        "United States": "us",
        Uruguay: "uy",
        Uzbekistan: "uz",
        Vanuatu: "vu",
        "Vatican City": "va",
        Venezuela: "ve",
        Vietnam: "vn",
        Yemen: "ye",
        Zambia: "zm",
        Zimbabwe: "zw",
    };

    const normalizedCountry = countryName.trim();

    return countryMap[normalizedCountry] || "";
}
