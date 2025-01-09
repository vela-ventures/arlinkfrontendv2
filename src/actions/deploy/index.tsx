import { runLua } from "@/lib/ao-vars";

export async function performDeleteDeployment(
    deploymentName: string,
    managerProcess: string,
    refresh: () => Promise<void>,
) {
    const query = `local res = db:exec[[
          DELETE FROM Deployments
          WHERE Name = '${deploymentName}'
        ]]`;

    try {
        const res = await runLua(query, managerProcess);
        if (res.Error) {
            throw new Error(res.Error);
        }
        console.log(res);
        await refresh();
    } catch (error) {
        throw new Error("Failed to delete deployment. Please try again.");
    }
}
