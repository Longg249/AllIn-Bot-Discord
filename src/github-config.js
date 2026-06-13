const axios = require('axios');

/**
 * Tự động cập nhật Webhook trên GitHub khi IP thay đổi
 * @param {string} publicIp IP công khai mới của Bot
 */
async function autoConfigWebhook(publicIp) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'Longg249/AllIn-Bot-Discord';
  const port = process.env.WEBHOOK_PORT || 3000;
  const newUrl = `http://${publicIp}:${port}/webhook/github`;

  if (!token) {
    console.log('ℹ️ [GitHub] GITHUB_TOKEN không tồn tại. Bỏ qua tự động cấu hình Webhook.');
    return;
  }

  console.log(`🔄 [GitHub] Đang kiểm tra cấu hình Webhook cho ${repo}...`);

  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  try {
    // 1. Lấy danh sách Webhooks hiện có
    const { data: hooks } = await axios.get(`https://api.github.com/repos/${repo}/hooks`, { headers });

    // 2. Tìm Webhook của bot (dựa trên đường dẫn /webhook/github)
    const botHook = hooks.find(h => h.config.url.includes('/webhook/github'));

    if (botHook) {
      // 3. Nếu tìm thấy, kiểm tra xem URL có khác không
      if (botHook.config.url !== newUrl) {
        console.log(`🌐 [GitHub] IP thay đổi! Cập nhật Webhook: ${botHook.config.url} -> ${newUrl}`);
        
        await axios.patch(`https://api.github.com/repos/${repo}/hooks/${botHook.id}`, {
          config: {
            ...botHook.config,
            url: newUrl,
            content_type: 'json'
          }
        }, { headers });

        console.log('✅ [GitHub] Cập nhật Webhook thành công!');
      } else {
        console.log('✅ [GitHub] Webhook đã đúng địa chỉ IP. Không cần cập nhật.');
      }
    } else {
      // 4. Nếu không tìm thấy, tạo mới (tùy chọn)
      console.log('➕ [GitHub] Không tìm thấy Webhook phù hợp. Đang tạo mới...');
      await axios.post(`https://api.github.com/repos/${repo}/hooks`, {
        name: 'web',
        active: true,
        events: ['push'],
        config: {
          url: newUrl,
          content_type: 'json',
          insecure_ssl: '1'
        }
      }, { headers });
      console.log('✅ [GitHub] Đã tạo Webhook mới thành công!');
    }
  } catch (error) {
    console.error('❌ [GitHub] Lỗi tự động cấu hình Webhook:', error.response?.data?.message || error.message);
  }
}

module.exports = { autoConfigWebhook };
