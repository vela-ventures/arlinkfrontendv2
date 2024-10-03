import { Worker } from "worker_threads";
import { spawn } from "child_process";
import path from "path";
import os from "os";

const MAX_CONCURRENT_BUILDS = os.cpus().length;

export function runBuilds(builds) {
  let runningBuilds = 0;
  const buildQueue = [...builds];

  return new Promise((resolve) => {
    function startNextBuild() {
      if (buildQueue.length === 0 && runningBuilds === 0) {
        resolve();
        return;
      }

      if (runningBuilds >= MAX_CONCURRENT_BUILDS || buildQueue.length === 0) {
        return;
      }

      const build = buildQueue.shift();
      runningBuilds++;

      const worker = new Worker(path.resolve("buildWorker.js"), {
        workerData: build,
      });

      worker.on("message", (message) => {
        console.log(`Build completed: ${message}`);
      });

      worker.on("error", (error) => {
        console.error(`Build error: ${error}`);
      });

      worker.on("exit", (code) => {
        runningBuilds--;
        if (code !== 0) {
          console.error(`Worker stopped with exit code ${code}`);
        }
        startNextBuild();
      });
    }

    for (let i = 0; i < MAX_CONCURRENT_BUILDS; i++) {
      startNextBuild();
    }
  });
}
