const http = require('http');
const dataStore = require('./data-store');
const githubNotifier = require('./github-notifier');
const { CHANNELS } = require('./config');

const MAX_BODY_SIZE = 1024 * 1024;

module.exports = (client) => {
  const PORT = process.env.WEBHOOK_PORT || 3000;
  const SECRET = process.env.WEBHOOK_SECRET;

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-GitHub-Event');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const path = req.url.split('?')[0];

    if (req.method === 'GET' && path === '/health') {
      const sources = ['crypto', 'exchange', 'fuel', 'news'];
      const status = {};
      for (const key of sources) {
        const getter = `get${key.charAt(0).toUpperCase() + key.slice(1)}`;
        const data = dataStore[getter]();
        status[key] = {
          updatedAt: data.updatedAt ? data.updatedAt.toISOString() : null,
          alive: !!data.updatedAt,
        };
      }
      status.server = { uptime: process.uptime() };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status));
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Only POST allowed' }));
      return;
    }

    const isGithub = path === '/webhook/github';

    if (!isGithub && SECRET) {
      const auth = (req.headers['authorization'] || '').trim();
      const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : auth;
      if (token !== SECRET) {
        console.warn('Webhook auth failed: token mismatch');
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
    }

    let body = '';
    let bodySize = 0;
    req.on('data', chunk => {
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_SIZE) {
        res.writeHead(413);
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', async () => {
      if (res.headersSent) return;
      try {
        const data = JSON.parse(body);
        const handlers = {
          '/webhook/github': () => handleGithub(req, client, data),
          '/webhook/news': () => handleNewsWebhook(client, data),
          '/webhook/finance': () => handleFinanceWebhook(client, data),
          '/webhook/crypto': () => handleCryptoWebhook(data),
          '/webhook/xang': () => handleFuelWebhook(data),
          '/webhook/tygia': () => handleExchangeWebhook(data),
          '/webhook/gold': () => handleGoldWebhook(client, data),
        };
        const handler = handlers[path];
        if (handler) {
          const result = await handler();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Unknown webhook path' }));
        }
      } catch (err) {
        console.error('Webhook error:', err);
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`Webhook server listening on port ${PORT}`);
  });

  return server;
};

async function handleGithub(req, client, data) {
  const githubEvent = req.headers['x-github-event'];
  if (githubEvent === 'push') {
    const targetChannel = process.env.GITHUB_CHANNEL || CHANNELS.ANNOUNCE;
    await githubNotifier.handleGithubPush(client, data, targetChannel);
  }
  return { ok: true };
}

async function sendToChannel(client, channelId, content) {
  const channel = await client.channels.fetch(channelId);
  if (!channel) throw new Error(`Channel ${channelId} not found`);
  return channel.send(content);
}

async function handleNewsWebhook(client, data) {
  const { channel, items, content } = data;
  let msg = '';

  if (items && Array.isArray(items) && items.length > 0) {
    dataStore.setNews(items);
    msg = '**TIN TUC MOI NHAT**\n\n';
    items.forEach((item, i) => {
      msg += `${i + 1}. [${item.title}](${item.link})`;
      if (item.source) msg += ` - *${item.source}*`;
      msg += '\n';
    });
  } else if (content) {
    msg = content;
    dataStore.setNews([{ title: 'Cap nhat tin tuc', link: '#' }]);
  } else {
    throw new Error('Need items[] or content string');
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
          console.error(`News webhook: failed to send to ${sub.channel_id}:`, e);
        }
      }
    }
  } catch (err) {
    console.error('News webhook error:', err);
    throw err;
  }
}

async function handleFinanceWebhook(client, data) {
  const { channel, content } = data;
  if (!content) throw new Error('Need content');
  const target = channel || process.env.FINANCE_CHANNEL || CHANNELS.FINANCE_PUSH;
  await sendToChannel(client, target, content);
}

async function handleCryptoWebhook(data) {
  const { content } = data;
  if (!content) throw new Error('Need content');
  dataStore.setCrypto(content);
}

async function handleFuelWebhook(data) {
  const { content } = data;
  if (!content) throw new Error('Need content');
  dataStore.setFuel(content);
}

async function handleExchangeWebhook(data) {
  const { content } = data;
  if (!content) throw new Error('Need content');
  dataStore.setExchange(content);
}

async function handleGoldWebhook(client, data) {
  const { content, channel } = data;
  if (!content) throw new Error('Need content');
  dataStore.setGold(content);
  const target = channel || process.env.GOLD_CHANNEL || CHANNELS.FINANCE_PUSH;
  await sendToChannel(client, target, content);
}
