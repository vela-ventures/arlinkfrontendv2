import { getAllTemplates } from "@/actions/github/template";
import TemplateSelector from "@/components/template-selector";
import useDeploymentManager from "@/hooks/use-deployment-manager";
import { useTemplateStore } from "@/store/use-template-store";
import type { TemplateDashboard } from "@/types";
import { useEffect, useState } from "react";

export default function TemplateDashboard() {
    const { setTemplates, templates } = useTemplateStore();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { managerProcess } = useDeploymentManager();

    useEffect(() => {
        const fetchTemplates = async () => {
            if (templates.length === 0) {
                setIsLoading(true);
            }
            const response = await getAllTemplates();
            console.log(response.templates);
            setTemplates(response.templates);
            if (templates.length === 0) {
                setIsLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    useEffect(() => {
        console.log(managerProcess);
    }, [managerProcess]);

    return (
        <div className="min-h-screen bg-random text-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="space-y-4 my-[50px]">
                    <h1 className="text-2xl md:text-center text-left tracking-tight sm:text-6xl font-bold">
                        Launch with a Template
                    </h1>
                    <div className="flex text-center  justify-center items-center gap-2">
                        <p className="text-neutral-300 leading-[1.4] text-xl text-left md:text-center tracking-tight">
                            Jumpstart your app development process with
                            pre-built
                            <br />
                            solutions from our community.
                        </p>
                    </div>
                </div>
                <TemplateSelector isLoading={isLoading} />
            </div>
        </div>
    );
}
