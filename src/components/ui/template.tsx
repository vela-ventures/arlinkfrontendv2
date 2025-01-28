import { Card } from "@/components/ui/card";
import { useTemplateStore } from "@/store/use-template-store";
import { useGlobalState } from "@/store/useGlobalState";
import { Template } from "@/types";
import { ChevronRightIcon, GithubIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function TemplateSelection() {
    const { templates } = useTemplateStore();
    const { githubToken } = useGlobalState();
    return (
        <Card className="mx-auto py-4 border-neutral-900 bg-arlink-bg-secondary-color md:w-auto w-full overflow-hidden relative px-6  rounded-lg flex flex-col">
            {!githubToken && (
                <div className="absolute z-40 inset-0 backdrop-blur-2xl bg-black/50">
                    <div className="flex items-center justify-center h-full">
                        <p className="text-center text-white text-3xl font-bold">
                            Coming soon...
                        </p>
                    </div>
                </div>
            )}
            <h2 className="text-2xl tracking-tight font-semibold mb-4">
                Start with a template
            </h2>
            <div className="grid grid-cols-2 relative z-10 flex-grow gap-4">
                <TemplateCard template={templates[0]} className="col-span-2" />
                <TemplateCard template={templates[1]} />
                <TemplateCard template={templates[2]} />
            </div>

            <Link
                to="/templates"
                className="pt-3 hover:text-white text-sm text-neutral-400 flex items-center gap-2"
            >
                browse all the templates
                <ChevronRightIcon className="w-4 h-4" />
            </Link>
        </Card>
    );
}

function TemplateCard({
    template,
    className,
}: {
    template: Template;
    className?: string;
}) {
    return (
        <Link
            to={`/templates/${template.repoOwner}/${template.repoName}`}
            className={className}
        >
            <Card
                className={`bg-arlink-bg-secondary-color hover:border-neutral-600 group rounded-md overflow-hidden flex flex-col ${className}`}
            >
                <div className="relative z-0 flex-grow w-full">
                    <img
                        className="w-full max-w-full object-cover h-[144px]"
                        src={template.image}
                    />
                </div>
                <div className="py-2 flex gap-2 border-t group-hover:border-neutral-600">
                    <div className="flex px-2 items-center gap-2">
                        <div className="bg-neutral-900 border-neutral-600 p-2 rounded-full group-hover:border-neutral-400">
                            <GithubIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold">
                            {template.title}
                        </span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
