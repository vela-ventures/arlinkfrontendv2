import { forkRepository } from "@/actions/github/template";
import { Button } from "@/components/ui/button";
import { useTemplateStore } from "@/store/use-template-store";
import { useGlobalState } from "@/store/useGlobalState";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";

const SelectedTemplate = () => {
    const { owner, repoName } = useParams();
    const template = useTemplateStore();
    const { githubToken } = useGlobalState();
    const [isDeploying, setIsDeploying] = useState(false);

    if (!githubToken) {
        return <Navigate to="/deploy" />;
    }

    const currentTemplate = template.templates.find(
        (t) => t.repoOwner === owner && t.repoName === repoName,
    );

    if (!currentTemplate) {
        return <div>Template not found</div>;
    }

    return (
        <div className="max-w-7xl mx-auto text-white">
            <div className="grid lg:grid-cols-[1fr,1fr] lg:h-screen gap-8">
                <div className="p-8 lg:top-[115px] lg:sticky lg:h-fit">
                    <div className="space-y-8">
                        <Link
                            to="/templates"
                            className="inline-flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Template
                        </Link>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                {currentTemplate.repoOwner}/
                                {currentTemplate.repoName}
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl lg:leading-[1.2]">
                                {currentTemplate.title}
                            </h1>
                        </div>

                        <p className="text-xl text-neutral-400">
                            {currentTemplate.description}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <Link
                                to={`/templates/deploy/${currentTemplate.repoOwner}/${currentTemplate.repoName}`}
                                className="w-full flex items-center px-3 py-1 rounded-md font-semibold sm:w-auto bg-white text-black hover:bg-neutral-200"
                            >
                                Deploy
                            </Link>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                disabled={isDeploying}
                            >
                                View Demo
                            </Button>
                        </div>

                        <div className="grid gap-4 pt-8 border-t border-neutral-800">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">
                                    Framework
                                </span>
                                <span>{currentTemplate.framework}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">
                                    Use Case
                                </span>
                                <span>{currentTemplate.useCase}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="rounded-lg text-white">
                        <img
                            src={currentTemplate.image}
                            alt="Next.js Logo"
                            className="mb-8 w-full h-[300px] object-cover rounded-lg"
                        />
                    </div>

                    <div className="mt-8 text-neutral-400">
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold text-white mb-4">
                                Getting Started with {currentTemplate.title}
                            </h2>
                            <p className="mb-4">
                                Follow these steps to get started:
                            </p>
                            <div className="bg-neutral-900 p-4 rounded-lg mt-2">
                                <code>
                                    1. Navigate into the project directory: cd{" "}
                                    {currentTemplate.repoName}
                                </code>
                            </div>
                            <p className="my-4">Install dependencies</p>
                            <div className="bg-neutral-900 p-4 rounded-lg mt-2">
                                <code>2. npm install</code>
                            </div>
                            <p className="my-4">Run the development server</p>
                            <div className="bg-neutral-900 p-4 rounded-lg mt-2">
                                <code>3. npm run dev</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectedTemplate;
