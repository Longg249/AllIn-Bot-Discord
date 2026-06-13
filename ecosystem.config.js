module.exports = {
  apps: [
    {
      name: 'bot-allin',
      script: 'index.js',
      autorestart: true,
      // Đã có auto-restart logic trong index.js, PM2 sẽ tự động chạy lại khi process.exit(0)
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production' }
    }
  ]
};
