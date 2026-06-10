const { Client, GatewayIntentBits, Events } = require('discord.js');
const fs = require('fs');
const { getGameState, startGame, stopGame, getUserProfile, getTopPlayers, deposit, withdraw, takeLoan, payback, claimReward, subscribeNews, unsubscribeNews, getNewsSubscriptions, addPoints, CURRENCY_NAME, CURRENCY_ICON } = require('./src/database');
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
  const NC = '\x1b[0m';

  console.clear();
  console.log(`${NEON_PINK}╔════════════════════════════════════════════════════════════╗${NC}`);
  console.log(`${NEON_PINK}║${NC}        ${CYAN}🚀 ALLIN BOT SERVER - STARTUP SUCCESSFUL          ${NEON_PINK}║${NC}`);
  console.log(`${NEON_PINK}╚════════════════════════════════════════════════════════════╝${NC}`);
  console.log(`🕒 ${CYAN}Time:${NC} ${new Date().toLocaleString('vi-VN')}`);
  console.log(`🤖 ${CYAN}Bot Account:${NC} ${NEON_GREEN}${c.user.tag}${NC}`);
  console.log(`🛡️ ${CYAN}Status:${NC} ${NEON_GREEN}ONLINE & READY${NC}`);
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

  // Start webhook server (thay thế API polling)
  const startWebhookServer = require('./src/webhook-server');
  startWebhookServer(client);

  // Log scavenger items ready
  const { getDFItemCount } = require('./src/database');
  getDFItemCount().then(count => {
    console.log(`📦 ${count} scavenger items loaded from database`);
  });

  console.log('🌐 Webhook server ready — gửi POST đến /webhook/news và /webhook/finance');
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
  // Strip zero-width and invisible characters
  content = content.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060\u2061\u2062\u2063\u2064]/g, '');
  if (!content) return;

  const args = content.split(/\s+/);
  const command = args[0].toLowerCase();

  // Global Commands
  if (command === '!help' || command === '!h' || command === '!trogiup') {
    const helpMsg = 
      `📖 **DANH SÁCH LỆNH CỦA BOT**\n\n` +
      `🎮 **Trò Chơi:**\n` +
      `- \`/start game:noitu\` hoặc \`!start noitu\`: Nối Từ.\n` +
      `- \`/start game:over-under\` hoặc \`!start over-under\`: Tài Xỉu.\n` +
      `- \`/stop\` hoặc \`!stop\`: Dừng trò chơi.\n\n` +
      `💰 **Kinh Tế & Cá Nhân:**\n` +
      `- \`/reward\` / \`!reward\`: Nhận quà miễn phí mỗi 4 giờ.\n` +
      `- \`/profile\` / \`!profile\`: Xem hồ sơ cá nhân.\n` +
      `- \`/leaderboard\` / \`!leaderboard\`: Bảng xếp hạng.\n` +
      `- \`/deposit\` / \`!deposit\`: Gửi tiền ngân hàng.\n` +
      `- \`/withdraw\` / \`!withdraw\`: Rút tiền ngân hàng.\n` +
      `- \`/loan\` / \`!loan\`: Vay tiền.\n` +
      `- \`/payback\` / \`!payback\`: Trả nợ.\n\n` +
       `🤖 **Trợ Lý Ảo & Tiện Ích:**\n` +
       `- \`/ask\` / \`!ask\`: Hỏi trợ lý AI bất kỳ điều gì.\n` +
       `- \`/saeed\` / \`!saeed\`: Trò chuyện với Saeed Ziaten (Fiery Owl).\n` +
       `- \`/remind\` / \`!remind\`: Đặt nhắc nhở (VD: 30m, 1h, 14:30).\n` +
       `- \`/wiki\` / \`!wiki\`: Tra cứu Wikipedia.\n` +
       `- \`/define\` / \`!define\`: Tra từ điển tiếng Anh.\n` +
       `- \`/search\` / \`!search\`: Tìm kiếm thông tin trên web.\n\n` +
       `📊 **Tin Tức & Thị Trường:**\n` +
       `- \`/news\` / \`!news\`: Bật/tắt tin tức.\n` +
       `- \`/crypto\` / \`!crypto\`: Giá crypto.\n` +
       `- \`/gold\` / \`!gold\`: Giá vàng các loại.\n` +
       `- \`/xang\` / \`!xang\`: Giá xăng dầu.\n` +
       `- \`/tygia\` / \`!tygia\`: Tỷ giá ngoại tệ.\n` +
       `- \`/webhook-status\` / \`!webhook\`: Xem trạng thái webhook còn sống hay chết.\n\n` +
      `🎒 **Lụm Rác Delta Force:**\n` +
      `- \`/scavenge start map:<map>\`: Vào map lụm rác (5 phút, balo 20 ô).\n` +
      `- \`/scavenge loot\`: Lụm món đồ tiếp theo.\n` +
      `- \`/scavenge backpack\`: Xem balo.\n` +
      `- \`/scavenge buyslots số_lượng\`: Mua thêm ô balo (giá tăng dần).\n` +
      `- \`/scavenge end\`: Kết thúc và bán đồ.\n` +
      `- \`!scavenge <map> [5|10|15]\`: Bắt đầu (text).\n` +
      `  ⚠️ Chỉ dùng được trong khu vực Scavenger.\n` +
      `  Map: \`zero\`, \`scn\`, \`sch\`, \`brakkesh\` (mặc định 5p)\n` +
      `- \`/storage view\`: Xem kho đồ.\n` +
      `- \`/storage sell <id | all>\`: Bán đồ trong kho.\n` +
      `- \`/storage upgrade\`: Nâng cấp kho (100→150→200).\n` +
      `- \`!kho\`, \`!kho sell <id|all>\`, \`!kho upgrade\`: Kho (text).\n\n` +
      `💡 *Slash commands có gợi ý tự động, dễ dùng hơn!*`;
    message.reply(helpMsg);
    return;
  }

  if (command === '!start' || command === '!play' || command === '!game') {
    const gameType = args[1] ? args[1].toLowerCase() : null;
    if (!gameType) {
      message.reply('🎮 Hãy chọn game để chơi:\n1. `!start noitu` hoặc `/start game:noitu` - Trò chơi Nối Từ\n2. `!start over-under` hoặc `/start game:over-under` - Trò chơi Tài Xỉu');
      return;
    }

    if (gameType === 'noitu') {
      const NOITU_CHANNELS = ['1512801317586866186', '1512855412100300900'];
      if (!NOITU_CHANNELS.includes(message.channel.id)) {
        message.reply('❌ Trò chơi Nối Từ chỉ được phép chơi trong kênh chuyên dụng.');
        return;
      }
      await startGame(message.channel.id, 'noitu');
      clearTimer(message.channel.id);
      message.reply('🎮 Trò chơi Nối Từ đã bắt đầu! Hãy nhập từ đầu tiên.');
    } else if (gameType === 'over-under') {
      await startGame(message.channel.id, 'over-under');
      clearTimer(message.channel.id);
      const disclaimer = 
        `💰 **Bắt đầu cá cược, chúc ông chủ may mắn!**\n\n` +
        `⚠️ **TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM (DISCLAIMER):**\n` +
        `1. Trò chơi chỉ mang tính chất **giải trí thuần túy** trên nền tảng Discord.\n` +
        `2. Tiền trong game (${CURRENCY_NAME}) là **tiền ảo**, không có giá trị quy đổi thành tiền thật, thẻ cào, hay bất kỳ hiện vật nào có giá trị.\n` +
        `3. Hệ thống **không cổ xúy, không tổ chức cờ bạc** trái phép.\n` +
        `4. Người chơi tự chịu trách nhiệm về hành vi. Hãy chơi game văn minh.\n\n` +
        `🎮 **Cách chơi:** Gõ \`/over <số điểm>\` hoặc \`/under <số điểm>\` để đặt cược.\n` +
        `🖲️ Hoặc bấm nút bên dưới để đặt nhanh.`;
      const { getBetButtons } = require('./src/games/overUnder');
      message.reply({ content: disclaimer, components: getBetButtons() });
    } else {
      message.reply('❌ Game không hợp lệ. Hãy chọn `noitu` hoặc `over-under`.');
    }
    return;
  }
  
  if (command === '!giveup' || command === '!stop') {
    await stopGame(message.channel.id);
    clearTimer(message.channel.id);
    message.reply('🏳️ Trò chơi đã kết thúc.');
    return;
  }

  if (command === '!leaderboard') {
    const top = await getTopPlayers();
    let reply = `🏆 Bảng xếp hạng (${CURRENCY_NAME}):\n`;
    top.forEach((p, i) => {
        reply += `${i+1}. ${p.username}: ${p.points} ${CURRENCY_NAME} ${CURRENCY_ICON} \n`;
    });
    message.reply(reply);
    return;
  }

  if (command === '!reward' || command === '!qua') {
    const REWARD_COOLDOWN = 14400000; // 4 hours
    const p = await getUserProfile(message.author.id);
    const now = Date.now();

    if (p && now - p.last_reward_at < REWARD_COOLDOWN) {
        const remainingMs = REWARD_COOLDOWN - (now - p.last_reward_at);
        const hours = Math.floor(remainingMs / 3600000);
        const minutes = Math.floor((remainingMs % 3600000) / 60000);
        message.reply(`⏳ Bạn đã nhận quà rồi. Hãy quay lại sau \`${hours}h ${minutes}m\`.`);
        return;
    }

    const randomAmount = (Math.floor(Math.random() * 10) + 1) * 100;
    await claimReward(message.author.id, message.author.username, randomAmount);
    
    const giftMessages = [
        `🎁 Bạn mở hộp quà và thấy \`${randomAmount} ${CURRENCY_NAME}\`!`,
        `💰 Một đại gia đi ngang qua và đánh rơi \`${randomAmount} ${CURRENCY_NAME}\` vào túi bạn!`,
        `🍀 Hôm nay bạn thật may mắn, nhận ngay \`${randomAmount} ${CURRENCY_NAME}\`!`,
        `🏦 Ngân hàng trung ương phát chẩn cho bạn \`${randomAmount} ${CURRENCY_NAME}\`!`
    ];
    const randomMsg = giftMessages[Math.floor(Math.random() * giftMessages.length)] + 
                      ` (Dùng \`/profile\` để xem ví) ${CURRENCY_ICON}`;
    message.reply(randomMsg);
    return;
  }

  if (command === '!saeed') {
    const question = args.slice(1).join(' ');
    if (!question) {
      message.reply('❌ VD: `!saeed kể về Zero Dam đi`');
      return;
    }
    const reply = await ai.askAI(message.author.id, question);
    const maxLen = 1900;
    message.reply(reply.length > maxLen ? reply.slice(0, maxLen) + '...' : reply);
    return;
  }

  if (command === '!ask' || command === '!hoi') {
    const question = args.slice(1).join(' ');
    if (!question) {
      message.reply('❌ VD: `!ask trời hôm nay thế nào?`');
      return;
    }
    const reply = await ai.askAI(message.author.id, question);
    const maxLen = 1900;
    message.reply(reply.length > maxLen ? reply.slice(0, maxLen) + '...' : reply);
    return;
  }

  if (command === '!remind' || command === '!nhac') {
    const timeStr = args[1];
    const msg = args.slice(2).join(' ');
    if (!timeStr || !msg) {
      message.reply('❌ VD: `!remind 30m làm bài tập`');
      return;
    }
    const result = await reminders.setReminder(message.author.id, message.channel.id, timeStr, msg);
    if (result.error) { message.reply(result.error); return; }
    message.reply(`⏰ Đã đặt nhắc nhở sau **${result.display}**: ${msg}`);
    return;
  }

  if (command === '!wiki') {
    const query = args.slice(1).join(' ');
    if (!query) { message.reply('❌ VD: `!wiki Việt Nam`'); return; }
    const result = await lookup.wiki(query);
    message.reply(result);
    return;
  }

  if (command === '!define' || command === '!nghia') {
    const word = args[1];
    if (!word) { message.reply('❌ VD: `!define hello`'); return; }
    const result = await lookup.define(word);
    message.reply(result);
    return;
  }

  if (command === '!search' || command === '!tim') {
    const query = args.slice(1).join(' ');
    if (!query) { message.reply('❌ VD: `!search thời tiết hôm nay`'); return; }
    const result = await lookup.search(query);
    message.reply(result);
    return;
  }

  if (command === '!webhook') {
    const sources = [
      { key: 'news', label: '📰 Tin tức', getter: 'getNews' },
      { key: 'crypto', label: '🪙 Crypto', getter: 'getCrypto' },
      { key: 'fuel', label: '⛽ Xăng dầu', getter: 'getFuel' },
      { key: 'exchange', label: '💸 Tỷ giá', getter: 'getExchange' },
    ];

    let msg = '🌐 **TRẠNG THÁI WEBHOOK**\n\n';
    for (const s of sources) {
      const data = dataStore[s.getter]();
      const alive = data.updatedAt ? true : false;
      const statusIcon = alive ? '✅' : '❌';
      const time = data.updatedAt
        ? `<t:${Math.floor(data.updatedAt.getTime() / 1000)}:R>`
        : 'Chưa từng cập nhật';
      msg += `${statusIcon} **${s.label}**: ${time}\n`;
    }
    msg += `\n🟢 **Server**: Uptime \`${Math.floor(process.uptime() / 60)}p\``;
    message.reply(msg);
    return;
  }

  if (command === '!tygia') {
    if (message.channel.id !== '1513082616444616754') {
      message.reply('❌ Lệnh này chỉ sử dụng được trong kênh Tài chính.');
      return;
    }
    const { content, updatedAt, change } = dataStore.getExchange();
    if (!content) { message.reply('⏳ Chưa có dữ liệu tỷ giá. Hãy đợi webhook cập nhật.'); return; }
    message.reply(`${content}${change}\n⏰ *Cập nhật: ${updatedAt.toLocaleString('vi-VN')}*`);
    return;
  }

  if (command === '!crypto' || command === '!coin') {
    if (message.channel.id !== '1513082616444616754') {
      message.reply('❌ Lệnh này chỉ sử dụng được trong kênh Tài chính.');
      return;
    }
    const { content, updatedAt, change } = dataStore.getCrypto();
    if (!content) { message.reply('⏳ Chưa có dữ liệu crypto. Hãy đợi webhook cập nhật.'); return; }
    message.reply(`${content}${change}\n⏰ *Cập nhật: ${updatedAt.toLocaleString('vi-VN')}*`);
    return;
  }

  if (command === '!gold') {
    if (message.channel.id !== '1513082616444616754') {
      message.reply('❌ Lệnh này chỉ sử dụng được trong kênh Tài chính.');
      return;
    }
    const { content, updatedAt, change } = dataStore.getGold();
    if (!content) { message.reply('⏳ Chưa có dữ liệu giá vàng. Hãy đợi webhook cập nhật.'); return; }
    message.reply(`${content}${change}\n⏰ *Cập nhật: ${updatedAt.toLocaleString('vi-VN')}*`);
    return;
  }

  if (command === '!giaxang' || command === '!xang') {
    if (message.channel.id !== '1513082616444616754') {
      message.reply('❌ Lệnh này chỉ sử dụng được trong kênh Tài chính.');
      return;
    }
    const { content, updatedAt, change } = dataStore.getFuel();
    if (!content) { message.reply('⏳ Chưa có dữ liệu giá xăng. Hãy đợi webhook cập nhật.'); return; }
    message.reply(`${content}${change}\n⏰ *Cập nhật: ${updatedAt.toLocaleString('vi-VN')}*`);
    return;
  }

  if (command === '!news') {
    const subCommand = args[1] ? args[1].toLowerCase() : null;
    if (subCommand === 'on') {
      await subscribeNews(message.channel.id);
      message.reply('🔔 Đã đăng ký nhận tin tức hàng giờ tại kênh này!');
    } else if (subCommand === 'off') {
      await unsubscribeNews(message.channel.id);
      message.reply('🔕 Đã hủy đăng ký nhận tin tức tại kênh này.');
    } else {
      message.reply('📰 **Lệnh Tin Tức:**\n- `!news on`: Đăng ký nhận tin mới mỗi giờ.\n- `!news off`: Hủy đăng ký.');
    }
    return;
  }

  // ─── Balance ───
  if (command === '!bal' || command === '!balance') {
    const p = await getUserProfile(message.author.id);
    if (!p) { message.reply('👤 Bạn chưa có dữ liệu. Hãy tham gia game để bắt đầu!'); return; }
    message.reply(`💰 **Số dư của ${message.author.username}**\n💵 Tiền mặt: \`${p.points.toLocaleString()} ${CURRENCY_NAME}\`\n🏦 Ngân hàng: \`${p.bank.toLocaleString()} ${CURRENCY_NAME}\``);
    return;
  }

  if (command === '!profile' || command === '!me') {
    const p = await getUserProfile(message.author.id);
    if (!p) {
        message.reply('👤 Bạn chưa có dữ liệu. Hãy tham gia game để bắt đầu!');
        return;
    }
    const reply = `👤 **Hồ sơ của ${message.author.username}**\n` +
                  `💵 Tiền mặt: \`${p.points} ${CURRENCY_NAME}\` \n` +
                  `🏦 Ngân hàng: \`${p.bank} ${CURRENCY_NAME}\` \n` +
                  `💸 Đang nợ: \`${p.loan} ${CURRENCY_NAME}\` \n` +
                  `--- ${CURRENCY_ICON}`;
    message.reply(reply);
    return;
  }

  if (command === '!deposit' || command === '!gui') {
    if (message.channel.id !== '1513092507804635136') {
        message.reply('❌ Lệnh này chỉ được sử dụng trong kênh Ngân hàng.');
        return;
    }
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 100 || amount % 100 !== 0) {
        message.reply(`❌ Số tiền gửi phải là bội số của 100 ${CURRENCY_NAME}. Ví dụ: \`/deposit amount:500\` hoặc \`!deposit 500\``);
        return;
    }
    const p = await getUserProfile(message.author.id);
    if (!p || p.points < amount) {
        message.reply('❌ Bạn không đủ tiền mặt để gửi.');
        return;
    }
    await deposit(message.author.id, amount);
    message.reply(`✅ Đã gửi \`${amount} ${CURRENCY_NAME}\` vào ngân hàng.`);
    return;
  }

  if (command === '!withdraw' || command === '!rut') {
    if (message.channel.id !== '1513092507804635136') {
        message.reply('❌ Lệnh này chỉ được sử dụng trong kênh Ngân hàng.');
        return;
    }
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 100 || amount % 100 !== 0) {
        message.reply(`❌ Số tiền rút phải là bội số của 100 ${CURRENCY_NAME}. Ví dụ: \`/withdraw amount:200\` hoặc \`!withdraw 200\``);
        return;
    }
    const p = await getUserProfile(message.author.id);
    if (!p || p.bank < amount) {
        message.reply('❌ Bạn không đủ tiền trong ngân hàng để rút.');
        return;
    }
    await withdraw(message.author.id, amount);
    message.reply(`✅ Đã rút \`${amount} ${CURRENCY_NAME}\` về tiền mặt.`);
    return;
  }

  if (command === '!loan' || command === '!vay') {
    if (message.channel.id !== '1513092507804635136') {
        message.reply('❌ Lệnh này chỉ được sử dụng trong kênh Ngân hàng.');
        return;
    }
    const amount = parseInt(args[1]);
    const LOAN_LIMIT = 5000;
    const LOAN_COOLDOWN = 3600000; // 1 hour

    if (isNaN(amount) || amount < 100 || amount % 100 !== 0 || amount > LOAN_LIMIT) {
        message.reply(`❌ Bạn có thể vay từ 100 đến \`${LOAN_LIMIT} ${CURRENCY_NAME}\` (bội số của 100).`);
        return;
    }

    const p = await getUserProfile(message.author.id);
    const now = Date.now();
    
    if (p) {
        if (p.loan > 0) {
            message.reply(`❌ Bạn vẫn còn nợ \`${p.loan} ${CURRENCY_NAME}\`. Hãy trả hết trước khi vay thêm.`);
            return;
        }
        if (now - p.last_loan_at < LOAN_COOLDOWN) {
            const remaining = Math.ceil((LOAN_COOLDOWN - (now - p.last_loan_at)) / 60000);
            message.reply(`❌ Bạn vừa vay xong. Hãy đợi thêm \`${remaining}\` phút nữa.`);
            return;
        }
    }

    await takeLoan(message.author.id, message.author.username, amount);
    message.reply(`💸 Bạn đã vay thành công \`${amount} ${CURRENCY_NAME}\`. Nhớ trả nợ sớm!`);
    return;
  }

  if (command === '!payback' || command === '!tra') {
    if (message.channel.id !== '1513092507804635136') {
        message.reply('❌ Lệnh này chỉ được sử dụng trong kênh Ngân hàng.');
        return;
    }
    const p = await getUserProfile(message.author.id);
    if (!p || p.loan <= 0) {
        message.reply('❌ Bạn không có khoản nợ nào cần trả.');
        return;
    }
    const amount = args[1] === 'all' ? p.loan : parseInt(args[1]);
    if (isNaN(amount) || amount < 100 || (amount % 100 !== 0 && amount !== p.loan)) {
        message.reply(`❌ Số tiền trả phải là bội số của 100 ${CURRENCY_NAME} hoặc \`/payback amount:all\` / \`!payback all\`.`);
        return;
    }
    if (p.points < amount) {
        message.reply('❌ Bạn không đủ tiền mặt để trả nợ.');
        return;
    }
    const actualPay = Math.min(amount, p.loan);
    await payback(message.author.id, actualPay);
    message.reply(`✅ Bạn đã trả \`${actualPay} ${CURRENCY_NAME}\`. Nợ còn lại: \`${p.loan - actualPay} ${CURRENCY_NAME}\`.`);
    return;
  }

  if (command === '!scavenge' || command === '!lụm') {
    const SCAVENGE_CATEGORY = '1513114420824244296';
    if (message.channel.parentId !== SCAVENGE_CATEGORY) {
      message.reply('❌ Lệnh này chỉ sử dụng được trong khu vực Scavenger. Dùng `/scavenge` trong channel riêng của bạn.');
      return;
    }

    const scavengeGame = require('./src/scavenge');
    const { getUserProfile, addPoints } = require('./src/database');
    const sub = args[1]?.toLowerCase();
    const session = scavengeGame.getSession(message.author.id);

    // Buy backpack slots
    if (sub === 'buyslots' || sub === 'muabalo' || sub === 'mua' || sub === 'nângbalo') {
      const numSlots = parseInt(args[2]) || 1;
      const buyInfo = scavengeGame.buyBackpackSlots(message.author.id, numSlots);
      if (buyInfo.error) { message.reply(`❌ ${buyInfo.error}`); return; }
      const p = await getUserProfile(message.author.id);
      if (!p || p.points < buyInfo.cost) {
        message.reply(`❌ Cần \`${buyInfo.cost.toLocaleString()} ${CURRENCY_NAME}\` để mua thêm ${numSlots} ô (${buyInfo.currentMax} → ${buyInfo.newMax}). Bạn có \`${p?.points || 0}\`.`);
        return;
      }
      await addPoints(message.author.id, message.author.username, -buyInfo.cost);
      const result = scavengeGame.applyBackpackUpgrade(message.author.id, numSlots);
      if (result.error) { await addPoints(message.author.id, message.author.username, buyInfo.cost); message.reply(`❌ ${result.error}`); return; }
      message.reply(`✅ Đã mua **+${numSlots} ô balo** (${buyInfo.currentMax} → ${result.maxSlots}) — \`${buyInfo.cost.toLocaleString()} ${CURRENCY_NAME}\``);
      return;
    }

    // End session
    if (sub === 'end' || sub === 'về' || sub === 'stop') {
      const result = await scavengeGame.endSession(message.author.id);
      if (result.error) { message.reply(`❌ ${result.error}`); return; }

      let msg = `${result.mapEmoji} **${result.mapName} — Kết thúc lụm rác**\n\n`;
      if (result.itemCount === 0) {
        msg += `Bạn không lụm được gì cả.\n`;
      } else {
        result.backpack.forEach((item, i) => {
          msg += `${i + 1}. ${item.emoji} ${item.name} — \`${item.value.toLocaleString()}đ\`\n`;
        });
      }
      msg += `\n📦 **Đã cất ${result.stored}/${result.itemCount} món vào kho**\n`;
      if (result.full) msg += `⚠️ Kho đầy! Một số món đã bị bỏ lại.\n`;
      msg += `⏱️ ${Math.floor(result.duration / 60)}p${result.duration % 60}s\n`;
      msg += `💡 Dùng \`!kho\` để xem kho và bán đồ.`;
      message.reply(msg);
      return;
    }

    // View backpack
    if (sub === 'balo' || sub === 'backpack' || sub === 'túi') {
      const bp = scavengeGame.getBackpack(message.author.id);
      if (!bp) { message.reply('🎒 Bạn chưa vào map nào. Dùng `!scavenge <map>` để bắt đầu.'); return; }
      if (bp.items.length === 0) {
        message.reply(`🎒 **${bp.mapEmoji} ${bp.mapName}** — Balo trống (0/${bp.maxSlots}) ⏱️ Còn ${bp.timeLeft}s\nDùng \`!scavenge\` để lụm đồ.`);
        return;
      }
      let msg = `🎒 **${bp.mapEmoji} ${bp.mapName} — Balo** (${bp.used}/${bp.maxSlots}) ⏱️ Còn ${bp.timeLeft}s\n\n`;
      let total = 0;
      bp.items.forEach((item, i) => {
        msg += `${i + 1}. ${item.emoji} ${item.name} — \`${item.value.toLocaleString()}đ\`\n`;
        total += item.value;
      });
      msg += `\n💵 **Tổng:** \`${total.toLocaleString()} ${CURRENCY_NAME}\``;
      message.reply(msg);
      return;
    }

    // Loot (no args or 'loot')
    if (!sub || sub === 'loot' || sub === 'lụm') {
      const result = await scavengeGame.loot(message.author.id);
      if (result.error) { message.reply(`❌ ${result.error}`); return; }
      if (result.died) {
        message.reply(
          `💀 **Bạn đã bị giết bởi ${result.enemy.emoji} ${result.enemy.name}**\n` +
          `${result.enemy.desc} đã hạ gục bạn khi đang lục đồ ở **${result.mapEmoji} ${result.mapName}**\n` +
          `📦 Mất **${result.itemCount} món** (trị giá \`${result.lostValue.toLocaleString()} ${CURRENCY_NAME}\`)\n` +
          `🏳️ Tất cả đồ đã rơi hết. Xin vui lòng đợi hồi sinh!`
        );
        return;
      }
      message.reply(
        `${result.item.emoji} **${result.item.name}**\n` +
        `💵 Giá: \`${result.item.value.toLocaleString()} ${CURRENCY_NAME}\`\n` +
        `🎒 Balo: ${result.slot}/${result.maxSlots} ⏱️ Còn ${result.timeLeft}s\n` +
        `Dùng \`!scavenge\` tiếp hoặc \`!scavenge end\` để về.`
      );
      return;
    }

    // Start session (map name)
    const mapAliases = {
      zeroDamEZ: ['zero', 'z', 'zde', 'zero dam ez'],
      spaceCityNormal: ['scn', 'space n', 'space city normal', 'city n'],
      spaceCityHard: ['sch', 'space h', 'space city hard', 'city h'],
      brakkesh: ['brakkesh', 'bra', 'bk', 'b'],
    };
    let mapId = null;
    for (const [id, aliases] of Object.entries(mapAliases)) {
      if (aliases.includes(sub) || id === sub) { mapId = id; break; }
    }
    if (!mapId) {
      message.reply('❌ Không hiểu lệnh. Dùng:\n`!scavenge <map> [5|10|15]` — vào map\n`!scavenge` — lụm đồ\n`!scavenge balo` — xem balo\n`!scavenge buyslots <số>` — mua thêm ô\n`!scavenge end` — kết thúc\n\nMap: `zero`, `scn`, `sch`, `brakkesh`');
      return;
    }

    // Parse optional time argument (2nd arg)
    const timeArg = parseInt(args[2]);
    const durationMinutes = [5, 10, 15].includes(timeArg) ? timeArg : 5;

    const map = scavengeGame.MAPS[mapId];
    const p = await getUserProfile(message.author.id);
    if (!p || p.points < map.entryFee) {
      message.reply(`❌ Bạn cần \`${map.entryFee} ${CURRENCY_NAME}\` để vào ${map.name}. Bạn có \`${p?.points || 0}\`.`);
      return;
    }

    await addPoints(message.author.id, message.author.username, -map.entryFee);

    const onAutoLoot = (data) => {
      if (data.full) {
        message.channel.send(`${map.emoji} **${map.name}** — ⚠️ Balo đã đầy (${data.used}/${data.maxSlots})! Dùng \`!scavenge end\` để kết thúc.`).catch(() => {});
        return;
      }
      const item = data.item;
      const rareTag = item.rareEmoji ? ` ${item.rareEmoji} ${item.rareLabel}` : '';
      message.channel.send(
        `🆕 ${item.emoji} **${item.name}**${rareTag}\n` +
        `└ ${item.rarityName} (${item.rarityColor}) | ${item.slots}ô | \`${item.value.toLocaleString()} ${CURRENCY_NAME}\`\n` +
        `🎒 **${data.used}/${data.maxSlots} ô** ⏱️ Còn ${data.timeLeft}s`
      ).catch(() => {});
    };

    const result = await scavengeGame.startSession(message.author.id, message.author.username, mapId, durationMinutes, { onLoot: onAutoLoot });
    if (result.error) {
      await addPoints(message.author.id, message.author.username, map.entryFee);
      message.reply(`❌ ${result.error}`);
      return;
    }
    const durLabel = scavengeGame.DURATION_OPTIONS[durationMinutes]?.label || `${durationMinutes} phút`;

    message.reply(
      `${map.emoji} **${map.name}** — Bắt đầu lụm rác!\n` +
      `⏱️ Thời gian: ${durLabel}\n` +
      `🎒 Balo: 0/${result.session.maxSlots} ô\n` +
      `💸 Phí vào: \`${map.entryFee} ${CURRENCY_NAME}\`\n\n` +
      `Dùng \`!scavenge\` để lụm đồ, \`!scavenge balo\` xem balo, \`!scavenge buyslots\` mua thêm ô, \`!scavenge end\` kết thúc.`
    );
    return;
  }

  // ─── Storage / Kho ───
  if (command === '!kho' || command === '!storage') {
    const { initStorage, getStorage, getStorageItems, getStorageValue, sellItem, sellAllItems, getUserProfile, addPoints, upgradeStorage, applyUpgradeStorage } = require('./src/database');
    await initStorage(message.author.id);

    const sub = args[1]?.toLowerCase();

    // Sell all
    if (sub === 'sell' && args[2] === 'all') {
      const result = await sellAllItems(message.author.id);
      if (result.error) { message.reply(`❌ ${result.error}`); return; }
      await addPoints(message.author.id, message.author.username, result.total);
      message.reply(`💰 Đã bán **${result.count} món** được \`${result.total.toLocaleString()} ${CURRENCY_NAME}\`.`);
      return;
    }

    // Sell by ID
    if (sub === 'sell' && args[2]) {
      const itemId = parseInt(args[2]);
      if (isNaN(itemId)) { message.reply('❌ ID không hợp lệ. Dùng `!kho` xem danh sách ID.'); return; }
      const result = await sellItem(itemId, message.author.id);
      if (result.error) { message.reply(`❌ ${result.error}`); return; }
      await addPoints(message.author.id, message.author.username, result.value);
      message.reply(`💰 Đã bán món #${itemId} được \`${result.value.toLocaleString()} ${CURRENCY_NAME}\`.`);
      return;
    }

    // Upgrade
    if (sub === 'upgrade' || sub === 'nâng') {
      const info = await upgradeStorage(message.author.id);
      if (info.error) { message.reply(`❌ ${info.error}`); return; }
      const p = await getUserProfile(message.author.id);
      if (!p || p.points < info.cost) {
        message.reply(`❌ Cần \`${info.cost} ${CURRENCY_NAME}\` để nâng cấp (${info.capacity} → ${info.nextCapacity} ô). Bạn có \`${p?.points || 0}\`.`);
        return;
      }
      await addPoints(message.author.id, message.author.username, -info.cost);
      const result = await applyUpgradeStorage(message.author.id);
      if (result.error) { message.reply(`❌ ${result.error}`); return; }
      message.reply(`✅ Đã nâng cấp kho lên **${result.capacity} ô** (${info.cost} ${CURRENCY_NAME}).`);
      return;
    }

    // View storage
    const storage = await getStorage(message.author.id);
    const items = await getStorageItems(message.author.id);
    const soldItems = await getStorageItems(message.author.id, 1);
    const valueInfo = await getStorageValue(message.author.id);

    let msg = `📦 **KHO ĐỒ** — ${storage.capacity} ô (đã dùng ${items.length}/${storage.capacity})\n`;
    if (items.length > 0) {
      msg += `\n`;
      items.slice(0, 20).forEach((item, i) => {
        const tiers = { trash: '🗑️', common: '🟢', uncommon: '🔵', rare: '🟣', epic: '🟠', legendary: '🔴' };
        msg += `${i + 1}. #${item.id} ${tiers[item.tier] || '❓'} ${item.name} — \`${item.value.toLocaleString()}đ\`\n`;
      });
      if (items.length > 20) msg += `... và ${items.length - 20} món nữa\n`;
      msg += `\n💰 **Tổng giá trị kho:** \`${valueInfo.total.toLocaleString()} ${CURRENCY_NAME}\`\n`;
    } else {
      msg += `\nKho trống. Đi lụm rác để có đồ!\n`;
    }
    msg += `\n📋 **Các lệnh:**\n`;
    msg += `- \`!kho sell <id>\`: Bán 1 món\n`;
    msg += `- \`!kho sell all\`: Bán hết đồ\n`;
    msg += `- \`!kho upgrade\`: Nâng cấp kho (100→150: 5.000$, 150→200: 15.000$)\n`;
    if (soldItems.length > 0) msg += `\n📜 Đã bán: ${soldItems.length} món`;
    message.reply(msg);
    return;
  }

  // Suggestion for unknown commands
  if (command.startsWith('!')) {
    const knownCommands = [
      '!help', '!h', '!trogiup', '!start', '!play', '!game', '!stop', '!giveup',
      '!leaderboard', '!reward', '!qua', '!profile', '!me', '!bal', '!balance', '!deposit', '!withdraw',
      '!news', '!crypto', '!xang', '!coin', '!gold', '!loan', '!vay', '!payback', '!tra',
      '!scavenge', '!lụm', '!kho', '!storage', '!webhook', '!ask', '!hoi', '!saeed',
      '!remind', '!nhac', '!wiki', '!define', '!nghia', '!search', '!tim'
    ];
    
    // Check if it's a valid command
    if (knownCommands.includes(command)) return;

    // Check if it's a valid game command (over/under)
    if (command === '!over' || command === '!under') return;
    
    // Only suggest if it's not a game command (handled below) or a very short message
    if (command.length > 1) {
        message.reply('❓ Lệnh không hợp lệ. Gõ `!help` để xem danh sách các lệnh hỗ trợ!');
        return;
    }
  }

  // Delegate Active Game Logic
  const state = await getGameState(message.channel.id);
  
  if (!state || !state.is_active) return;

  if (state.game_type === 'over-under') {
    // Buttons are handled via InteractionCreate, not here
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
