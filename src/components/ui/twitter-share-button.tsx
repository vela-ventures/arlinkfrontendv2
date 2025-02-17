import { XLogo } from "@phosphor-icons/react";
import { url } from "node:inspector/promises";

const TwitterShareButton = ({ undername, className }: { undername: string, className: string}) => {
    const params = new URLSearchParams({
        text: `
🚀 Deployed my project on @arlinklabs with 1 click!

Now it’s permanently hosted on #Arweave, fully decentralized, and accessible via 250+ @ar_io_network gateways.

Check it out: https://${undername}_arlink.ar.io`,
      
    });
    const twitterIntentUrl = `https://twitter.com/intent/tweet?${params.toString()}`;

    return (
        <a
            href={twitterIntentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
        >
            Share on
            <XLogo size={18} className="ml-1" />
        </a>
    );
};

export default TwitterShareButton;
