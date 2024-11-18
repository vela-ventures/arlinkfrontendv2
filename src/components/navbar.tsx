import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useConnection, ConnectButton, useActiveAddress } from "arweave-wallet-kit"
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { getProfileByWalletAddress, ProfileHeaderType } from '@/lib/Bazar';

export default function Navbar() {
    const { connected } = useConnection();
    const address = useActiveAddress();
    const router = useRouter();
    const [isNewDeployment, setIsNewDeployment] = useState(false);
    const [profile, setProfile] = useState<ProfileHeaderType | null>(null);

    const isDeployPage = router.pathname === '/deploy';

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
       
                <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link href="/deploy">
                    <Button variant="ghost">
                        <Plus className="mr-2 h-4 w-4" />
                        New Deployment
                    </Button>
                </Link>
            </div>
            <div className="flex items-center space-x-4">
                <Button variant="ghost">Feedback</Button>
                <Link href="https://arlink.gitbook.io/arlink-docs/getting-started/quickstart" target="_blank">
                    <Button variant="ghost">Docs</Button>
                </Link>
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
