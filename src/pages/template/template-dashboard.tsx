import { getAllTemplates } from "@/actions/github/template";
import TemplateSelector from "@/components/template-selector";
import { useTemplateStore } from "@/store/use-template-store";
import type { TemplateDashboard } from "@/types";
import { useEffect, useState } from "react";

export default function TemplateDashboard() {
    const { setTemplates, templates } = useTemplateStore();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchTemplates = async () => {
            if (templates.length === 0) {
                setIsLoading(true);
            }
            const response = await getAllTemplates();
            setTemplates(response.templates);
            if (templates.length === 0) {
                setIsLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    return (
        <div className="min-h-screen bg-random text-white p-4 sm:p-8">
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
                <TemplateSelector isLoading={isLoading} />
            </div>
        </div>
    );
}
