import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

interface RepositoryItemProps {
    id: string;
    fullName: string;
    logoSrc?: string;
    updatedAt?: string;
    url: string;
    onImport: (url: string) => void;
}

export function RepositoryItem({
    id,
    fullName,
    logoSrc = "/joose.svg",
    updatedAt,
    url,
    onImport,
}: RepositoryItemProps) {
    return (
        <div
            key={id}
            className="flex w-full hover:bg-neutral-900 duration-75 transition-all items-center justify-between pl-2 px-4 py-3 border-b"
        >
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10">
                    <img
                        src={logoSrc}
                        alt={`${fullName} logo`}
                        className="h-full w-full"
                    />
                </div>
                <span className="font-medium md:inline-block hidden lg:text-[16px] md:text-sm text-sm">
                    {fullName}
                </span>
                <span className="font-medium md:hidden inline-block lg:text-[16px] md:text-sm text-sm">
                    {fullName.split("/")[1]}
                </span>
                {updatedAt && (
                    <span className="lg:text-md md:block hidden  md:text-sm text-sm text-neutral-500">
                        {timeAgo(updatedAt)}
                    </span>
                )}
            </div>
            <Button
                size="sm"
                className="rounded-sm h-8 mr-1"
                onClick={() => onImport(url)}
            >
                Import
            </Button>
        </div>
    );
}
