// --- Startup: Git Repair, Auto Update & Environment Check ---
const { execSync } = require('child_process');
const fs = require('fs');

// 1. Auto-repair Git if .git folder is missing
if (!fs.existsSync('.git')) {
  try {
    console.log('🔧 [System] Initializing Git repository...');
    execSync('git init && git remote add origin https://github.com/Longg249/AllIn-Bot-Discord.git && git fetch origin main && git reset --hard origin/main', { stdio: 'inherit' });
    console.log('✅ [System] Git initialized successfully.');
  } catch (e) {
    console.error('❌ [System] Git initialization failed:', e.message);
  }
} else {
  // 2. If Git exists, pull for updates
  try {
    console.log('🔄 [System] Checking for updates...');
    execSync('git pull origin main', { stdio: 'inherit' });
  } catch (e) {
    console.error('⚠️ [System] Auto-update skipped (check git connectivity).');
  }
}

// 3. Check for sqlite3 compatibility
try {
  require('sqlite3');
  console.log('✅ [System] SQLite3 is compatible.');
} catch (e) {
  console.log('⚠️ [System] SQLite3 mismatch detected. Repairing...');
  try {
    const cmd = process.env.TERMUX_VERSION 
      ? 'npm install sqlite3@5.1.7 --build-from-source --no-save'
      : 'npm install sqlite3@5.1.7 --no-save';
    execSync(cmd, { stdio: 'inherit' });
    console.log('✅ [System] Repair successful!');
  } catch (err) {
    console.error('❌ [System] Repair failed.');
    if (process.env.TERMUX_VERSION) {
      console.error('👉 Vui lòng chạy lệnh này trong Termux: pkg install -y build-essential binutils python clang make');

    } else {
      console.error('👉 Please install build tools (build-essential, python, etc.)');
    }
    process.exit(1);
  }
}
// -----------------------------------------------------------

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

require('dotenv').config();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const turnTimers = {};
const TURN_TIME_MS = 15000;

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
      if (channel) channel.send(`⏰ Hết thời gian! Trò chơi đã kết thúc.`);
      await stopGame(channelId);
    } catch (e) {
      console.error('Timer error:', e.message);
    }
  }, TURN_TIME_MS);
};

client.once(Events.ClientReady, async c => {
  // --- Terminal Monitor Integration ---
  const NEON_PINK = '\x1b[38;2;255;0;255m';
  const CYAN = '\x1b[38;2;0;255;255m';
  const NEON_GREEN = '\x1b[38;2;57;255;20m';
  const WHITE = '\x1b[37m';
  const NC = '\x1b[0m';

  const scavengerCount = await getDFItemCount();
  const topPlayersResult = await getTopPlayers(1);
  const { commands } = require('./deploy-commands');

  // --- Get Public IP for Webhook Guidance ---
  let publicIp = 'Unknown';
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    publicIp = data.ip;
  } catch (e) {
    publicIp = 'Check your connection';
  }
  const webhookUrl = `http://${publicIp}:${process.env.WEBHOOK_PORT || 3000}/webhook/github`;

  // console.clear();
  console.log(`${NEON_PINK}╔════════════════════════════════════════════════════════════╗${NC}`);
  console.log(`${NEON_PINK}║${NC}        ${CYAN}🚀 ALLIN BOT SERVER - STARTUP SUCCESSFUL          ${NEON_PINK}║${NC}`);
  console.log(`${NEON_PINK}╚════════════════════════════════════════════════════════════╝${NC}`);
  console.log(`🕒 ${CYAN}Time:${NC} ${new Date().toLocaleString('vi-VN')}`);
  console.log(`🤖 ${CYAN}Bot Account:${NC} ${NEON_GREEN}${c.user.tag}${NC}`);
  console.log(`🛡️ ${CYAN}Status:${NC} ${NEON_GREEN}ONLINE & READY${NC}`);
  console.log(`${NEON_PINK}──────────────────────────────────────────────────────────────${NC}`);
  
  console.log(`${WHITE}--- [ CORE MODULES ] ---${NC}`);
  console.log(`📂 ${CYAN}Database:${NC}  ${NEON_GREEN}CONNECTED (game.db, dictionary.db)${NC}`);
  console.log(`🤖 ${CYAN}AI Engine:${NC} ${NEON_GREEN}LOADED (Gemini AI)${NC}`);
  console.log(`⏰ ${CYAN}Reminders:${NC} ${NEON_GREEN}ACTIVE (30s interval)${NC}`);
  console.log(`🌐 ${CYAN}Webhooks:${NC}  ${NEON_GREEN}LISTENING (Port ${process.env.WEBHOOK_PORT || 3000})${NC}`);
  console.log(`🔗 ${CYAN}GitHub Hook:${NC} ${WHITE}${webhookUrl}${NC}`);
  
  // Trigger manual webhook push on startup
  console.log(`🔄 ${CYAN}Webhook:${NC}  ${NEON_GREEN}Triggering manual update...${NC}`);
  const { exec } = require('child_process');
  exec('node webhook-pusher.js --once', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Manual webhook push failed: ${error.message}`);
      return;
    }
    console.log(`✅ Manual webhook push completed.`);
  });
  
  console.log(`\n${WHITE}--- [ WEBHOOK STATUS ] ---${NC}`);
  const status = {
      News: dataStore.getNews().updatedAt ? '✅' : '❌',
      Crypto: dataStore.getCrypto().updatedAt ? '✅' : '❌',
      Exchange: dataStore.getExchange().updatedAt ? '✅' : '❌',
      Fuel: dataStore.getFuel().updatedAt ? '✅' : '❌',
  };
  Object.entries(status).forEach(([k, v]) => console.log(`${CYAN}${k}:${NC} ${v}`));
  
  console.log(`\n${WHITE}--- [ GAME MODULES ] ---${NC}`);
  console.log(`🎲 ${CYAN}Tài Xỉu:${NC}   ${NEON_GREEN}READY${NC}`);
  console.log(`🔤 ${CYAN}Nối Từ:${NC}    ${NEON_GREEN}READY${NC}`);
  console.log(`🎰 ${CYAN}Slot Mach:${NC} ${NEON_GREEN}READY${NC}`);
  console.log(`🎒 ${CYAN}Scavenger:${NC} ${NEON_GREEN}READY (${scavengerCount} items loaded)${NC}`);
  
  console.log(`\n${WHITE}--- [ BOT STATISTICS ] ---${NC}`);
  console.log(`⌨️  ${CYAN}Commands:${NC}  ${NEON_GREEN}${commands.length} Slash Commands registered${NC}`);
  console.log(`🏆 ${CYAN}Economy:${NC}   ${NEON_GREEN}Active (Richest: ${topPlayersResult[0]?.username || 'N/A'})${NC}`);
  console.log(`${NEON_PINK}──────────────────────────────────────────────────────────────${NC}`);

  // Register slash commands on startup
  const { deployCommands } = require('./deploy-commands');
  if (typeof deployCommands === 'function') {
    deployCommands().catch(e => console.error('❌ Failed to register slash commands:', e.message));
  }

  // Auto-subscribe the specific news channel
  const AUTO_NEWS_CHANNEL = '1513064877231702016';
  await subscribeNews(AUTO_NEWS_CHANNEL);

  // Auto-subscribe the specific finance channel
  const AUTO_FINANCE_CHANNEL = '1513083153374249021';
  await subscribeNews(AUTO_FINANCE_CHANNEL);

  // Dedicated Over-Under Channels
  const DEDICATED_OU_CHANNELS = [
    '1513076471797776435',
    '1513076573954117632',
    '1513076691839488030'
  ];
  for (const channelId of DEDICATED_OU_CHANNELS) {
    await startGame(channelId, 'over-under');
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel) {
        const { getBetButtons } = require('./src/games/overUnder');
        await channel.send({ content: `🎲 **Kênh chuyên dụng Tài Xỉu đã sẵn sàng!**\n⚠️ Game chỉ vì mục đích giải trí.\nGõ \`/over <số điểm>\` hoặc \`/under <số điểm>\` để đặt cược.\n🖲️ Hoặc bấm nút bên dưới để đặt nhanh.`, components: getBetButtons() });
      }
    } catch (e) {
      console.error(`Failed to notify OU channel ${channelId}:`, e.message);
    }
  }

  // Notify server that bot is online
  try {
    const announceChannel = await client.channels.fetch('1513126892587192370');
    if (announceChannel) {
      const statusMsg = await announceChannel.send('🟢 **Bot Online** — khởi động xong');

      // Heartbeat every 10 minutes — edit status message
      setInterval(async () => {
        try {
          const uptime = Math.floor(process.uptime() / 60);
          const hours = Math.floor(uptime / 60);
          const mins = uptime % 60;
          const timeStr = hours > 0 ? `${hours}h${mins}p` : `${mins}p`;
          await statusMsg.edit(`🟢 **Bot Online** — ${timeStr} ✅`);
        } catch (e) {
          console.error('Heartbeat failed:', e.message);
        }
      }, 600000);

      // Webhook status update every 30 minutes
      let webhookStatusMsg = null;
      setInterval(async () => {
        try {
          const sources = [
            { label: '📰 Tin tức', getter: 'getNews' },
            { label: '🪙 Crypto', getter: 'getCrypto' },
            { label: '⛽ Xăng dầu', getter: 'getFuel' },
            { label: '💸 Tỷ giá', getter: 'getExchange' },
          ];
          let msg = '🌐 **TRẠNG THÁI WEBHOOK**\n';
          for (const s of sources) {
            const data = dataStore[s.getter]();
            const icon = data.updatedAt ? '✅' : '❌';
            const time = data.updatedAt
              ? `<t:${Math.floor(data.updatedAt.getTime() / 1000)}:R>`
              : '🚫 Chưa từng cập nhật';
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

      // Reminder checker every 30 seconds
      setInterval(() => {
        reminders.checkReminders(client).catch(e => console.error('Reminder check failed:', e.message));
      }, 30000);
    }
  } catch (e) {
    console.error('Failed to announce bot online:', e.message);
  }

  // Post bank command list to bank channel
  try {
    const bankChannel = await client.channels.fetch('1513092507804635136');
    if (bankChannel) {
      await bankChannel.send(
        `🏦 **NGÂN HÀNG ${CURRENCY_NAME}**\n\n` +
        `**Các lệnh ngân hàng:**\n` +
        `- \`/deposit <số tiền>\` hoặc \`!deposit <số tiền>\`: Gửi tiền vào ngân hàng (≥100, bội số 100)\n` +
        `- \`/withdraw <số tiền>\` hoặc \`!withdraw <số tiền>\`: Rút tiền từ ngân hàng (≥100, bội số 100)\n` +
        `- \`/loan <số tiền>\` hoặc \`!loan <số tiền>\`: Vay tiền (100–5,000, mỗi 1h/lần)\n` +
        `- \`/payback <số tiền|all>\` hoặc \`!payback <số tiền|all>\`: Trả nợ\n\n` +
        `💡 *Các lệnh chỉ hoạt động trong kênh này.*`
      );
    }
  } catch (e) {
    console.error('Failed to post bank commands:', e.message);
  }

  // Start webhook server
  const startWebhookServer = require('./src/webhook-server');
  startWebhookServer(client);

  // Auto-restart logic: Exit process after 12 hours (43,200,000 ms)
  // Startup script or process manager will handle the restart.
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  setTimeout(() => {
    console.log('🔄 [System] 12-hour limit reached. Exiting for scheduled restart...');
    process.exit(0);
  }, TWELVE_HOURS_MS);
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

  // Global Commands
  if (command === '!help' || command === '!h' || command === '!trogiup') {
    const helpMsg = 
      `📖 **DANH SÁCH LỆNH CỦA BOT**\n\n` +
      `🎮 **Trò Chơi:**\n` +
      `- \`/noitu\`: Nối Từ.\n` +
      `- \`/taixiu\`: Tài Xỉu.\n` +
      `- \`/slot <cược>\`: Quay máy Slot Machine.\n` +
      `- \`/stop\`: Dừng trò chơi.\n\n` +
      `💰 **Kinh Tế & Cá Nhân:**\n` +
      `- \`/reward\`: Nhận quà miễn phí mỗi 4 giờ.\n` +
      `- \`/profile\`: Xem hồ sơ cá nhân.\n` +
      `- \`/leaderboard\`: Bảng xếp hạng.\n` +
      `- \`/deposit\`: Gửi tiền ngân hàng.\n` +
      `- \`/withdraw\`: Rút tiền ngân hàng.\n` +
      `- \`/loan\`: Vay tiền.\n` +
      `- \`/payback\`: Trả nợ.\n\n` +
       `🤖 **Trợ Lý Ảo & Tiện Ích:**\n` +
       `- \`/ask\`: Hỏi trợ lý AI.\n` +
       `- \`/remind\`: Đặt nhắc nhở.\n` +
       `- \`/search\`: Tìm kiếm web.\n\n` +
      `🎒 **Lụm Rác Delta Force:**\n` +
      `- \`/scavenge start\`: Vào map lụm rác.\n` +
      `- \`/storage view\`: Xem kho đồ.\n\n` +
      `💡 *Dùng lệnh gạch chéo (/) để có gợi ý tự động!*`;
    message.reply(helpMsg);
    return;
  }

  // Delegate Active Game Logic
  const state = await getGameState(message.channel.id);
  
  if (!state || !state.is_active) return;

  if (state.game_type === 'over-under') {
    if (command === '!over' || command === '!under') {
        const OU_DEDICATED = ['1513076471797776435', '1513076573954117632', '1513076691839488030'];
        if (!OU_DEDICATED.includes(message.channel.id)) {
          message.reply('❌ Lệnh Tài Xỉu chỉ sử dụng được trong kênh chuyên dụng.');
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
  console.error('❌ Failed to login:', err.message);
});
