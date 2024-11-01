module.exports = {
  apps: [{
    name: 'arlink-api',
    script: 'index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: true,                  // Enable watch mode for auto-reload
    watch_delay: 1000,           // Delay between restarts
    watch_options: {             // Configure what to watch
      followSymlinks: false,
      usePolling: true          // Better for some systems/VPS
    },
    ignore_watch: [             // Don't watch these
      'node_modules',
      'builds',
      'buildRegistry.json',
      'logs',
      '*.log',
      'tmp',
      'Wallet.json'
    ],
    node_args: '--experimental-specifier-resolution=node',
    interpreter: 'node',
    
    // Memory settings
    max_memory_restart: '5G',
    
    // Restart Behavior
    autorestart: true,
    max_restarts: 1000000,
    min_uptime: "30s",
    restart_delay: 1000,
    exp_backoff_restart_delay: 100,
    
    // Graceful Shutdown
    kill_timeout: 10000,
    force_kill: false,
    wait_ready: true,
    listen_timeout: 30000,
    
    env: {
      NODE_ENV: 'production',
      PORT: 3050
    },
    error_file: 'logs/api-error.log',
    out_file: 'logs/api-out.log',
    time: true
  }]
};