const axios = require('axios');

async function checkHealth() {
  console.log(`🔍 [${new Date().toLocaleString('vi-VN')}] Kiểm tra sức khỏe Webhook...`);
  try {
    const res = await axios.get('http://localhost:3001/health', { timeout: 10000 });
    const health = res.data;
    let allOk = true;

    for (const [key, value] of Object.entries(health)) {
      if (key !== 'server' && !value.alive) {
        console.error(`❌ Webhook ${key.toUpperCase()} bị lỗi!`);
        allOk = false;
      }
    }

    if (allOk) {
      console.log('✅ Tất cả webhook đều hoạt động bình thường.');
    } else {
      console.warn('⚠️ Phát hiện webhook lỗi. Đang chờ chu kỳ kiểm tra tiếp theo...');
      // Tại đây có thể thêm logic gửi thông báo hoặc tự động restart nếu lỗi kéo dài
    }
  } catch (e) {
    console.error(`🚨 Không thể kết nối tới Health Check API: ${e.message}`);
  }
}

checkHealth();
setInterval(checkHealth, 300000); // Kiểm tra mỗi 5 phút
