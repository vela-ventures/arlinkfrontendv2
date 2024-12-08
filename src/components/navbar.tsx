import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Link, useLocation } from "react-router-dom"
import { useConnection, ConnectButton, useActiveAddress } from "arweave-wallet-kit"
import { useState, useEffect } from 'react'
import { getProfileByWalletAddress, ProfileHeaderType } from '@/lib/Bazar';

export default function Navbar() {
    //@ts-ignore
    const { connected } = useConnection();
    const address = useActiveAddress();
    //@ts-ignore
    const [isNewDeployment, setIsNewDeployment] = useState(false);
    const [profile, setProfile] = useState<ProfileHeaderType | null>(null);

    const location = useLocation();
    const isDeployPage = location.pathname === '#/deploy';

    useEffect(() => {
        async function fetchProfile() {
            if (address) {
                try {
                    const fetchedProfile = await getProfileByWalletAddress({ address });
                    setProfile(fetchedProfile);
                    console.log("fetchedprofile is ", fetchedProfile);
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
            }
        }

        fetchProfile();
    }, [address]);

    const displayName = profile?.displayName || profile?.username || address?.slice(0, 8) || "Anonymous";
    const avatar = profile?.avatar ? `https://arweave.net/${profile.avatar}` : "";

    return (
        <nav className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center space-x-4">
                <img src="/joose.svg" alt="Joose logo" style={{ width: '50px', height: '50px' }} />
                <span className="font-bold">
                    {isDeployPage ? "Create New Deployment" : `${displayName}'s projects`}
                </span>
       
                <Link to="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link to="/deploy">
                    <Button variant="ghost">
                        <Plus className="mr-2 h-4 w-4" />
                        New Deployment
                    </Button>
                </Link>
            </div>
            <div className="flex items-center space-x-4">
                <Button variant="ghost">Feedback</Button>
                <a href="https://arlink.gitbook.io/arlink-docs/getting-started/quickstart" 
                   target="_blank" 
                   rel="noopener noreferrer">
                    <Button variant="ghost">Docs</Button>
                </a>
                <ConnectButton />
                <div className="w-8 h-8 bg-purple-500 rounded-full">
                    {avatar && (
                        <img src={avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    )}
                </div>
            </div>
        </nav>
    )
}