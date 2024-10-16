import { parentPort, workerData } from 'worker_threads';
import { spawn } from 'child_process';
import path from 'path';

function runBuild(buildParams) {
  const { repository, branch, installCommand, buildCommand, outputDist, subDirectory, protocolLand, walletAddress, repoName, projectRoot } = buildParams;

  const nixShellCommand = `nix-shell build.nix --run 'build "${repository}" "${branch}" "${installCommand}" "${buildCommand}" "${outputDist}" "${projectRoot}" "${subDirectory || ''}" "${protocolLand}" "${walletAddress || ''}" "${repoName || ''}"'`;

  console.log("Executing command:", nixShellCommand);

  const buildProcess = spawn('sh', ['-c', nixShellCommand], {
    cwd: projectRoot
  });

  buildProcess.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  buildProcess.stderr.on('data', (data) => {
    console.error(`${data}`);
  });

  buildProcess.on('close', (code) => {
    if (code === 0) {
      parentPort.postMessage(`Build for ${repository} completed successfully`);
    } else {
      parentPort.postMessage(`Build for ${repository} failed with code ${code}`);
    }
    parentPort.close();
  });
}

runBuild(workerData);