import Layout from "@/layouts/layout";
import { TemplateSelection } from "../../components/ui/template";
import ConfiguringDeploymentProject from "./github/configuring-deployment";
import { useState } from "react";
import type { Steps } from "@/types";
import RepoProvider from "./repo-provider";
import ConfigureProtocolLandProject from "./protocol-land/configuring-pl-deployment";

const NewDeployment = () => {
    const [selectedRepoUrl, setSelectedRepoUrl] = useState<{
        name: string;
        url: string;
    }>({
        name: "project name",
        url: "demo-url",
    });

    const [step, setStep] = useState<Steps>("importing");

    return (
        <Layout>
            <div className="container text-white p-10">
                <Steps
                    step={step}
                    setSelectedRepo={setSelectedRepoUrl}
                    selectedRepo={selectedRepoUrl}
                    setStep={setStep}
                />
            </div>
        </Layout>
    );
};

export default NewDeployment;

const Steps = ({
    step,
    setSelectedRepo,
    selectedRepo,
    setStep,
}: {
    step: Steps;
    setSelectedRepo: React.Dispatch<
        React.SetStateAction<{ name: string; url: string }>
    >;
    selectedRepo: { name: string; url: string };
    setStep: React.Dispatch<React.SetStateAction<Steps>>;
}) => {
    switch (step) {
        case "importing":
            return (
                <>
                    <h1 className="text-4xl font-bold mb-4">
                        Let's Deploy your project
                    </h1>
                    <p className="text-neutral-400 mb-8">
                        Arlink allows you to permanently deploy and manage your
                        <br />
                        web apps on the PermaWeb with ease.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <RepoProvider
                            setSelectedRepo={setSelectedRepo}
                            setStep={setStep}
                        />
                        <TemplateSelection />
                    </div>
                </>
            );
        case "configuring":
            return (
                <ConfiguringDeploymentProject
                    repoName={selectedRepo.name}
                    repoUrl={selectedRepo.url}
                    setStep={setStep}
                />
            );
        case "configuring-protocol":
            return (
                <ConfigureProtocolLandProject
                    setStep={setStep}
                    selectedRepo={selectedRepo}
                />
            );
        default:
            return <div>Something wrong happened</div>;
    }
};
