import { parentPort, workerData } from "worker_threads";
import { spawn } from "child_process";

function runBuild(buildData) {
  const {
    gitRepo,
    branch,
    installCommand,
    buildCommand,
    distFolder,
    subdirectory,
  } = buildData;

  const nixShellCommand = `nix-shell build.nix --run 'build ${gitRepo} ${branch} "${installCommand}" "${buildCommand}" ${distFolder}${subdirectory ? ` ${subdirectory}` : ""}'`;

  const buildProcess = spawn("sh", ["-c", nixShellCommand]);

  buildProcess.stdout.on("data", (data) => {
    console.log(`${data}`);
  });

  buildProcess.stderr.on("data", (data) => {
    console.error(`${data}`);
  });

  buildProcess.on("close", (code) => {
    if (code === 0) {
      parentPort.postMessage(`Build for ${gitRepo} completed successfully`);
    } else {
      parentPort.postMessage(`Build for ${gitRepo} failed with code ${code}`);
    }
    parentPort.close();
  });
}

runBuild(workerData);
