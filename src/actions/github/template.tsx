import { Octokit } from "@octokit/rest"

export async function forkRepository(githubToken: string,owner: string, repo: string) {
  try {
    const octokit = new Octokit({ auth: githubToken });
    const response = await octokit.repos.createFork({
      owner,
      repo,
    })
    return { success: true, data: response.data }
  } catch (error) {
    console.error("Error forking repository:", error)
    return { success: false, error: "Failed to fork repository" }
  }
}

