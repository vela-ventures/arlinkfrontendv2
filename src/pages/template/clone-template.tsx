import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, GitBranch, Github, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTemplateStore } from "@/store/use-template-store";
import AnimatedCloneTemplate from "@/components/animated-clone-template";
import { cloneGitHubRepo } from "@/actions/github/clone-gh-repo";
import { useGlobalState } from "@/store/useGlobalState";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { extractOwnerName } from "../utilts";
import { extractRepoName } from "../utilts";
import { GitHubSignInDeploy } from "@/components/ui/github-sign-in";
import { getTemplateDetails } from "@/actions/github/template";
import { Template } from "@/types";

const CloneTemplate = () => {
    const { id, name, framework } = useParams();
    const { templates } = useTemplateStore();
    const { githubToken } = useGlobalState();
    const [loader, setLoader] = useState(false);
    const [, setError] = useState("");
    const [projectName, setProjectName] = useState("");
    const cloneRef = useRef<HTMLDivElement>(null);
    const [, setLoading] = useState(false);
    const navigate = useNavigate();
    const [currentTemplate, setCurrentTemplate] = useState<Template | null>(
        null,
    );

    useEffect(() => {
        if (!id || !name || !framework) return;
        const getTemplate = async () => {
            setLoading(true);
            const template = await getTemplateDetails({
                framework,
                templateName: name,
                templateId: id,
            });
            if (template.error) {
                setError(template.error);
            } else if (template.template) {
                console.log(template.template);
                setCurrentTemplate(template.template);
            }
            setLoading(false);
        };
        getTemplate();
    }, [templates, id]);

    if (!githubToken) {
        return (
            <div className="flex flex-col items-center mt-16 min-h-screen p-4">
                <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-8 max-w-md w-full">
                    <div className="flex flex-col items-center text-center gap-6">
                        <Github className="w-16 h-16 text-neutral-700" />

                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-white">
                                Connect GitHub
                            </h2>
                            <p className="text-neutral-400">
                                Sign in with GitHub to create your project
                                repository
                            </p>

                            <GitHubSignInDeploy />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleProjectNameChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setProjectName(e.target.value);
    };

    if (!currentTemplate) {
        return (
            <section className="max-w-3xl mx-auto pt-8 pb-40 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center text-sm mb-4 animate-pulse">
                    <div className="w-4 h-4 mr-2 bg-neutral-800 rounded" />
                    <div className="w-16 h-4 bg-neutral-800 rounded" />
                </div>

                <div className="w-48 h-8 bg-neutral-800 rounded mb-8 animate-pulse" />

                <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-[14px] mb-6">
                    <div className="flex flex-col items-start w-full gap-6">
                        {/* Thumbnail skeleton */}
                        <div className="w-full aspect-video bg-neutral-800 rounded-md animate-pulse" />

                        <div className="w-full space-y-4">
                            {/* Title skeleton */}
                            <div className="w-1/3 h-6 bg-neutral-800 rounded animate-pulse" />

                            {/* Description skeleton */}
                            <div className="space-y-2">
                                <div className="w-full h-4 bg-neutral-800 rounded animate-pulse" />
                                <div className="w-2/3 h-4 bg-neutral-800 rounded animate-pulse" />
                            </div>

                            {/* GitHub info skeleton */}
                            <div className="space-y-3">
                                <div className="w-24 h-3 bg-neutral-800 rounded animate-pulse" />
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-neutral-800 rounded-full" />
                                    <div className="w-40 h-5 bg-neutral-800 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const handleDeploy = async () => {
        window.scrollBy({
            top: 800,
            behavior: "smooth",
        });
        if (!projectName) {
            toast.error("Please enter a project name");
            return;
        }
        setLoader(true);

        try {
            const data = await cloneGitHubRepo(
                `https://github.com/${extractOwnerName(
                    currentTemplate.repoUrl,
                )}/${extractRepoName(currentTemplate.repoUrl)}`,
                projectName,
                githubToken,
            );

            if (data.error) {
                toast.error("Failed to clone repository");
                setError(data.error);
            } else {
                setLoader(false);
                toast.success("Repository cloned successfully!");
                navigate(
                    `/deploy/${extractOwnerName(data.url)}/${extractRepoName(
                        data.url,
                    )}`,
                );
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
            setError("Failed to clone repository");
        } finally {
            setLoader(false);
        }
    };

    return (
        <section>
            <div className="max-w-3xl mx-auto pt-8 pb-40 px-4 sm:px-6 lg:px-8">
                <Link
                    to="/deploy"
                    className="inline-flex items-center text-sm transition-all text-[#868686] hover:text-white mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go back
                </Link>

                <h1 className="text-2xl font-bold mb-8 tracking-tighter">
                    Start your new project
                </h1>

                {/* Template Card */}
                <div className="bg-neutral-950 border w-full max-w-[800px] border-neutral-900 hover:border-neutral-800 rounded-lg p-[14px] mb-6">
                    <div className="flex flex-col items-start w-full gap-6">
                        <img
                            src={currentTemplate?.thumbnailUrl}
                            alt="Template preview"
                            className="rounded-md border border-neutral-800 object-cover w-full aspect-video"
                        />

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold">
                                    {currentTemplate?.name}
                                </h2>
                                <ExternalLink className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-sm text-white mb-4">
                                {currentTemplate?.description}
                            </p>
                            <p className="text-xs text-neutral-400 mb-3">
                                cloning from
                            </p>
                            <div className="flex items-start flex-col gap-2 text-sm text-white">
                                <div className="flex items-center gap-2">
                                    <Github className="w-5 h-5" />
                                    <span className="font-semibold">
                                        {extractOwnerName(
                                            currentTemplate.repoUrl,
                                        )}
                                        /
                                        {extractRepoName(
                                            currentTemplate.repoUrl,
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <GitBranch className="w-4 h-4 text-white" />
                                    <div className="flex items-center space-x-2 rounded-full bg-neutral-800 px-3 py-1">
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                        <span className="text-white">main</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div
                            className={`mt-6 ${
                                loader ? "opacity-50 pointer-events-none" : ""
                            }`}
                        >
                            <label className="block text-sm text-neutral-400 mb-2">
                                Public repo name
                            </label>
                            <Input
                                type="text"
                                placeholder="Enter your project title name"
                                className="bg-arlink-bg-secondary-color border border-neutral-700 text-white placeholder:text-[#868686]"
                                value={projectName}
                                onChange={handleProjectNameChange}
                                disabled={loader}
                            />
                        </div>

                        {/* Create Button */}
                        <Button
                            onClick={handleDeploy}
                            className="w-full bg-white text-black hover:bg-gray-200 my-4"
                            disabled={loader}
                        >
                            Create
                        </Button>
                        {/* Info Message */}
                        <div
                            className={`bg-arlink-bg-secondary-color opacity-70 border border-neutral-700 flex items-center gap-2 rounded-lg p-4 text-sm text-white ${
                                loader ? "opacity-50" : ""
                            }`}
                        >
                            <Info
                                className="w-5 h-5 flex-shrink-0"
                                fill="white"
                                stroke="black"
                            />
                            <p>
                                The repository cloning process will take
                                approximately 5-10 seconds to complete. Please
                                remain on this page during the process. A new
                                repository will be created with your specified
                                name by cloning the selected template.
                            </p>
                        </div>
                    </div>
                </div>

                {loader && (
                    <motion.div
                        ref={cloneRef}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-black border border-neutral-800 rounded-lg p-[40px]"
                    >
                        <p className="text-lg mb-4 font-semibold tracking-tighter">
                            Cloning the repo
                            <span className="inline-flex">
                                <motion.span
                                    initial={{ y: 0 }}
                                    animate={{ y: [-2, 0] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 0.6,
                                        ease: "easeInOut",
                                        repeatType: "reverse",
                                    }}
                                >
                                    .
                                </motion.span>
                                <motion.span
                                    initial={{ y: 0 }}
                                    animate={{ y: [-2, 0] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 0.6,
                                        ease: "easeInOut",
                                        delay: 0.2,
                                        repeatType: "reverse",
                                    }}
                                >
                                    .
                                </motion.span>
                                <motion.span
                                    initial={{ y: 0 }}
                                    animate={{ y: [-2, 0] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 0.6,
                                        ease: "easeInOut",
                                        delay: 0.4,
                                        repeatType: "reverse",
                                    }}
                                >
                                    .
                                </motion.span>
                            </span>
                        </p>
                        <div className="flex items-center gap-2 text-sm text-white mb-3">
                            <span>From</span>
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M10 0C8.68678 0 7.38642 0.258658 6.17317 0.761205C4.95991 1.26375 3.85752 2.00035 2.92893 2.92893C1.05357 4.8043 0 7.34784 0 10C0 14.42 2.87 18.17 6.84 19.5C7.34 19.58 7.5 19.27 7.5 19V17.31C4.73 17.91 4.14 15.97 4.14 15.97C3.68 14.81 3.03 14.5 3.03 14.5C2.12 13.88 3.1 13.9 3.1 13.9C4.1 13.97 4.63 14.93 4.63 14.93C5.5 16.45 6.97 16 7.54 15.76C7.63 15.11 7.89 14.67 8.17 14.42C5.95 14.17 3.62 13.31 3.62 9.5C3.62 8.39 4 7.5 4.65 6.79C4.55 6.54 4.2 5.5 4.75 4.15C4.75 4.15 5.59 3.88 7.5 5.17C8.29 4.95 9.15 4.84 10 4.84C10.85 4.84 11.71 4.95 12.5 5.17C14.41 3.88 15.25 4.15 15.25 4.15C15.8 5.5 15.45 6.54 15.35 6.79C16 7.5 16.38 8.39 16.38 9.5C16.38 13.32 14.04 14.16 11.81 14.41C12.17 14.72 12.5 15.33 12.5 16.26V19C12.5 19.27 12.66 19.59 13.17 19.5C17.14 18.16 20 14.42 20 10C20 8.68678 19.7413 7.38642 19.2388 6.17317C18.7362 4.95991 17.9997 3.85752 17.0711 2.92893C16.1425 2.00035 15.0401 1.26375 13.8268 0.761205C12.6136 0.258658 11.3132 0 10 0Z"
                                    fill="white"
                                />
                            </svg>

                            <span>
                                {extractOwnerName(currentTemplate.repoUrl)}/
                                {extractRepoName(currentTemplate.repoUrl)}
                            </span>
                        </div>
                        <div className="flex items-center justify-center gap-16 py-8 border border-neutral-800 rounded-md">
                            <AnimatedCloneTemplate />
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default CloneTemplate;
