import MarkdownRender from "@/components/markdown-render";
import { Button } from "@/components/ui/button";
import { getRepoReadme } from "@/lib/getRepoconfig";
import { useTemplateStore } from "@/store/use-template-store";
import { useGlobalState } from "@/store/useGlobalState";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";

const SelectedTemplate = () => {
    const { owner, repoName } = useParams();
    const template = useTemplateStore();
    const { githubToken } = useGlobalState();
    const [fetchingReadme, setFetchingReadme] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [readmeContent, setReadmeContent] = useState<string>("");

    if (!githubToken) {
        return <Navigate to="/deploy" />;
    }

    const currentTemplate = template.templates.find(
        (t) => t.repoOwner === owner && t.repoName === repoName,
    );

    if (!currentTemplate) {
        return <div>Template not found</div>;
    }

    useEffect(() => {
        const fetchReadmeContent = async () => {
            setFetchingReadme(true);
            const data = await getRepoReadme(
                currentTemplate.repoOwner,
                currentTemplate.repoName,
            );
            if (data.error) {
                setFetchingReadme(false);
                setError("failed to fetch readme");
                setTimeout(() => {
                    setError("");
                }, 300);
            } else if (data.content) {
                setReadmeContent(data.content);
            }
            setFetchingReadme(false);
        };
        fetchReadmeContent();
    }, []);

    return (
        <div className="max-w-7xl mx-auto text-white px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:min-h-screen gap-8">
                <div className="w-full lg:w-[40%] p-4 lg:p-8 lg:top-[115px] flex-shrink-0 lg:sticky lg:h-fit">
                    <div className="space-y-6 lg:space-y-8">
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
                            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight lg:leading-[1.2]">
                                {currentTemplate.title}
                            </h1>
                        </div>

                        <p className="text-lg lg:text-xl text-neutral-400">
                            {currentTemplate.description}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <Link
                                to={`/templates/deploy/${currentTemplate.repoOwner}/${currentTemplate.repoName}`}
                                className="w-full flex justify-center items-center px-3 py-1 rounded-md font-semibold sm:w-auto bg-white text-black hover:bg-neutral-200"
                            >
                                Deploy
                            </Link>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                            >
                                View Demo
                            </Button>
                        </div>

                        <div className="grid gap-4 pt-6 lg:pt-8 border-t border-neutral-800">
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

                <div className="w-full lg:w-[60%] p-4 lg:p-8">
                    <div className="rounded-lg text-white">
                        <img
                            src={currentTemplate.image}
                            alt="Next.js Logo"
                            className="mb-6 lg:mb-8 w-full h-[200px] sm:h-[250px] lg:h-[300px] object-cover rounded-lg"
                        />
                    </div>

                    <div className="mt-6 lg:mt-8 pb-[60px] lg:pb-[100px]">
                        <MarkdownRender
                            title={`Documentation for ${currentTemplate.title}`}
                            content={readmeContent}
                            isLoading={fetchingReadme}
                            error={error}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectedTemplate;
