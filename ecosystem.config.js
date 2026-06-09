module.exports = {
  apps: [
    {
      name: 'bot-allin',
      script: 'index.js',
      autorestart: true,
      max_memory_restart: '150M',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'bot-pusher',
      script: 'webhook-pusher.js',
      autorestart: true,
      max_memory_restart: '100M',
      env: { 
        NODE_ENV: 'production',
        WEBHOOK_URL: 'http://localhost:3001'
      }
    }
  ]
};
