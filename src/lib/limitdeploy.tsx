import type { TDeployment } from "@/types";

export const canDeploy = (deployments: TDeployment[]) => {
    const DEPLOYMENT_LIMIT = 3;
    
    // Return null if deployments haven't been fetched yet
    if (!deployments || deployments.length === 0) {
        return null;
    }
    
    return deployments.length < DEPLOYMENT_LIMIT;
}
