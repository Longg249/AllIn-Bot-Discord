const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const stream = fs.createWriteStream(path.join(logDir, 'bot-updates.log'), { flags: 'a' });

function logUpdate(message) {
  const timestamp = new Date().toLocaleString('vi-VN');
  stream.write(`[${timestamp}] ${message}\n`);
  console.log(message);
}

module.exports = { logUpdate };
