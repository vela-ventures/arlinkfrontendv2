import { XLogo } from "@phosphor-icons/react";

const TwitterShareButton = ({ undername, className }: { undername: string, className: string}) => {
    const params = new URLSearchParams({
        text: "Take a look! Deployed on Arlink 🚀",
        url: `https://${undername}_arlink.arweave.net`,
        hashtags: "Web3,arweave",
        via: "arlinklabs",
        related: "Web3,Decentralization,Innovation",
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
