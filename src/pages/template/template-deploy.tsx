import ConfigureTemplateDeployment from "@/components/configure-template-deployment";
import ConfiguringDeploymentProject from "@/components/configuring-deployment";
import GitHubSignIn from "@/components/ui/github-sign-in";
import { useTemplateStore } from "@/store/use-template-store";
import { useGlobalState } from "@/store/useGlobalState";
import { useParams } from "react-router-dom";

const TemplateDeploy = () => {
    const { templates } = useTemplateStore();
    const { githubToken } = useGlobalState();
    const { owner, repoName } = useParams();
    const currentTemplate = templates.find(
        (t) => t.repoOwner === owner && t.repoName === repoName,
    );

    if (!githubToken) {
        return <GitHubSignIn />;
    }

    if (!currentTemplate) {
        return <div>Template not found</div>;
    }

    return (
        <div className="min-h-screen bg-random text-white p-4 sm:p-8">
            <ConfigureTemplateDeployment
                repoUrl={`https://github.com/${currentTemplate.repoOwner}/${currentTemplate.repoName}`}
            />
        </div>
    );
};

export default TemplateDeploy;
