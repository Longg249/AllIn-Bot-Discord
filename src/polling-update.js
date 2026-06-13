const { execSync } = require('child_process');
const { restartBot } = require('./restart');
const { logUpdate } = require('./logger');

/**
 * Kiểm tra cập nhật và khởi động lại nếu có
 */
function checkForUpdatesAndRestart() {
  logUpdate('🔄 [Polling] Kiểm tra cập nhật mới...');
  try {
    // 1. Fetch từ remote
    execSync('git fetch origin main', { stdio: 'ignore' });
    
    // 2. So sánh local với remote
    const local = execSync('git rev-parse HEAD').toString().trim();
    const remote = execSync('git rev-parse origin/main').toString().trim();

    if (local !== remote) {
      logUpdate('✨ [Polling] Phát hiện cập nhật mới! Đang tiến hành update...');
      
      // 3. Update
      execSync('git pull origin main', { stdio: 'inherit' });
      
      // 4. Restart
      logUpdate('✅ [Polling] Cập nhật thành công. Khởi động lại bot sau 5 giây...');
      setTimeout(() => restartBot(), 5000);
    } else {
      logUpdate('✅ [Polling] Bot đã ở phiên bản mới nhất.');
    }
  } catch (e) {
    logUpdate('❌ [Polling] Lỗi khi kiểm tra cập nhật: ' + e.message);
  }
}

module.exports = { checkForUpdatesAndRestart };
