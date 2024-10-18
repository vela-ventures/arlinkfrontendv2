import React, { useEffect, useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn, DEPLOYMENT_WALLET } from "@/lib/utils";
import axios from "axios"
import {
    IconArrowLeft,
    IconBrandTabler,
    IconSettings,
    IconUserBolt,
} from "@tabler/icons-react";
import { Plus, User2, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { ConnectButton, useConnection } from "arweave-wallet-kit";
import Head from "next/head";

const links = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
            <IconBrandTabler className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        ),
    },
    {
        label: "New Deployment",
        href: "/deploy",
        icon: (
            <Plus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        ),
    }
];

export default function Layout({ children }: { children?: React.ReactNode }) {
    const { connected } = useConnection()
    const [arBalance, setArBalance] = useState(0);

    useEffect(() => {
        axios.get(`https://arweave.net/wallet/${DEPLOYMENT_WALLET}/balance`).then(res => setArBalance((res.data as number) / 1000000000000))
    }, [])
    return (
        <div
            className={cn(
                "flex flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
                "min-h-screen"
            )}
        >
            <Sidebar open={true} setOpen={() => {}}>
                <SidebarBody className="justify-between gap-10 min-h-screen overflow-clip">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        <Link href="/" className="text-2xl whitespace-nowrap">⚡️ ARlink</Link>
                        <div className="mt-8 flex flex-col gap-2">
                            {links.map((link, idx) => (
                                <SidebarLink key={idx} link={link} />
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="py-5 text-muted-foreground text-center">
                          
                        </div>
                        <ConnectButton />
                    </div>
                </SidebarBody>
            </Sidebar>
            <div className="flex flex-1">
                <div className="p-2 md:p-10 rounded-t-2xl md:rounded-r-2xl md:rounded-l-none border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full max-h-screen overflow-scroll">
                    {connected ? children : "Connect Wallet to continue :)"}
                </div>
            </div>
        </div>
    );
}
