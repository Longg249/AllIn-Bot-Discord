const axios = require('axios');
const axiosRetry = require('axios-retry');
const Parser = require('rss-parser');

const parser = new Parser();
axiosRetry.default(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const WEBHOOK_BASE = process.env.WEBHOOK_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'noitu-webhook-secret';
const NEWS_CHANNEL = '1513064877231702016';
const FINANCE_CHANNEL = '1513083153374249021';

function authHeader() {
  return { Authorization: 'Bearer ' + WEBHOOK_SECRET };
}

// ─── Tin tức ───
const NEWS_SOURCES = [
  { name: 'VnExpress', url: 'https://vnexpress.net/rss/tin-moi-nhat.rss' },
  { name: 'Tuổi Trẻ', url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss' },
  { name: 'Thanh Niên', url: 'https://thanhnien.vn/rss/home.rss' },
  { name: 'Tiền Phong', url: 'https://tienphong.vn/rss/home.rss' },
  { name: 'Dân Trí', url: 'https://dantri.com.vn/rss/tin-moi-nhat.rss' },
  { name: 'Công Nghệ (VnExpress)', url: 'https://vnexpress.net/rss/so-hoa.rss' },
  { name: 'Công Nghệ (Tuổi Trẻ)', url: 'https://tuoitre.vn/rss/nhip-song-so.rss' },
  { name: 'Thể Thao (VnExpress)', url: 'https://vnexpress.net/rss/the-thao.rss' },
  { name: 'Thể Thao (Tuổi Trẻ)', url: 'https://tuoitre.vn/rss/the-thao.rss' },
  { name: 'Quốc Tế (VnExpress)', url: 'https://vnexpress.net/rss/the-gioi.rss' },
  { name: 'Quốc Tế (Tuổi Trẻ)', url: 'https://tuoitre.vn/rss/the-gioi.rss' },
];

async function fetchNews() {
  const results = await Promise.all(NEWS_SOURCES.map(async (source) => {
    try {
      const feed = await parser.parseURL(source.url);
      return feed.items.slice(0, 2).map(item => ({
        title: item.title,
        link: item.link,
        source: source.name
      }));
    } catch (e) {
      console.error('❌ RSS Error ' + source.name + ': ' + e.message);
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
    return '💸 **TỶ GIÁ NGOẠI TỆ (1 USD)**\n---\n' +
           '🇻🇳 VND: `' + r.VND.toLocaleString() + 'đ`\n' +
           '🇪🇺 EUR: `' + r.EUR + '`\n' +
           '🇯🇵 JPY: `' + r.JPY + '`\n' +
           '🇬🇧 GBP: `' + r.GBP + '`\n---\n' +
           '*Cập nhật: ' + res.data.date + '*';
  } catch (e) {
    console.error('Exchange error:', e.message);
    return null;
  }
}

// ─── Crypto ───
async function fetchCrypto() {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple&vs_currencies=usd', { timeout: 8000 });
    const d = res.data;
    return '🪙 **GIÁ CRYPTO TRỰC TUYẾN**\n---\n' +
           '₿ Bitcoin (BTC): `$' + d.bitcoin.usd.toLocaleString() + '`\n' +
           '💎 Ethereum (ETH): `$' + d.ethereum.usd.toLocaleString() + '`\n' +
           '🔶 Binance (BNB): `$' + d.binancecoin.usd.toLocaleString() + '`\n' +
           '☀️ Solana (SOL): `$' + d.solana.usd.toLocaleString() + '`\n' +
           '💧 Ripple (XRP): `$' + d.ripple.usd.toLocaleString() + '`\n---';
  } catch (e) {
    console.error('Crypto error:', e.message);
    return null;
  }
}

// ─── Xăng dầu ───
async function fetchFuel() {
  try {
    const res = await axios.get('https://api.vapi.vn/gia-xang-dau', { timeout: 8000 });
    const data = res.data;
    if (data && data.length > 0) {
      let msg = '⛽ **GIÁ XĂNG DẦU HÔM NAY (Petrolimex)**\n---\n';
      data.forEach(item => { msg += '🔹 ' + item.name + ': `' + item.price.toLocaleString() + 'đ`\n'; });
      return msg + '---';
    }
  } catch (e) {
    console.error('Fuel error:', e.message);
  }
  return '⛽ **GIÁ XĂNG DẦU (Ước tính)**\n---\n🔹 Xăng RON 95-III: `~20.500đ`\n🔹 Xăng E5 RON 92: `~19.400đ`\n🔹 Dầu Diesel: `~18.600đ`\n---\n*Vui lòng kiểm tra lại tại Petrolimex.com.vn*';
}

// ─── Push webhook ───
async function push(endpoint, body) {
  try {
    const res = await axios.post(WEBHOOK_BASE + endpoint, body, { headers: authHeader(), timeout: 10000 });
    console.log('✅ ' + endpoint + ' → ' + (res.data.ok ? 'OK' : 'FAIL'));
  } catch (e) {
    console.error('❌ ' + endpoint + ': ' + e.message);
  }
}

async function pushAll() {
  console.log('\n🔄 Push cycle — ' + new Date().toLocaleString('vi-VN'));

  // News - Chuyển sang dạng văn bản ngắn gọn
  const news = await fetchNews();
  if (news.length > 0) {
    const textNews = news.map(item => '• [' + item.title + '](' + item.link + ')').join('\n');
    await push('/webhook/news', { channel: NEWS_CHANNEL, content: '📰 **TIN TỨC MỚI**\n' + textNews });
  }

  // Finance (combined)
  const [exchange, crypto, fuel] = await Promise.all([
    fetchExchangeRate().catch(e => { console.error('Exchange error:', e.message); return null; }),
    fetchCrypto().catch(e => { console.error('Crypto error:', e.message); return null; }),
    fetchFuel().catch(e => { console.error('Fuel error:', e.message); return null; }),
  ]);

  if (exchange) await push('/webhook/tygia', { content: exchange });
  if (crypto)   await push('/webhook/crypto', { content: crypto });
  if (fuel)     await push('/webhook/xang',   { content: fuel });

  if (exchange || crypto || fuel) {
    const combined = [exchange, crypto, fuel].filter(Boolean).join('\n\n') + '\n\n*Cập nhật tự động mỗi giờ*';
    await push('/webhook/finance', { channel: FINANCE_CHANNEL, content: combined });
  }
}

// ─── Run ───
const interval = parseInt(process.env.PUSH_INTERVAL || '7200000');
const runOnce = process.argv.includes('--once');

// Thêm trình xử lý lỗi toàn cục
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

try {
  if (runOnce) {
    pushAll().then(() => process.exit(0));
  } else {
    console.log('🕐 Pusher started — pushing every ' + (interval / 60000) + ' minutes');
    
    const safePushAll = async () => {
      try {
        await pushAll();
      } catch (e) {
        console.error('🚨 Fatal error in push cycle: ' + e.message);
      }
    };

    // Đợi 10 giây trước khi chạy lần đầu để ổn định
    setTimeout(safePushAll, 10000);
    setInterval(safePushAll, interval);
  }
} catch (err) {
  console.error('🚨 Global error in webhook-pusher:', err.message);
}
