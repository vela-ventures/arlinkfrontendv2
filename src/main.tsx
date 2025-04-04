import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { ArweaveWalletKit } from "@arweave-wallet-kit/react";
import WanderStrategy from "@arweave-wallet-kit/wander-strategy";
import OthentStrategy from "@arweave-wallet-kit/othent-strategy";
import AoSyncStrategy from "@vela-ventures/aosync-strategy";
import BrowserWalletStrategy from "@arweave-wallet-kit/browser-wallet-strategy";
import WebWalletStrategy from "@arweave-wallet-kit/webwallet-strategy";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ArweaveWalletKit
            config={{
                permissions: [
                    "ACCESS_ADDRESS",
                    "ACCESS_PUBLIC_KEY",
                    "SIGN_TRANSACTION",
                    "DISPATCH",
                ],
                ensurePermissions: true,
                appInfo: {
                    name: "arlink"
                },
                strategies: [
                    new WanderStrategy(),
                    new OthentStrategy(),
                    new AoSyncStrategy(),
                    new BrowserWalletStrategy(),
                    new WebWalletStrategy(),
                  ],
            }}
            theme={{
                displayTheme: "dark",
            }}
        >
            <App />
        </ArweaveWalletKit>
    </React.StrictMode>,
);
