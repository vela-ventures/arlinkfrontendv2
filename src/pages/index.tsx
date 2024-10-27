import { Button } from "@/components/ui/button";
import Link from "next/link";
import { WavyBackground } from "@/components/ui/wavy-background";
import { ConnectButton, useActiveAddress, useConnection } from "arweave-wallet-kit";
import { useEffect } from "react";
import { useRouter } from 'next/router';

export default function Home() {
  const { connected, connect } = useConnection();
  const router = useRouter();

  useEffect(() => {
    connect();

    // Check if we're not supposed to be on the home page
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      router.replace(window.location.pathname + window.location.search);
    }
  }, []);

  // Only render the home page content if we're actually on the home page
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    return null; // or a loading spinner
  }

  
  return (
    <WavyBackground blur={10} waveWidth={100} colors={["#00ff00", "#32cd32", "#98fb98", "#00fa9a", "#00bfff", "#ffd700"]} backgroundFill="#111" className="w-full">
      <div className="flex flex-col items-center justify-center w-full">
        <h1 className="text-center text-5xl md:text-6xl font-bold">ARlink</h1>
        <p className="md:text-xl my-1">Deploy & manage permaweb apps easily</p>
        <Link href={connected ? "/dashboard" : "/deploy"}><Button className="rounded-full my-6">{connected ? "View Deployments" : "Deploy your first app"} <span className="text-2xl ml-1">⚡️</span></Button></Link>
      </div>
      <div className="fixed bottom-5 left-0 right-0 text-center">
        Deploy to Permaweb | ArNS and CICD Integrated
      </div>
      <div className="fixed bottom-1 left-0 right-0 text-right">
        v0.0.6 BETA
      </div>
    </WavyBackground>
  );
}
