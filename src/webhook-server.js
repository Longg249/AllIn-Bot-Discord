const http = require('http');
const dataStore = require('./data-store');

module.exports = (client) => {
  const PORT = process.env.WEBHOOK_PORT || 3000;
  const SECRET = process.env.WEBHOOK_SECRET;

  if (!SECRET) {
    console.warn('⚠️ WEBHOOK_SECRET chưa được cấu hình trong .env');
  }

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const path = req.url.split('?')[0];

    // Health check — no auth needed
    if (req.method === 'GET' && path === '/health') {
      const sources = ['crypto', 'exchange', 'fuel', 'news'];
      const status = {};
      for (const key of sources) {
        const data = dataStore[`get${key.charAt(0).toUpperCase() + key.slice(1)}`]();
        status[key] = {
          updatedAt: data.updatedAt ? data.updatedAt.toISOString() : null,
          alive: data.updatedAt ? true : false,
        };
      }
      status.server = { uptime: process.uptime() };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Only POST allowed' }));
      return;
    }

    const auth = (req.headers['authorization'] || '').trim();
    if (SECRET) {
      const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : auth;
      if (token !== SECRET) {
        console.warn(`⚠️ Webhook auth failed: received "${token}", expected "${SECRET}"`);
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const path = req.url.split('?')[0];

        switch (path) {
          case '/webhook/news':
            await handleNewsWebhook(client, data, res);
            break;
          case '/webhook/finance':
            await handleFinanceWebhook(client, data, res);
            break;
          case '/webhook/crypto':
            await handleCryptoWebhook(data, res);
            break;
          case '/webhook/xang':
            await handleFuelWebhook(data, res);
            break;
          case '/webhook/tygia':
            await handleExchangeWebhook(data, res);
            break;
          case '/webhook/gold':
            await handleGoldWebhook(client, data, res);
            break;
          default:
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Unknown webhook path' }));
        }
      } catch (err) {
        console.error('Webhook error:', err.message);
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`🌐 Webhook server listening on port ${PORT}`);
  });
};

async function sendToChannel(client, channelId, content) {
  const channel = await client.channels.fetch(channelId);
  if (!channel) throw new Error(`Channel ${channelId} not found`);
  return channel.send(content);
}

async function handleNewsWebhook(client, data, res) {
  const { channel, items, content } = data;
  let msg = '';
  
  if (items && Array.isArray(items) && items.length > 0) {
    // Format array items
    dataStore.setNews(items);
    msg = '📰 **TIN TỨC MỚI NHẤT**\n\n';
    items.forEach((item, i) => {
      msg += `${i + 1}. [${item.title}](${item.link})`;
      if (item.source) msg += ` - *${item.source}*`;
      msg += '\n';
    });
  } else if (content) {
    // Handle plain text content from pusher
    msg = content;
    // Mock items for store to show 'alive' status
    dataStore.setNews([{ title: 'Cập nhật tin tức', link: '#' }]);
  } else {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Need items[] or content string' }));
    return;
  }

  try {
    if (channel) {
      await sendToChannel(client, channel, msg);
    } else {
      const { getNewsSubscriptions } = require('./database');
      const subs = await getNewsSubscriptions();
      for (const sub of subs) {
        try {
          await sendToChannel(client, sub.channel_id, msg);
        } catch (e) {
          console.error(`News webhook: failed to send to ${sub.channel_id}:`, e.message);
        }
      }
    }
    console.log('📰 News webhook processed');
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('News webhook error:', err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function handleFinanceWebhook(client, data, res) {
  const { channel, content } = data;
  if (!content) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Need content' }));
    return;
  }

  try {
    const target = channel || process.env.FINANCE_CHANNEL || '1513083153374249021';
    await sendToChannel(client, target, content);
    console.log('📊 Finance webhook processed');
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('Finance webhook error:', err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function handleCryptoWebhook(data, res) {
  const { content } = data;
  if (!content) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Need content' }));
    return;
  }
  dataStore.setCrypto(content);
  console.log('🪙 Crypto data updated via webhook');
  res.writeHead(200);
  res.end(JSON.stringify({ ok: true }));
}

async function handleFuelWebhook(data, res) {
  const { content } = data;
  if (!content) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Need content' }));
    return;
  }
  dataStore.setFuel(content);
  console.log('⛽ Fuel price data updated via webhook');
  res.writeHead(200);
  res.end(JSON.stringify({ ok: true }));
}

async function handleExchangeWebhook(data, res) {
  const { content } = data;
  if (!content) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Need content' }));
    return;
  }
  dataStore.setExchange(content);
  console.log('💸 Exchange rate data updated via webhook');
  res.writeHead(200);
  res.end(JSON.stringify({ ok: true }));
}

async function handleGoldWebhook(client, data, res) {
  const { content, channel } = data;
  if (!content) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Need content' }));
    return;
  }

  dataStore.setGold(content);

  try {
    const target = channel || process.env.GOLD_CHANNEL || '1513083153374249021';
    await sendToChannel(client, target, content);
    console.log('🥇 Gold webhook processed');
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('Gold webhook error:', err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
}
