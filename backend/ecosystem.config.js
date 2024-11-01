module.exports = {
    apps: [{
      // Main API Server
      name: 'arlink-api',
      script: 'index.js',
      instances: 1,  // Single instance to prevent filesystem race conditions
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '5G', // Almost all available RAM
      env: {
        NODE_ENV: 'production',
        PORT: 3050
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3050
      },
      // Error logs with timestamp
      error_file: 'logs/api-error.log',
      out_file: 'logs/api-out.log',
      time: true,
      // Graceful shutdown and restart
      kill_timeout: 5000,
      restart_delay: 4000,
      max_restarts: 10,
      // Ignore files/folders from triggering restart
      ignore_watch: [
        'node_modules',
        'builds',
        'buildRegistry.json',
        '*.log',
        'tmp',
        'Wallet.json'
      ]
    }, {
      // Build Job Scheduler
      name: 'build-scheduler',
      script: 'scheduleBuildJobs.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '5G', // Allow maximum RAM usage if needed
      env: {
        NODE_ENV: 'production'
      },
      error_file: 'logs/scheduler-error.log',
      out_file: 'logs/scheduler-out.log',
      time: true,
      exp_backoff_restart_delay: 100
    }]
  };