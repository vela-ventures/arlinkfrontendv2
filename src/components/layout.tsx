import React, { useEffect, useState } from "react";
import { cn, DEPLOYMENT_WALLET } from "@/lib/utils";
import axios from "axios";
import { ConnectButton, useConnection } from "arweave-wallet-kit";
import Navbar from "@/components/navbar";

export default function Layout({ children }: { children?: React.ReactNode }) {
    const { connected } = useConnection();
    
    return (
        <div className={cn(
            "flex flex-col bg-black w-full flex-1 mx-auto border border-zinc-800 overflow-hidden",
            "min-h-screen"
        )}>
            <Navbar />
            <div className="p-2 md:p-10 border border-zinc-800 bg-black flex flex-col gap-2 flex-1 w-full h-full max-h-screen overflow-scroll">
                {connected ? children : (
                    <div className="text-zinc-200">Connect Wallet to continue :)</div>
                )}
            </div>
        </div>
    );
}