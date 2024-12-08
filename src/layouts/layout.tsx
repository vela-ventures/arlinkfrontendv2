import React from "react";
import {  useConnection } from "arweave-wallet-kit";
import Navbar from "@/components/navbar";

export default function Layout({ children }: { children?: React.ReactNode }) {
    const { connected } = useConnection();
    
    return (
        <div className="min-h-screen bg-black">
            <header className="px-6">
                <Navbar />
            </header>
            
            <main className="w-full">
                {connected ? children : (
                    <div className="text-zinc-200">Connect Wallet to continue :)</div>
                )}
            </main>
        </div>
    );
}