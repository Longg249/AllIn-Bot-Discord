module.exports = {
  apps: [
    {
      name: 'bot-allin',
      script: 'index.js',
      autorestart: true,
      cron_restart: '0 */12 * * *',
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'bot-pusher',
      script: 'webhook-pusher.js',
      autorestart: true,
      max_memory_restart: '256M',
      env: { 
        NODE_ENV: 'production',
        WEBHOOK_URL: 'http://localhost:3000'
      }
    }
  ]
};
