import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useConnection, ConnectButton, useActiveAddress } from "arweave-wallet-kit"
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Navbar() {
    const { connected } = useConnection();
    const address = useActiveAddress();
    const router = useRouter();
    const [isNewDeployment, setIsNewDeployment] = useState(false);

    const isDeployPage = router.pathname === '/deploy';

    return (
        <nav className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center space-x-4">
                <img src="/joose.svg" alt="Joose logo" style={{ width: '50px', height: '50px' }} />
                <span className="font-bold">
                    {isDeployPage ? "Create New Deployment" : "internettrashh's projects"}
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
                <Link href="/changelogs">
                    <Button variant="ghost">Changelog</Button>
                </Link>
                <Button variant="ghost">Docs</Button>
                <ConnectButton />
                <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
            </div>
        </nav>
    )
}
