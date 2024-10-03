import { Worker } from "worker_threads";
import path from "path";
import os from "os";

const MAX_CONCURRENT_BUILDS = os.cpus().length;
let runningBuilds = 0;
const buildQueue = [];

function createBuildWorker(buildParams) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve("buildWorker.js"), {
      workerData: buildParams,
    });

    worker.on("message", (message) => {
      console.log(`Build completed: ${message}`);
      resolve(message);
    });

    worker.on("error", reject);

    worker.on("exit", (code) => {
      runningBuilds--;
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
      processQueue();
    });
  });
}

function processQueue() {
  while (runningBuilds < MAX_CONCURRENT_BUILDS && buildQueue.length > 0) {
    const nextBuild = buildQueue.shift();
    runningBuilds++;
    createBuildWorker(nextBuild);
  }
}

export function runBuild(
  gitRepo,
  branch,
  installCommand,
  buildCommand,
  distFolder,
  subdirectory = "",
) {
  const buildParams = {
    gitRepo,
    branch,
    installCommand,
    buildCommand,
    distFolder,
    subdirectory,
  };

  return new Promise((resolve, reject) => {
    buildQueue.push(buildParams);
    processQueue();

    // We resolve immediately, but the build will run when a slot is available
    resolve(`Build for ${gitRepo} queued`);
  });
}
