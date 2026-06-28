process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const { execSync } = require('child_process');
const fs = require('fs');

if (!fs.existsSync('.git')) {
  try {
    console.log('[Startup] Initializing Git repository...');
    execSync('git init && git remote add origin https://github.com/Longg249/AllIn-Bot-Discord.git && git fetch origin main && git reset --hard origin/main', { stdio: 'inherit' });
    console.log('[Startup] Git initialized.');
  } catch (e) {
    console.error('[Startup] Git init failed:', e.message);
  }
} else {
  try {
    console.log('[Startup] Syncing with GitHub...');
    execSync('git fetch origin main && git reset --hard origin/main', { stdio: 'inherit' });
    console.log('[Startup] GitHub sync done.');
  } catch (e) {
    console.error('[Startup] GitHub sync failed:', e.message);
  }
}

try {
  require('smee-client');
  require('axios');
} catch (e) {
  console.log('[Startup] Missing dependencies. Installing...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('[Startup] Dependencies installed. Please restart.');
    process.exit(0);
  } catch (err) {
    console.error('[Startup] Failed to install dependencies.');
  }
}

try {
  require('sqlite3');
  console.log('[Startup] SQLite3 OK.');
} catch (e) {
  console.log('[Startup] SQLite3 mismatch. Repairing...');
  try {
    const cmd = process.env.TERMUX_VERSION
      ? 'npm install sqlite3@5.1.7 --build-from-source --no-save'
      : 'npm install sqlite3@5.1.7 --no-save';
    execSync(cmd, { stdio: 'inherit' });
    console.log('[Startup] Repair successful.');
  } catch (err) {
    console.error('[Startup] Repair failed.');
    process.exit(1);
  }
}

const { restartBot, onCleanup, gracefulShutdown } = require('./src/restart');

module.exports = { restartBot };

const { Client, GatewayIntentBits, Events } = require('discord.js');
const {
  getGameState, startGame, stopGame, getUserProfile, getTopPlayers,
  deposit, withdraw, takeLoan, payback, claimReward,
  subscribeNews, unsubscribeNews, getNewsSubscriptions,
  addPoints, getDFItemCount, CURRENCY_NAME, CURRENCY_ICON
} = require('./src/database');

const noituGame = require('./src/games/noitu');
const overUnderGame = require('./src/games/overUnder');
const dataStore = require('./src/data-store');
const ai = require('./src/ai');
const lookup = require('./src/lookup');
const reminders = require('./src/reminders');
const { autoConfigWebhook } = require('./src/github-config');
const { CHANNELS, TURN_TIME_MS } = require('./src/config');
const { pushAll } = require('./webhook-pusher');

require('dotenv').config();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const turnTimers = {};

const clearTimer = (channelId) => {
  if (turnTimers[channelId]) {
    clearTimeout(turnTimers[channelId]);
    delete turnTimers[channelId];
  }
};

const setTimer = (channelId) => {
  clearTimer(channelId);
  turnTimers[channelId] = setTimeout(async () => {
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel) channel.send(`Het thoi gian! Tro choi da ket thuc.`);
      await stopGame(channelId);
    } catch (e) {
      console.error('Timer error:', e.message);
    }
  }, TURN_TIME_MS);
};

const timers = [];

function addTimer(fn, ms) {
  const id = setInterval(fn, ms);
  timers.push(id);
  return id;
}

function addTimeout(fn, ms) {
  const id = setTimeout(fn, ms);
  timers.push(id);
  return id;
}

client.once(Events.ClientReady, async c => {
  const CYAN = '\x1b[38;2;0;255;255m';
  const NEON_GREEN = '\x1b[38;2;57;255;20m';
  const WHITE = '\x1b[37m';
  const RED = '\x1b[31m';
  const NC = '\x1b[0m';
  const NEON_PINK = '\x1b[38;2;255;0;255m';

  const scavengerCount = await getDFItemCount();
  const topPlayersResult = await getTopPlayers(1);
  const { commands } = require('./deploy-commands');

  let publicIp = 'Unknown';
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    publicIp = data.ip;
  } catch (e) {
    publicIp = 'Unavailable';
  }

  const webhookUrl = process.env.SMEE_URL || `http://${publicIp}:${process.env.WEBHOOK_PORT || 3000}/webhook/github`;

  if (webhookUrl && !webhookUrl.includes('Unknown') && !webhookUrl.includes('Unavailable')) {
    autoConfigWebhook(webhookUrl).catch(err => console.error('GitHub auto-config failed:', err.message));
  }

  console.log(`[Startup] Bot online: ${c.user.tag} | IP: ${publicIp} | Commands: ${commands.length}`);

  function displayWebhookStatus() {
    let latest = 0;
    const items = [
      { label: 'News', getter: 'getNews' },
      { label: 'Crypto', getter: 'getCrypto' },
      { label: 'Exchange', getter: 'getExchange' },
      { label: 'Fuel', getter: 'getFuel' },
    ];
    items.forEach(s => {
      const data = dataStore[s.getter]();
      if (data.updatedAt && data.updatedAt.getTime() > latest) {
        latest = data.updatedAt.getTime();
      }
    });
    console.log(`[Webhook] Last update: ${latest > 0 ? new Date(latest).toLocaleString('vi-VN') : 'Never'}`);
  }

  const { deployCommands } = require('./deploy-commands');
  if (typeof deployCommands === 'function') {
    deployCommands().catch(e => console.error('Failed to register slash commands:', e.message));
  }

  await subscribeNews(CHANNELS.NEWS);
  await subscribeNews(CHANNELS.FINANCE_PUSH);

  for (const channelId of CHANNELS.OU_DEDICATED) {
    await startGame(channelId, 'over-under');
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel) {
        const { getBetButtons } = require('./src/games/overUnder');
        await channel.send({
          content: `Keh chuyen dung Tai Xiu da san sang!\n/over <so diem> hoac /under <so diem> de dat cuoc.`,
          components: getBetButtons()
        });
      }
    } catch (e) {
      console.error(`Failed to notify OU channel ${channelId}:`, e.message);
    }
  }

  try {
    const announceChannel = await client.channels.fetch(CHANNELS.ANNOUNCE);
    if (announceChannel) {
      const statusMsg = await announceChannel.send('Bot Online — khoi dong xong');

      addTimer(async () => {
        try {
          const uptime = Math.floor(process.uptime() / 60);
          const hours = Math.floor(uptime / 60);
          const mins = uptime % 60;
          await statusMsg.edit(`Bot Online — ${hours > 0 ? `${hours}h${mins}p` : `${mins}p`}`);
        } catch (e) {
          console.error('Heartbeat failed:', e.message);
        }
      }, 600000);

      let webhookStatusMsg = null;
      addTimer(async () => {
        try {
          const sources = [
            { label: 'Tin tuc', getter: 'getNews' },
            { label: 'Crypto', getter: 'getCrypto' },
            { label: 'Xang dau', getter: 'getFuel' },
            { label: 'Ty gia', getter: 'getExchange' },
          ];
          let msg = 'TRANG THAI WEBHOOK\n';
          for (const s of sources) {
            const data = dataStore[s.getter]();
            const icon = data.updatedAt ? ':white_check_mark:' : ':x:';
            const time = data.updatedAt
              ? `<t:${Math.floor(data.updatedAt.getTime() / 1000)}:R>`
              : 'Chua tung cap nhat';
            msg += `\n${icon} ${s.label}: ${time}`;
          }
          if (!webhookStatusMsg) {
            webhookStatusMsg = await announceChannel.send(msg);
          } else {
            await webhookStatusMsg.edit(msg);
          }
        } catch (e) {
          console.error('Webhook status update failed:', e.message);
        }
      }, 1800000);

      addTimer(() => {
        reminders.checkReminders(client).catch(e => console.error('Reminder check failed:', e.message));
      }, 30000);
    }
  } catch (e) {
    console.error('Failed to announce bot online:', e.message);
  }

  try {
    const bankChannel = await client.channels.fetch(CHANNELS.BANK);
    if (bankChannel) {
      await bankChannel.send(
        `**NGAN HANG ${CURRENCY_NAME}**\n\n` +
        `Cac lenh ngan hang:\n` +
        `/deposit <so tien> hoac !deposit <so tien>: Gui tien vao ngan hang (>=100, boi so 100)\n` +
        `/withdraw <so tien> hoac !withdraw <so tien>: Rut tien tu ngan hang (>=100, boi so 100)\n` +
        `/loan <so tien> hoac !loan <so tien>: Vay tien (100-5,000, moi 1h/lan)\n` +
        `/payback <so tien|all> hoac !payback <so tien|all>: Tra no\n\n` +
        `Cac lenh chi hoat dong trong kenh nay.`
      );
    }
  } catch (e) {
    console.error('Failed to post bank commands:', e.message);
  }

  const startWebhookServer = require('./src/webhook-server');
  const server = startWebhookServer(client);
  onCleanup(() => new Promise(resolve => server.close(resolve)));

  setTimeout(() => {
    console.log('[Startup] Triggering webhook update...');
    pushAll().catch(e => console.error(`Webhook push failed: ${e.message}`))
      .finally(() => displayWebhookStatus());
  }, 2000);

  if (!process.env.SMEE_URL) {
    const { checkForUpdatesAndRestart } = require('./src/polling-update');
    addTimer(checkForUpdatesAndRestart, 15 * 60 * 1000);
    console.log('[System] Polling update: 15 min interval.');
  } else {
    console.log('[System] Starting Smee forwarding...');
    const SmeeClient = require('smee-client');
    const port = process.env.WEBHOOK_PORT || 3000;
    const smee = new SmeeClient({
      source: process.env.SMEE_URL,
      target: `http://127.0.0.1:${port}/webhook/github`,
      logger: { info: () => {}, error: console.error }
    });
    smee.start();
    console.log(`[Smee] Forwarding ${process.env.SMEE_URL} -> 127.0.0.1:${port}`);
  }

  addTimer(() => {
    console.log('[Cron] Hourly data update...');
    pushAll().catch(e => console.error(`Cron update failed: ${e.message}`));
  }, 60 * 60 * 1000);

  addTimeout(() => {
    console.log('[System] 12h limit reached. Restarting...');
    gracefulShutdown();
  }, 12 * 60 * 60 * 1000);
});

const { slashHandler, handleSlotInteraction } = require('./src/slash');

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    await slashHandler(interaction, { turnTimers, clearTimer, setTimer });
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith('over-under_')) {
      const data = interaction.customId.replace('over-under_', '');
      await overUnderGame.handleInteraction(interaction, data);
    } else if (interaction.customId.startsWith('slot_')) {
      const data = interaction.customId.replace('slot_', '');
      await handleSlotInteraction(interaction, data);
    }
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  let content = message.content.trim();
  content = content.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060\u2061\u2062\u2063\u2064]/g, '');
  if (!content) return;

  const args = content.split(/\s+/);
  const command = args[0].toLowerCase();

  if (command === '!help' || command === '!h' || command === '!trogiup') {
    const helpMsg =
      `**DANH SACH LENH CUA BOT**\n\n` +
      `**Tro Choi:**\n` +
      `/noitu: Noi Tu.\n` +
      `/taixiu: Tai Xiu.\n` +
      `/slot <cuoc>: Quay Slot Machine.\n` +
      `/stop: Dung tro choi.\n\n` +
      `**Kinh Te & Ca Nhan:**\n` +
      `/reward: Nhan qua mien phi moi 4 gio.\n` +
      `/profile: Xem ho so ca nhan.\n` +
      `/leaderboard: Bang xep hang.\n` +
      `/deposit: Gui tien ngan hang.\n` +
      `/withdraw: Rut tien ngan hang.\n` +
      `/loan: Vay tien.\n` +
      `/payback: Tra no.\n\n` +
      `**Tro Ly Ao & Tien Ich:**\n` +
      `/ask: Hoi tro ly AI.\n` +
      `/remind: Dat nhac nho.\n` +
      `/search: Tim kiem web.\n\n` +
      `**Lum Rac Delta Force:**\n` +
      `/scavenge start: Vao map lum rac.\n` +
      `/storage view: Xem kho do.\n\n` +
      `**Cau Ca:**\n` +
      `/fishing cast <spot>: Tha cau.\n` +
      `/fishing inventory: Xem gio ca.\n` +
      `/fishing sell: Ban ca.\n` +
      `/fishing stats: Thong tin cau ca.\n` +
      `/fishing shop: Cua hang dung cu.\n` +
      `/fishing buyrod: Mua can cau.\n` +
      `/fishing buybait: Mua moi cau.\n\n` +
      `Dung lenh gach cheo (/) de co goi y tu dong!`;
    message.reply(helpMsg);
    return;
  }

  const state = await getGameState(message.channel.id);

  if (!state || !state.is_active) return;

  if (state.game_type === 'over-under') {
    if (command === '!over' || command === '!under') {
      if (!CHANNELS.OU_DEDICATED.includes(message.channel.id)) {
        message.reply('Lenh Tai Xiu chi su dung duoc trong kenh chuyen dung.');
        return;
      }
      await overUnderGame.handleMessage(message, state, command, args);
    }
  } else if (state.game_type === 'noitu') {
    if (content.startsWith('!')) return;
    await noituGame.handleMessage(message, state, { content, clearTimer, setTimer });
  }
});

client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('Failed to login:', err.message);
});
