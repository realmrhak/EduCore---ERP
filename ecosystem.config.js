module.exports = {
  apps: [
    {
      name: 'educore-api',
      script: 'backend/server.js',
      instances: 'max',          // Cluster mode — use all CPU cores
      exec_mode: 'cluster',
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
