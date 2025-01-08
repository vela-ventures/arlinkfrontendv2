import { parentPort, workerData } from 'worker_threads';
import { spawn } from 'child_process';
import fs from 'fs';

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
    buildProcess.kill();
    parentPort.postMessage({ success: false, error: `Build for ${repository} terminated due to timeout` });
    parentPort.close();
  }, 720000);

  let buildOutput = '';

  buildProcess.stdout.on('data', (data) => {
    buildOutput += data;
    console.log(`${data}`);
  });

  buildProcess.stderr.on('data', (data) => {
    buildOutput += data;
    console.error(`${data}`);
  });

  buildProcess.on('close', (code) => {
    clearTimeout(timeout);
    if (code === 0) {
      parentPort.postMessage({ 
        success: true, 
        message: `Build for ${repository} completed successfully`,
        logs: buildOutput
      });
    } else {
      parentPort.postMessage({ 
        success: false, 
        error: `Build for ${repository} failed with code ${code}`,
        logs: buildOutput
      });
    }
    parentPort.close();
  });

  buildProcess.on('error', (err) => {
    clearTimeout(timeout);
    console.error('Failed to start build process:', err);
    parentPort.postMessage({ 
      success: false, 
      error: `Build for ${repository} failed to start: ${err.message}`,
      logs: buildOutput
    });
    parentPort.close();
  });
}

runBuild(workerData);