const { spawn } = require('child_process');

const bot = spawn('node', ['index.js'], { stdio: 'inherit', shell: true });
const pusher = spawn('node', ['webhook-pusher.js'], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  bot.kill();
  pusher.kill();
  process.exit();
});
