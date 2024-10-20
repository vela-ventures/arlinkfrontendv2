import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/components/theme-provider"
import { ArweaveWalletKit } from "arweave-wallet-kit";
import { Toaster } from "@/components/ui/sonner"
import Head from "next/head";
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // This effect will run on the client-side after the initial render
    if (typeof window !== 'undefined') {
      // Check if we're not on the home page
      if (window.location.pathname !== '/') {
        // Force a re-render of the current route
        router.replace(window.location.pathname + window.location.search);
      }
    }
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <ArweaveWalletKit config={{
        permissions: ["ACCESS_ADDRESS", "SIGN_TRANSACTION"],
        ensurePermissions: true,
      }}>
        <Head>
          <title>ARlink</title>
          <meta name="description" content="Deploy & manage permaweb apps easily" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/joose.svg" />
        </Head>
        <Component {...pageProps} />
        <Toaster />
      </ArweaveWalletKit>
    </ThemeProvider>
  );
}
