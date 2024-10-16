import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getLatestCommitHash(repoUrl, branch) {
  try {
    const { stdout } = await execAsync(`git ls-remote ${repoUrl} ${branch}`);
    const hash = stdout.split('\t')[0];
    return hash.trim();
  } catch (error) {
    console.error('Error fetching latest commit hash:', error);
    throw error;
  }
}