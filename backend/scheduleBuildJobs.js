import os from 'os';
import { CronJob } from 'cron';
import axios from 'axios';
import { getGlobalRegistry } from './buildRegistry.js';
import { cp } from 'fs';

const MAX_CONCURRENT_BUILDS = os.cpus().length;

const TESTING_MODE = false; // Set to false for production

function createBuildJobs(configs) {
  const totalRepos = configs.length;
  
  if (TESTING_MODE) {
    console.log('Running in TESTING_MODE. Jobs will run every 30 seconds.');
    const job = new CronJob('*/30 * * * * *', () => {
      console.log('Test job triggered at:', new Date().toISOString());
      processBatch(configs);
    }, null, true, 'UTC');
    job.start(); // Explicitly start the job
    return [job];
  }
  
  // Existing production code
  const batchesPerDay = Math.ceil(totalRepos / MAX_CONCURRENT_BUILDS);
  const minutesBetweenBatches = Math.floor(24 * 60 / batchesPerDay);
  
  const jobs = [];
  for (let i = 0; i < batchesPerDay; i++) {
    console.log(`Scheduling batch ${i + 1} of ${batchesPerDay}`);
    const batchStart = i * MAX_CONCURRENT_BUILDS;
    const batchEnd = Math.min((i + 1) * MAX_CONCURRENT_BUILDS, totalRepos);
    const batchConfigs = configs.slice(batchStart, batchEnd);
    console.log('Batch configs:', batchConfigs.map(config => `${config.owner}/${config.repoName}`));
    
    const minutes = (i * minutesBetweenBatches) % 60;
    const hours = Math.floor((i * minutesBetweenBatches) / 60);
    const cronTime = `${minutes} ${hours} * * *`;
    
    console.log('Scheduled for:', cronTime, 'UTC ', minutes, hours);
    jobs.push(new CronJob(cronTime, () => processBatch(batchConfigs), null, true, 'UTC'));
  }
  
  return jobs;
}

async function processBatch(configs) {
  console.log('Processing batch at:', new Date().toISOString());
  console.log('Number of configs in this batch:', configs.length);

  for (const config of configs) {
    try {
      console.log(`Checking for updates: ${config.owner}/${config.repoName}`);
      
      // Use the existing /deploy endpoint to trigger a build
      const response = await axios.post('http://localhost:3050/deploy', config);
      
      if (response.status === 200) {
        console.log(`Build triggered successfully for ${config.owner}/${config.repoName}`);
      } else {
        console.log(`No update needed for ${config.owner}/${config.repoName}`);
      }
    } catch (error) {
      console.error(`Error processing ${config.owner}/${config.repoName}:`, error.message);
    }
  }
}

export async function scheduleBuildJobs() {
  const configs = await getGlobalRegistry();
  console.log('Total configs loaded:', configs.length);
  const jobs = createBuildJobs(configs);
  console.log(`Scheduled ${jobs.length} build job${jobs.length === 1 ? '' : 's'}`);
  
  if (TESTING_MODE) {
    console.log('Test mode active. First job will run in 30 seconds.');
  }
}