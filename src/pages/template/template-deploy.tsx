import GitHubSignIn from "@/components/ui/github-sign-in";
import { useGlobalState } from "@/store/useGlobalState";
import { useParams } from "react-router-dom";
import ConfiguringDeploymentProject from "@/components/configuring-deployment";
import { Steps } from "@/types";
import { useState } from "react";

const TemplateDeploy = () => {
    const [step, setStep] = useState<Steps>("configuring");

    const { owner, repoName } = useParams();
    const { githubToken } = useGlobalState();
    const selectedUrl = `https://github.com/${owner}/${repoName}`;
    if (!githubToken) {
        return <GitHubSignIn />;
    }

    if (!repoName) {
        return <div>Template not found</div>;
    }

    return (
        <div className="min-h-screen bg-random text-white p-4 sm:p-8">
            <ConfiguringDeploymentProject
                repoName={repoName}
                repoUrl={selectedUrl}
                setStep={setStep}
            />
        </div>
    );
};

export default TemplateDeploy;
