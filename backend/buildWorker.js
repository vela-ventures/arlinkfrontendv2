import { parentPort, workerData } from 'worker_threads';
import { spawn } from 'child_process';

function runBuild(buildParams) {
  const { repository, branch, installCommand, buildCommand, outputDist, subDirectory, protocolLand, walletAddress, repoName, projectRoot } = buildParams;

  const nixShellCommand = `nix-shell build.nix --run 'build "${repository}" "${branch}" "${installCommand}" "${buildCommand}" "${outputDist}" "${projectRoot}" "${subDirectory || ''}" "${protocolLand || false}" "${walletAddress || ''}" "${repoName || ''}"'`;

  console.log("Executing command:", nixShellCommand);
  console.table(buildParams);

  const buildProcess = spawn('sh', ['-c', nixShellCommand], {
    cwd: projectRoot
  });

  // Set 10 minute timeout
  const timeout = setTimeout(() => {
    console.error(`Build timeout reached (10 minutes) for ${repository}`);
    buildProcess.kill(); // This kills just this process tree
    parentPort.postMessage(`Build for ${repository} terminated due to timeout`);
    parentPort.close();
  }, 720000); // 10 minutes in milliseconds

  buildProcess.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  buildProcess.stderr.on('data', (data) => {
    console.error(`${data}`);
  });

  buildProcess.on('close', (code) => {
    clearTimeout(timeout);
    if (code === 0) {
      parentPort.postMessage(`Build for ${repository} completed successfully`);
    } else {
      parentPort.postMessage(`Build for ${repository} failed with code ${code}`);
    }
    parentPort.close();
  });

  buildProcess.on('error', (err) => {
    clearTimeout(timeout);
    console.error('Failed to start build process:', err);
    parentPort.postMessage(`Build for ${repository} failed to start: ${err.message}`);
    parentPort.close();
  });
}

runBuild(workerData);