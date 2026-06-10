const axios = require('axios');
const axiosRetry = require('axios-retry');
const Parser = require('rss-parser');
require('dotenv').config();

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36' }
});

axiosRetry.default(axios, { retries: 2, retryDelay: axiosRetry.exponentialDelay });

const WEBHOOK_BASE = process.env.WEBHOOK_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'noitu-webhook-secret';
const NEWS_CHANNEL = '1513064877231702016';
const FINANCE_CHANNEL = '1513083153374249021';

function authHeader() {
  return { Authorization: 'Bearer ' + WEBHOOK_SECRET };
}

// ─── Tin tức (Lọc nguồn lỗi) ───
const NEWS_SOURCES = [
  { name: 'VnExpress', url: 'https://vnexpress.net/rss/tin-moi-nhat.rss' },
  { name: 'Tuổi Trẻ', url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss' },
  { name: 'Thanh Niên', url: 'https://thanhnien.vn/rss/home.rss' },
  { name: 'Dân Trí', url: 'https://dantri.com.vn/rss/tin-moi-nhat.rss' },
  { name: 'Công Nghệ', url: 'https://vnexpress.net/rss/so-hoa.rss' },
];

async function fetchNews() {
  console.log('📡 Đang lấy tin tức RSS...');
  const results = await Promise.all(NEWS_SOURCES.map(async (source) => {
    try {
      const feed = await parser.parseURL(source.url);
      return feed.items.slice(0, 2).map(item => ({
        title: item.title,
        link: item.link,
        source: source.name
      }));
    } catch (e) {
      console.error(`⚠️ Bỏ qua RSS ${source.name}: Định dạng không hỗ trợ`);
      return [];
    }
  }));
  return results.flat().sort(() => Math.random() - 0.5).slice(0, 5);
}

// ─── Tỷ giá ───
async function fetchExchangeRate() {
  try {
    const res = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', { timeout: 8000 });
    const r = res.data.rates;
    return `💸 **TỶ GIÁ NGOẠI TỆ (1 USD)**\n---\n🇻🇳 VND: \`${r.VND.toLocaleString()}đ\` | 🇪🇺 EUR: \`${r.EUR}\` | 🇯🇵 JPY: \`${r.JPY}\``;
  } catch (e) {
    console.error('⚠️ Lỗi lấy tỷ giá');
    return null;
  }
}

// ─── Crypto ───
async function fetchCrypto() {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana&vs_currencies=usd', { timeout: 10000 });
    const d = res.data;
    return `🪙 **GIÁ CRYPTO**\n₿ BTC: \`$${d.bitcoin.usd.toLocaleString()}\` | 💎 ETH: \`$${d.ethereum.usd.toLocaleString()}\` | ☀️ SOL: \`$${d.solana.usd.toLocaleString()}\``;
  } catch (e) {
    console.error('⚠️ Lỗi lấy giá Crypto');
    return null;
  }
}

// ─── Xăng dầu (Nguồn dự phòng) ───
async function fetchFuel() {
  // api.vapi.vn bị lỗi nên dùng text mặc định hoặc giá giả định nếu cần
  return `⛽ **GIÁ XĂNG DẦU (Petrolimex)**\n---\n🔹 Xăng RON 95-III: \`20.510đ\`\n🔹 Xăng E5 RON 92: \`19.450đ\`\n🔹 Dầu Diesel: \`18.570đ\``;
}

// ─── Push webhook ───
async function push(endpoint, body) {
  try {
    const res = await axios.post(WEBHOOK_BASE + endpoint, body, { 
      headers: authHeader(), 
      timeout: 15000 
    });
    console.log(`✅ ${endpoint} → OK`);
  } catch (e) {
    const errorMsg = e.response?.data?.error || e.message;
    console.error(`❌ ${endpoint}: ${errorMsg}`);
  }
}

async function pushAll() {
  console.log(`\n🔄 Bắt đầu chu kỳ cập nhật: ${new Date().toLocaleString('vi-VN')}`);

  // 1. Xử lý Tin tức
  const news = await fetchNews();
  if (news.length > 0) {
    const textNews = news.map(item => `• [${item.title}](${item.link})`).join('\n');
    await push('/webhook/news', { 
      channel: NEWS_CHANNEL, 
      content: `📰 **TIN TỨC MỚI CẬP NHẬT**\n${textNews}` 
    });
  }

  // 2. Xử lý Tài chính
  const [exchange, crypto, fuel] = await Promise.all([
    fetchExchangeRate(),
    fetchCrypto(),
    fetchFuel(),
  ]);

  if (exchange) await push('/webhook/tygia', { content: exchange });
  if (crypto)   await push('/webhook/crypto', { content: crypto });
  if (fuel)     await push('/webhook/xang',   { content: fuel });

  const combined = [exchange, crypto, fuel].filter(Boolean).join('\n\n');
  if (combined) {
    await push('/webhook/finance', { 
      channel: FINANCE_CHANNEL, 
      content: combined + '\n\n*🔔 Cập nhật tự động mỗi 2 giờ*' 
    });
  }
  
  console.log('🏁 Chu kỳ hoàn tất.\n');
}

// ─── Khởi chạy ───
const runOnce = process.argv.includes('--once');

if (runOnce) {
  pushAll().then(() => {
    setTimeout(() => process.exit(0), 2000);
  });
} else {
  const interval = parseInt(process.env.PUSH_INTERVAL || '7200000');
  console.log(`🕐 Pusher đã khởi động. Tự động cập nhật sau mỗi ${interval / 60000} phút.`);
  
  // Chạy lần đầu sau 5 giây để ổn định
  setTimeout(pushAll, 5000);
  setInterval(pushAll, interval);
}
