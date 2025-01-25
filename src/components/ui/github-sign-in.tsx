import { initiateGitHubAuth } from "@/actions/github";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Github } from "lucide-react";
import { useState } from "react";

export default function GitHubSignIn() {
    const [isLoading, setIsLoading] = useState(false);
    const handleGithubLogin = async () => {
        setIsLoading(true);
        await initiateGitHubAuth({ template: true });
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <Card className="w-full max-w-md bg-neutral-900 text-white border-neutral-800">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Connect with GitHub
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-center">
                        Link your GitHub account to get started
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Button
                        variant="outline"
                        className="w-full bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700 hover:text-white"
                        onClick={() => {
                            handleGithubLogin();
                        }}
                    >
                        <Github className="mr-2 h-4 w-4" />
                        {isLoading ? "Connecting..." : "Connect GitHub Account"}
                    </Button>
                </CardContent>
                <CardFooter className="text-sm flex justify-center items-center text-neutral-500 ">
                    <p className="text-center">
                        By connecting, you will be able to use templates
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
