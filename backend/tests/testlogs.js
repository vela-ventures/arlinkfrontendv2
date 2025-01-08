import axios from 'axios';

const owner = "ARlinklabs";
const repo = "preact-test-template";
const BASE_URL = 'http://localhost:3050';

async function checkLogs() {
  try {
    const response = await axios.get(`${BASE_URL}/logs/${owner}/${repo}`);
    console.log(`[${new Date().toISOString()}] Logs found:`);
    console.log(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`[${new Date().toISOString()}] Logs not found yet...`);
    } else {
      console.error(`[${new Date().toISOString()}] Error:`, error.message);
    }
  }
}

// Run immediately once
checkLogs();

// Then check every 2 seconds
const interval = setInterval(checkLogs, 2000);

// Handle program termination
process.on('SIGINT', () => {
  clearInterval(interval);
  console.log('\nStopping log checker...');
  process.exit(0);
});

console.log(`Checking logs for ${owner}/${repo}`);
console.log('Press Ctrl+C to stop');