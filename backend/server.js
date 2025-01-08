// server.js
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function startServer() {
    const server = spawn('node', ['index.js'], {
        stdio: 'inherit',
        env: process.env
    });

    server.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
        console.log('Restarting server...');
        startServer();
    });

    server.on('error', (err) => {
        console.error('Failed to start server:', err);
        console.log('Attempting to restart...');
        startServer();
    });
}

// Handle process-level events
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Continue running
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Continue running
});

console.log('Starting server with auto-restart...');
startServer();