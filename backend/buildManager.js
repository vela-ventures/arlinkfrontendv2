import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';
import fs from 'fs';

const MAX_CONCURRENT_BUILDS = os.cpus().length;
let runningBuilds = 0;
const buildQueue = [];

function createBuildWorker(buildParams) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve('buildWorker.js'), {
      workerData: buildParams
    });

    worker.on('message', (message) => {
      console.log(`Build completed: ${message}`);
      resolve(message);
    });

    worker.on('error', reject);

    worker.on('exit', (code) => {
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
    nextBuild.start();
  }
}

export async function runBuild(buildParams) {
  return new Promise((resolve, reject) => {
    const build = {
      params: buildParams,
      start: () => {
        createBuildWorker(buildParams)
          .then(result => {
            const { repository, outputDist } = buildParams;
            const owner = repository.split('/').reverse()[1];
            const folderName = repository.replace(/\.git|\/$/, "").split("/").pop();
            const buildPath = `./builds/${owner}/${folderName}/${outputDist}`;
            
            if (fs.existsSync(`${buildPath}/index.html`)) {
              resolve({ result, buildPath });
            } else {
              reject(new Error("index.html does not exist in build"));
            }
          })
          .catch(reject);
      }
    };

    buildQueue.push(build);
    processQueue();
  });
}