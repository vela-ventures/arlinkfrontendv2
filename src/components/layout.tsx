import React, { useEffect, useState } from "react";
import { cn, DEPLOYMENT_WALLET } from "@/lib/utils";
import axios from "axios";
import { ConnectButton, useConnection } from "arweave-wallet-kit";
import Navbar from "@/components/navbar"; // Import the Navbar component

export default function Layout({ children }: { children?: React.ReactNode }) {
    const { connected } = useConnection();
   

    
    return (
        <div className={cn(
            "flex flex-col bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
            "min-h-screen bg-background"
        )}>
            <Navbar />
          
                <div className="p-2 md:p-10  border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full max-h-screen overflow-scroll">
                    {connected ? children : "Connect Wallet to continue :)"}
                </div>
            </div>
      
    );
}