import TemplateSelector from "@/components/template-selector";
import GitHubSignIn from "@/components/ui/github-sign-in";
import { useGlobalState } from "@/store/useGlobalState";
import { Suspense } from "react";

export default function TemplateDashboard() {
    const { githubToken } = useGlobalState();
    if (!githubToken) {
        return <GitHubSignIn />;
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl tracking-tight sm:text-4xl font-bold">
                        Select a template
                    </h1>
                    <p className="text-neutral-400 tracking-tight">
                        Jumpstart your app development process with pre-built
                        solutions from our community.
                    </p>
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                    <TemplateSelector />
                </Suspense>
            </div>
        </div>
    );
}
