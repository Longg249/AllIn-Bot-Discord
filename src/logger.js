const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const logFile = path.join(logDir, 'bot-updates.log');

/**
 * Ghi log vào file bot-updates.log
 * @param {string} message 
 */
function logUpdate(message) {
  const timestamp = new Date().toLocaleString('vi-VN');
  const entry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, entry);
  console.log(message);
}

module.exports = { logUpdate };
