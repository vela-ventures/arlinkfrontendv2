import { parentPort, workerData } from 'worker_threads';
import { spawn } from 'child_process';

function runBuild(buildParams) {
  const { repository, branch, installCommand, buildCommand, outputDist, subDirectory } = buildParams;

  const nixShellCommand = `nix-shell build.nix --run 'build ${repository} ${branch} "${installCommand}" "${buildCommand}" ${outputDist}${subDirectory ? ` ${subDirectory}` : ''}'`;

  const buildProcess = spawn('sh', ['-c', nixShellCommand]);

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