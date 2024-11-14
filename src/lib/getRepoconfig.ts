interface PackageConfig {
    repoName: string;
    installCommand: string;
    buildCommand: string;
    outputDir: string;
  }
  
  // Move getDefaultConfig before it's used
  function getDefaultConfig( repoName: string): PackageConfig {
    return {
      repoName: repoName,
      installCommand: 'npm install',
      buildCommand: 'npm run build',
      outputDir: './dist'
    };
  }
  
  import { Octokit } from "@octokit/rest";

  const octokit = new Octokit();
  
  export async function getRepoConfig(owner: string, repo: string): Promise<PackageConfig> {
    try {
      const branches = ['main', 'master'];
      let packageJson = null;
  
      for (const branch of branches) {
        try {
          const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: 'package.json',
            ref: branch,
          });
          
          if ('content' in data) {
            const content = atob(data.content);
            packageJson = JSON.parse(content);
            break;
          }
        } catch (e) {
          continue;
        }
      }
  
      if (packageJson) {
        return {
          repoName: repo,
          installCommand: packageJson.scripts?.install || 'npm install',
          buildCommand: packageJson.scripts?.build || 'npm run build',
          outputDir: packageJson.main ? packageJson.main.split('/').slice(0, -1).join('/') : './dist'
        };
      }
  
      return getDefaultConfig(repo);
    } catch (error) {
      console.error('Error fetching repo config:', error);
      return getDefaultConfig(repo);
    }
  }