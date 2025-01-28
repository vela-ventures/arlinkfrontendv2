"use client";

import { useState, useEffect } from "react";
import {
    Search,
    LayoutGrid,
    Box,
    Rocket,
    TriangleIcon,
    Boxes,
    Wallet,
    EclipseIcon,
    Briefcase,
    FileCode,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forkRepository } from "@/actions/github/template";
import { toast } from "sonner";
import { useGlobalState } from "@/store/useGlobalState";
import { Checkbox } from "@/components/ui/checkbox";
import { useTemplateStore } from "@/store/use-template-store";
import { Link } from "react-router-dom";

interface Template {
    id: string;
    title: string;
    description: string;
    creator: string;
    image: string;
    framework: string;
    useCase: string;
    repoOwner: string;
    repoName: string;
}

interface Category {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const frameworks: Category[] = [
    {
        id: "nextjs",
        icon: <LayoutGrid className="w-4 h-4" />,
        label: "Next.js",
    },
    { id: "react", icon: <Box className="w-4 h-4" />, label: "React" },
    { id: "vite", icon: <Rocket className="w-4 h-4" />, label: "Vite" },
    { id: "solidjs", icon: <Boxes className="w-4 h-4" />, label: "Solid.js" },
    {
        id: "angular",
        icon: <TriangleIcon className="w-4 h-4" />,
        label: "Angular",
    },
];

const useCases: Category[] = [
    { id: "solana", icon: <Wallet className="w-4 h-4" />, label: "Solana Dev" },
    {
        id: "ethereum",
        icon: <EclipseIcon className="w-4 h-4" />,
        label: "Eth dev",
    },
    {
        id: "usecase3",
        icon: <Briefcase className="w-4 h-4" />,
        label: "Use case 3",
    },
    {
        id: "usecase4",
        icon: <FileCode className="w-4 h-4" />,
        label: "Use case 4",
    },
];

export default function TemplateSelector() {
    const { templates } = useTemplateStore();
    const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
    const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredTemplates, setFilteredTemplates] =
        useState<Template[]>(templates);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const filtered = templates.filter((template) => {
            const matchesFramework =
                selectedFrameworks.length === 0 ||
                selectedFrameworks.includes(template.framework);
            const matchesUseCase =
                selectedUseCases.length === 0 ||
                selectedUseCases.includes(template.useCase);
            const matchesSearch =
                template.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                template.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());
            return matchesFramework && matchesUseCase && matchesSearch;
        });
        setFilteredTemplates(filtered);
    }, [selectedFrameworks, selectedUseCases, searchQuery]);

    const toggleCategory = (
        category: string,
        type: "framework" | "useCase",
    ) => {
        const updateSelected =
            type === "framework" ? setSelectedFrameworks : setSelectedUseCases;
        const currentSelected =
            type === "framework" ? selectedFrameworks : selectedUseCases;
        updateSelected(
            currentSelected.includes(category)
                ? currentSelected.filter((item) => item !== category)
                : [...currentSelected, category],
        );
    };

    const renderCategoryCheckboxes = (
        categories: Category[],
        type: "framework" | "useCase",
    ) => (
        <div className="space-y-1">
            {categories.map((category) => (
                <label
                    key={category.id}
                    className="flex items-center space-x-2 text-sm hover:bg-neutral-900 transition-colors duration-200 rounded-lg p-2"
                >
                    <Checkbox
                        checked={
                            type === "framework"
                                ? selectedFrameworks.includes(category.id)
                                : selectedUseCases.includes(category.id)
                        }
                        onCheckedChange={() =>
                            toggleCategory(category.id, type)
                        }
                    />
                    <span className="w-6 flex items-center justify-center">
                        {category.icon}
                    </span>
                    <span>{category.label}</span>
                </label>
            ))}
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <Input
                    className="w-full bg-neutral-950 border-neutral-800 pl-4"
                    placeholder="search for a template"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="lg:hidden">
                <Button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    variant="outline"
                    className="w-full justify-between"
                >
                    Filter templates
                    {isFilterOpen ? (
                        <ChevronUp size={16} />
                    ) : (
                        <ChevronDown size={16} />
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[250px,1fr] gap-8">
                <aside
                    className={`space-y-3 lg:block ${
                        isFilterOpen ? "block" : "hidden"
                    }`}
                >
                    <div className="space-y-4">
                        <h2 className="text-neutral-500 text-sm">Framework</h2>
                        {renderCategoryCheckboxes(frameworks, "framework")}
                    </div>

                    <div className="space-y-4 border-t border-neutral-800 py-2">
                        <h2 className="text-neutral-500 pt-4 text-sm">
                            Use case
                        </h2>
                        {renderCategoryCheckboxes(useCases, "useCase")}
                    </div>
                </aside>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                        <TemplateCard key={template.id} template={template} />
                    ))}
                </div>
            </div>
        </div>
    );
}

const TemplateCard = ({ template }: { template: Template }) => {
    const { githubToken } = useGlobalState();
    const [forking, setForking] = useState(false);

    const handleFork = async (template: Template) => {
        if (!githubToken) {
            toast.error("Please connect your GitHub account to fork templates");
            return;
        }

        setForking(true);
        const result = await forkRepository(
            githubToken,
            template.repoOwner,
            template.repoName,
        );
        if (result.success) {
            setForking(false);
            toast.success(`Successfully forked ${template.title}`);
        } else {
            setForking(false);
            toast.error(`Failed to fork ${template.title}`);
        }
    };

    return (
        <div
            key={template.id}
            className="block h-fit rounded-lg overflow-hidden border border-neutral-900 bg-arlink-bg-secondary-color hover:border-neutral-700 transition-colors"
        >
            <div className="aspect-video pt-1 px-1 relative overflow-hidden">
                <img
                    src={template.image || "/placeholder.svg"}
                    alt={template.title}
                    className="object-cover  object-center w-full h-full border border-neutral-900 rounded-md"
                />
            </div>
            <div className="p-2 flex flex-col gap-2 ">
                <div className="px-1">
                    <div className="flex items-center space-x-2">
                        <span className="bg-neutral-900 border border-neutral-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                            {
                                frameworks.find(
                                    (f) => f.id === template.framework,
                                )?.icon
                            }
                        </span>
                        <span className="font-semibold">{template.title}</span>
                    </div>
                    <p className="text-sm pl-10 text-neutral-400">
                        {template.description.length > 20
                            ? template.description.slice(0, 20) + "..."
                            : template.description}
                    </p>
                </div>
                <div className="p-2 flex gap-2 items-start justify-between">
                    <span className="text-sm text-neutral-500">
                        Creator: {template.creator}
                    </span>
                    <Link
                        to={`/templates/${template.repoOwner}/${template.repoName}`}
                        className="flex items-center hover:underline -transparent text-sm gap-2 font-semibold rounded-sm"
                    >
                        deploy
                    </Link>
                </div>
            </div>
        </div>
    );
};
