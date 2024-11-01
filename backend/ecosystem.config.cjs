module.exports = {
    apps: [{
      name: 'arlink-api',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      
      // Only set max_memory_restart as overall limit
      max_memory_restart: '5G',
      // Removed --max-old-space-size to not restrict child processes
      
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
      time: true,
      ignore_watch: [
        'node_modules',
        'builds',
        'buildRegistry.json',
        '*.log',
        'tmp',
        'Wallet.json'
      ]
    }]
  };