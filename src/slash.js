const { getGameState, startGame, stopGame, getUserProfile, getTopPlayers, deposit, withdraw, takeLoan, payback, claimReward, subscribeNews, unsubscribeNews, addPoints, CURRENCY_NAME, CURRENCY_ICON } = require('./database');
const noituGame = require('./games/noitu');
const overUnderGame = require('./games/overUnder');
const dataStore = require('./data-store');
const scavengeGame = require('./scavenge');
const ai = require('./ai');
const lookup = require('./lookup');
const reminders = require('./reminders');
const terminalUI = require('./terminal-ui');

const NOITU_CHANNELS = ['1512801317586866186', '1512855412100300900'];
const BANK_CHANNEL = '1513092507804635136';
const OU_DEDICATED = ['1513076471797776435', '1513076573954117632', '1513076691839488030'];
const FINANCE_CHANNEL = '1513082616444616754';
const SCAVENGE_CATEGORY = '1513076471797776435'; // Adjust as needed

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const slashHandler = async (interaction, { turnTimers, clearTimer, setTimer }) => {
  const { commandName, options, channelId, user } = interaction;

  try {
    switch (commandName) {
      case 'terminal':
        await terminalUI.handleTerminalCommand(interaction);
        break;

      case 'help':
        await handleHelp(interaction);
        break;

      case 'noitu':
        await handleStart(interaction, 'noitu', { clearTimer });
        break;

      case 'taixiu':
        await handleStart(interaction, 'over-under', { clearTimer });
        break;

      case 'slot':
        await handleSlot(interaction);
        break;

      case 'start': {
        const gameType = options.getString('game') || options.getString('name'); // compatible with old and /game
        await handleStart(interaction, gameType, { clearTimer });
        break;
      }

      case 'stop':
        await handleStop(interaction, { clearTimer });
        break;

      case 'leaderboard':
        await handleLeaderboard(interaction);
        break;

      case 'reward':
        await handleReward(interaction);
        break;

      case 'profile':
        await handleProfile(interaction);
        break;

      case 'bal':
        await handleBalance(interaction);
        break;

      case 'deposit':
        await handleDeposit(interaction);
        break;

      case 'withdraw':
        await handleWithdraw(interaction);
        break;

      case 'loan':
        await handleLoan(interaction);
        break;

      case 'payback':
        await handlePayback(interaction);
        break;

      case 'news':
        await handleNews(interaction);
        break;

      case 'crypto':
        if (channelId !== FINANCE_CHANNEL) {
          await interaction.reply({ content: '❌ Lệnh này chỉ sử dụng được trong kênh Tài chính.', ephemeral: true });
          return;
        }
        await interaction.deferReply();
        await handleCrypto(interaction);
        break;

      case 'xang':
        if (channelId !== FINANCE_CHANNEL) {
          await interaction.reply({ content: '❌ Lệnh này chỉ sử dụng được trong kênh Tài chính.', ephemeral: true });
          return;
        }
        await interaction.deferReply();
        await handleXang(interaction);
        break;

      case 'tygia':
        if (channelId !== FINANCE_CHANNEL) {
          await interaction.reply({ content: '❌ Lệnh này chỉ sử dụng được trong kênh Tài chính.', ephemeral: true });
          return;
        }
        await interaction.deferReply();
        await handleTygia(interaction);
        break;

      case 'over':
        if (!OU_DEDICATED.includes(channelId)) {
          await interaction.reply({ content: '❌ Lệnh Tài Xỉu chỉ sử dụng được trong kênh chuyên dụng.', ephemeral: true });
          return;
        }
        await overUnderGame.handleSlashBet(interaction, '!over');
        break;

      case 'under':
        if (!OU_DEDICATED.includes(channelId)) {
          await interaction.reply({ content: '❌ Lệnh Tài Xỉu chỉ sử dụng được trong kênh chuyên dụng.', ephemeral: true });
          return;
        }
        await overUnderGame.handleSlashBet(interaction, '!under');
        break;

      case 'scavenge':
        await handleScavenge(interaction);
        break;

      case 'storage':
        await handleStorage(interaction);
        break;

      case 'webhook-status':
        await handleWebhookStatus(interaction);
        break;

      case 'ask':
        await handleAsk(interaction);
        break;

      case 'saeed':
        await handleSaeed(interaction);
        break;

      case 'remind':
        await handleRemind(interaction);
        break;

      case 'wiki':
        await handleWiki(interaction);
        break;

      case 'define':
        await handleDefine(interaction);
        break;

      case 'search':
        await handleSearch(interaction);
        break;

      case 'gold':
        if (channelId !== FINANCE_CHANNEL) {
          await interaction.reply({ content: '❌ Lệnh này chỉ sử dụng được trong kênh Tài chính.', ephemeral: true });
          return;
        }
        await interaction.deferReply();
        await handleGold(interaction);
        break;
    }
  } catch (err) {
    console.error(`Slash command ${commandName} error:`, err.message);
    if (interaction.replied || interaction.deferred) {
      try { await interaction.editReply('❌ Đã xảy ra lỗi khi xử lý lệnh.'); } catch (_) {}
    } else {
      try { await interaction.reply('❌ Đã xảy ra lỗi khi xử lý lệnh.'); } catch (_) {}
    }
  }
};

async function handleHelp(interaction) {
  const helpMsg =
    `📖 **DANH SÁCH LỆNH CỦA BOT**\n\n` +
    `🎮 **Trò Chơi:**\n` +
    `- \`/noitu\`: Bắt đầu chơi Nối Từ.\n` +
    `- \`/taixiu\`: Bắt đầu chơi Tài Xỉu.\n` +
    `- \`/slot <cược>\`: Quay máy Slot Machine.\n` +
    `- \`/stop\`: Dừng trò chơi hiện tại.\n\n` +
    `💰 **Kinh Tế & Cá Nhân:**\n` +
    `- \`/reward\`: Nhận quà điểm miễn phí mỗi 4 giờ.\n` +
    `- \`/profile\`: Xem số dư và hồ sơ cá nhân.\n` +
    `- \`/leaderboard\`: Xem bảng xếp hạng đại gia.\n` +
    `- \`/deposit <số tiền>\`: Gửi tiền vào ngân hàng.\n` +
    `- \`/withdraw <số tiền>\`: Rút tiền từ ngân hàng.\n` +
    `- \`/loan <số tiền>\`: Vay tiền (tối đa 5000).\n` +
    `- \`/payback <số tiền/all>\`: Trả nợ.\n\n` +
    `🤖 **Trợ Lý Ảo & Tiện Ích:**\n` +
    `- \`/ask <câu hỏi>\`: Hỏi trợ lý AI bất kỳ điều gì.\n` +
    `- \`/saeed <nội dung>\`: Trò chuyện với Saeed Ziaten (Fiery Owl).\n` +
    `- \`/remind <time> <message>\`: Đặt nhắc nhở (VD: \`30m\`, \`1h\`, \`14:30\`).\n` +
    `- \`/wiki <từ khóa>\`: Tra cứu Wikipedia.\n` +
    `- \`/define <từ>\`: Tra từ điển tiếng Anh.\n` +
    `- \`/search <từ khóa>\`: Tìm kiếm thông tin trên web.\n\n` +
    `📊 **Tin Tức & Thị Trường:**\n` +
    `- \`/news status:on/off\`: Bật/tắt nhận tin tức.\n` +
    `- \`/crypto\`: Xem giá tiền điện tử.\n` +
    `- \`/gold\`: Xem giá vàng các loại.\n` +
    `- \`/xang\`: Xem giá xăng dầu Petrolimex.\n` +
    `- \`/tygia\`: Xem tỷ giá ngoại tệ.\n` +
    `- \`/webhook-status\`: Xem trạng thái webhook còn sống hay chết.\n\n` +
    `🎒 **Lụm Rác Delta Force:**\n` +
    `- \`/scavenge start map:<map>\`: Vào map lụm rác (5 phút, balo 20 ô).\n` +
    `- \`/scavenge loot\`: Lụm món đồ tiếp theo.\n` +
    `- \`/scavenge backpack\`: Xem balo.\n` +
    `- \`/scavenge end\`: Kết thúc, đồ vào kho.\n\n` +
    `💡 *Mẹo: Slash commands có gợi ý tự động, gõ \`/\` để bắt đầu!*`;
  await interaction.reply(helpMsg);
}

async function handleStart(interaction, gameType, { clearTimer }) {
  if (gameType === 'noitu') {
    if (!NOITU_CHANNELS.includes(interaction.channelId)) {
      await interaction.reply({ content: '❌ Trò chơi Nối Từ chỉ được phép chơi trong kênh chuyên dụng.', ephemeral: true });
      return;
    }
    await startGame(interaction.channelId, 'noitu');
    clearTimer(interaction.channelId);
    await interaction.reply('🎮 Trò chơi Nối Từ đã bắt đầu! Hãy nhập từ đầu tiên.');
  } else if (gameType === 'over-under' || gameType === 'taixiu') {
    if (!OU_DEDICATED.includes(interaction.channelId)) {
      await interaction.reply({ content: '❌ Trò chơi Tài Xỉu chỉ được phép chơi trong kênh chuyên dụng.', ephemeral: true });
      return;
    }
    await startGame(interaction.channelId, 'over-under');
    clearTimer(interaction.channelId);
    const disclaimer =
      `💰 **Bắt đầu cá cược, chúc ông chủ may mắn!**\n\n` +
      `⚠️ **TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM (DISCLAIMER):**\n` +
      `1. Trò chơi chỉ mang tính chất **giải trí thuần túy** trên nền tảng Discord.\n` +
      `2. Tiền trong game (${CURRENCY_NAME}) là **tiền ảo**, không có giá trị quy đổi thành tiền thật, thẻ cào, hay bất kỳ hiện vật nào có giá trị.\n` +
      `3. Hệ thống **không cổ xúy, không tổ chức cờ bạc** trái phép.\n` +
      `4. Người chơi tự chịu trách nhiệm về hành vi. Hãy chơi game văn minh.\n\n` +
      `🎮 **Cách chơi:** Gõ \`/over <số điểm>\` hoặc \`/under <số điểm>\` để đặt cược.\n` +
      `🖲️ Hoặc bấm nút bên dưới để đặt nhanh.`;
    const overUnder = require('./games/overUnder');
    await interaction.reply({ content: disclaimer, components: overUnder.getBetButtons() });
  } else {
    await interaction.reply({ content: '❌ Trò chơi không hợp lệ.', ephemeral: true });
  }
}

async function handleStop(interaction, { clearTimer }) {
  await stopGame(interaction.channelId);
  clearTimer(interaction.channelId);
  await interaction.reply('🏳️ Trò chơi đã kết thúc.');
}

function getSlotResponse(username, userId, result, win, multiplier, title, color, bet, currentPoints) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setDescription(
      `👤 Người chơi: **${username}**\n` +
      `🎰 Kết quả: **[ ${result.join(' | ')} ]**\n\n` +
      (multiplier > 0 
        ? `🎉 Bạn trúng **x${multiplier}** và nhận được \`${win.toLocaleString()} ${CURRENCY_NAME}\`!` 
        : `😞 Bạn đã mất \`${bet.toLocaleString()} ${CURRENCY_NAME}\`.`) +
      `\n💰 Số dư hiện tại: \`${currentPoints.toLocaleString()} ${CURRENCY_NAME}\``
    )
    .setThumbnail(CURRENCY_ICON)
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`slot_spin_${bet}`)
        .setLabel('Quay tiếp 🎰')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [row] };
}

async function handleSlot(interaction) {
  const bet = interaction.options.getInteger('bet');
  if (bet < 100 || bet % 100 !== 0) {
    await interaction.reply({ content: `❌ Mức cược tối thiểu là 100 ${CURRENCY_NAME} và phải là bội số của 100.`, ephemeral: true });
    return;
  }
  
  const p = await getUserProfile(interaction.user.id);
  if (!p || p.points < bet) {
    await interaction.reply({ content: `❌ Bạn không đủ tiền mặt để chơi. (Hiện có: ${p ? p.points : 0} ${CURRENCY_NAME})`, ephemeral: true });
    return;
  }

  const slotGame = require('./games/slot');
  const { result, win, multiplier, title, color } = slotGame.play(bet);
  
  await addPoints(interaction.user.id, interaction.user.username, win - bet);
  const newPoints = p.points + win - bet;

  const response = getSlotResponse(interaction.user.username, interaction.user.id, result, win, multiplier, title, color, bet, newPoints);
  await interaction.reply(response);
}

async function handleSlotInteraction(interaction, data) {
  if (data.startsWith('spin_')) {
    const bet = parseInt(data.replace('spin_', ''));
    if (isNaN(bet)) return;

    const p = await getUserProfile(interaction.user.id);
    if (!p || p.points < bet) {
      await interaction.reply({ content: `❌ Bạn không đủ tiền mặt để tiếp tục quay mức cược này. (Hiện có: ${p ? p.points : 0} ${CURRENCY_NAME})`, ephemeral: true });
      return;
    }

    const slotGame = require('./games/slot');
    const { result, win, multiplier, title, color } = slotGame.play(bet);
    
    await addPoints(interaction.user.id, interaction.user.username, win - bet);
    const newPoints = p.points + win - bet;

    const response = getSlotResponse(interaction.user.username, interaction.user.id, result, win, multiplier, title, color, bet, newPoints);
    await interaction.update(response);
  }
}

async function handleLeaderboard(interaction) {
  const top = await getTopPlayers();
  let reply = `🏆 **BẢNG XẾP HẠNG ĐẠI GIA**\n\n`;
  top.forEach((p, i) => {
    reply += `${i + 1}. **${p.username}**: \`${p.points.toLocaleString()}\` ${CURRENCY_NAME}\n`;
  });
  await interaction.reply(reply);
}

async function handleReward(interaction) {
  const REWARD_COOLDOWN = 14400000;
  const p = await getUserProfile(interaction.user.id);
  const now = Date.now();

  if (p && now - p.last_reward_at < REWARD_COOLDOWN) {
    const remainingMs = REWARD_COOLDOWN - (now - p.last_reward_at);
    const hours = Math.floor(remainingMs / 3600000);
    const minutes = Math.floor((remainingMs % 3600000) / 60000);
    await interaction.reply({ content: `⏳ Bạn đã nhận quà rồi. Hãy quay lại sau \`${hours}h ${minutes}m\`.`, ephemeral: true });
    return;
  }

  const randomAmount = (Math.floor(Math.random() * 10) + 1) * 100;
  await claimReward(interaction.user.id, interaction.user.username, randomAmount);

  const giftMessages = [
    `🎁 Bạn mở hộp quà và thấy \`${randomAmount} ${CURRENCY_NAME}\`!`,
    `💰 Một đại gia đi ngang qua và đánh rơi \`${randomAmount} ${CURRENCY_NAME}\` vào túi bạn!`,
    `🍀 Hôm nay bạn thật may mắn, nhận ngay \`${randomAmount} ${CURRENCY_NAME}\`!`,
    `🏦 Ngân hàng trung ương phát chẩn cho bạn \`${randomAmount} ${CURRENCY_NAME}\`!`
  ];
  const randomMsg = giftMessages[Math.floor(Math.random() * giftMessages.length)] +
    ` (Dùng \`/profile\` để xem ví) ${CURRENCY_ICON}`;
  await interaction.reply(randomMsg);
}

async function handleProfile(interaction) {
  const p = await getUserProfile(interaction.user.id);
  if (!p) {
    await interaction.reply({ content: '👤 Bạn chưa có dữ liệu. Hãy tham gia game để bắt đầu!', ephemeral: true });
    return;
  }
  const reply = `👤 **Hồ sơ của ${interaction.user.username}**\n` +
    `💵 Tiền mặt: \`${p.points.toLocaleString()} ${CURRENCY_NAME}\`\n` +
    `🏦 Ngân hàng: \`${p.bank.toLocaleString()} ${CURRENCY_NAME}\`\n` +
    `💸 Đang nợ: \`${p.loan.toLocaleString()} ${CURRENCY_NAME}\`\n` +
    `--- ${CURRENCY_ICON}`;
  await interaction.reply(reply);
}

async function handleBalance(interaction) {
  const p = await getUserProfile(interaction.user.id);
  if (!p) {
    await interaction.reply({ content: '👤 Bạn chưa có dữ liệu. Hãy tham gia game để bắt đầu!', ephemeral: true });
    return;
  }
  await interaction.reply(`💰 **Số dư của ${interaction.user.username}**\n💵 Tiền mặt: \`${p.points.toLocaleString()} ${CURRENCY_NAME}\`\n🏦 Ngân hàng: \`${p.bank.toLocaleString()} ${CURRENCY_NAME}\``);
}

async function handleDeposit(interaction) {
  if (interaction.channelId !== BANK_CHANNEL) {
    await interaction.reply({ content: '❌ Lệnh này chỉ được sử dụng trong kênh Ngân hàng.', ephemeral: true });
    return;
  }
  const amount = interaction.options.getInteger('amount');
  if (amount < 100 || amount % 100 !== 0) {
    await interaction.reply({ content: `❌ Số tiền gửi phải là bội số của 100 ${CURRENCY_NAME}.`, ephemeral: true });
    return;
  }
  const p = await getUserProfile(interaction.user.id);
  if (!p || p.points < amount) {
    await interaction.reply({ content: '❌ Bạn không đủ tiền mặt để gửi.', ephemeral: true });
    return;
  }
  await deposit(interaction.user.id, amount);
  await interaction.reply(`✅ Đã gửi \`${amount.toLocaleString()} ${CURRENCY_NAME}\` vào ngân hàng.`);
}

async function handleWithdraw(interaction) {
  if (interaction.channelId !== BANK_CHANNEL) {
    await interaction.reply({ content: '❌ Lệnh này chỉ được sử dụng trong kênh Ngân hàng.', ephemeral: true });
    return;
  }
  const amount = interaction.options.getInteger('amount');
  if (amount < 100 || amount % 100 !== 0) {
    await interaction.reply({ content: `❌ Số tiền rút phải là bội số của 100 ${CURRENCY_NAME}.`, ephemeral: true });
    return;
  }
  const p = await getUserProfile(interaction.user.id);
  if (!p || p.bank < amount) {
    await interaction.reply({ content: '❌ Bạn không đủ tiền trong ngân hàng để rút.', ephemeral: true });
    return;
  }
  await withdraw(interaction.user.id, amount);
  await interaction.reply(`✅ Đã rút \`${amount.toLocaleString()} ${CURRENCY_NAME}\` về tiền mặt.`);
}

async function handleLoan(interaction) {
  if (interaction.channelId !== BANK_CHANNEL) {
    await interaction.reply({ content: '❌ Lệnh này chỉ được sử dụng trong kênh Ngân hàng.', ephemeral: true });
    return;
  }
  const amount = interaction.options.getInteger('amount');
  const LOAN_LIMIT = 5000;
  const LOAN_COOLDOWN = 3600000;

  if (amount < 100 || amount % 100 !== 0 || amount > LOAN_LIMIT) {
    await interaction.reply({ content: `❌ Bạn có thể vay từ 100 đến \`${LOAN_LIMIT.toLocaleString()} ${CURRENCY_NAME}\` (bội số của 100).`, ephemeral: true });
    return;
  }

  const p = await getUserProfile(interaction.user.id);
  const now = Date.now();

  if (p) {
    if (p.loan > 0) {
      await interaction.reply({ content: `❌ Bạn vẫn còn nợ \`${p.loan.toLocaleString()} ${CURRENCY_NAME}\`. Hãy trả hết trước khi vay thêm.`, ephemeral: true });
      return;
    }
    if (now - p.last_loan_at < LOAN_COOLDOWN) {
      const remaining = Math.ceil((LOAN_COOLDOWN - (now - p.last_loan_at)) / 60000);
      await interaction.reply({ content: `❌ Bạn vừa vay xong. Hãy đợi thêm \`${remaining}\` phút nữa.`, ephemeral: true });
      return;
    }
  }

  await takeLoan(interaction.user.id, interaction.user.username, amount);
  await interaction.reply(`💸 Bạn đã vay thành công \`${amount.toLocaleString()} ${CURRENCY_NAME}\`. Nhớ trả nợ sớm!`);
}

async function handlePayback(interaction) {
  if (interaction.channelId !== BANK_CHANNEL) {
    await interaction.reply({ content: '❌ Lệnh này chỉ được sử dụng trong kênh Ngân hàng.', ephemeral: true });
    return;
  }
  const p = await getUserProfile(interaction.user.id);
  if (!p || p.loan <= 0) {
    await interaction.reply({ content: '❌ Bạn không có khoản nợ nào cần trả.', ephemeral: true });
    return;
  }

  const amountStr = interaction.options.getString('amount');
  const amount = amountStr === 'all' ? p.loan : parseInt(amountStr);
  if (isNaN(amount) || amount < 100 || (amount % 100 !== 0 && amount !== p.loan)) {
    await interaction.reply({ content: `❌ Số tiền trả phải là bội số của 100 ${CURRENCY_NAME} hoặc "all".`, ephemeral: true });
    return;
  }
  if (p.points < amount) {
    await interaction.reply({ content: '❌ Bạn không đủ tiền mặt để trả nợ.', ephemeral: true });
    return;
  }
  const actualPay = Math.min(amount, p.loan);
  await payback(interaction.user.id, actualPay);
  await interaction.reply(`✅ Bạn đã trả \`${actualPay.toLocaleString()} ${CURRENCY_NAME}\`. Nợ còn lại: \`${(p.loan - actualPay).toLocaleString()} ${CURRENCY_NAME}\`.`);
}

async function handleNews(interaction) {
  const status = interaction.options.getString('status');
  if (status === 'on') {
    await subscribeNews(interaction.channelId);
    await interaction.reply('🔔 Đã đăng ký nhận tin tức hàng giờ tại kênh này!');
  } else {
    await unsubscribeNews(interaction.channelId);
    await interaction.reply('🔕 Đã hủy đăng ký nhận tin tức tại kênh này.');
  }
}

async function handleCrypto(interaction) {
  const { content, updatedAt, change } = dataStore.getCrypto();
  if (!content) {
    await interaction.editReply('⏳ Chưa có dữ liệu crypto. Hãy đợi webhook cập nhật.');
    return;
  }
  await interaction.editReply(`${content}${change}\n⏰ *Cập nhật: ${updatedAt.toLocaleString('vi-VN')}*`);
}

async function handleXang(interaction) {
  const { content, updatedAt, change } = dataStore.getFuel();
  if (!content) {
    await interaction.editReply('⏳ Chưa có dữ liệu giá xăng. Hãy đợi webhook cập nhật.');
    return;
  }
  await interaction.editReply(`${content}${change}\n⏰ *Cập nhật: ${updatedAt.toLocaleString('vi-VN')}*`);
}

async function handleTygia(interaction) {
  const { content, updatedAt, change } = dataStore.getExchange();
  if (!content) {
    await interaction.editReply('⏳ Chưa có dữ liệu tỷ giá. Hãy đợi webhook cập nhật.');
    return;
  }
  await interaction.editReply(`${content}${change}\n⏰ *Cập nhật: ${updatedAt.toLocaleString('vi-VN')}*`);
}

async function handleScavenge(interaction) {
  if (interaction.channel?.parentId !== SCAVENGE_CATEGORY) {
    await interaction.reply({ content: '❌ Lệnh này chỉ sử dụng được trong khu vực Scavenger.', ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();
  const isEphemeral = sub !== 'start';
  await interaction.deferReply({ ephemeral: isEphemeral });

  if (sub === 'start') {
    const mapId = interaction.options.getString('map');
    const timeOpt = interaction.options.getInteger('time') || 5;
    const map = scavengeGame.MAPS[mapId];
    if (!map) {
      await interaction.editReply({ content: `❌ Map không tồn tại.` });
      return;
    }

    const p = await getUserProfile(interaction.user.id);
    if (!p || p.points < map.entryFee) {
      await interaction.editReply({ content: `❌ Bạn cần \`${map.entryFee.toLocaleString()} ${CURRENCY_NAME}\` để vào ${map.name}. Bạn có \`${(p?.points || 0).toLocaleString()}\`.` });
      return;
    }

    await addPoints(interaction.user.id, interaction.user.username, -map.entryFee);

    let sessionMsg = null;
    const onAutoLoot = (data) => {
      if (data.full) {
        interaction.editReply({ content:
          `${map.emoji} **${map.name}** — Balo đã đầy!\n` +
          `🎒 **${data.used}/${data.maxSlots} ô** — Không thể loot thêm.\n` +
          `Dùng \`/scavenge end\` để kết thúc.`
        }).catch(() => {});
        return;
      }
      const item = data.item;
      const rareTag = item.rareEmoji ? ` ${item.rareEmoji} ${item.rareLabel}` : '';
      sessionMsg = `${map.emoji} **${map.name}** — Đang lụm rác...\n` +
        `🆕 ${item.emoji} **${item.name}**${rareTag}\n` +
        `└ ${item.rarityName} (${item.rarityColor}) | ${item.slots}ô | \`${item.value.toLocaleString()} ${CURRENCY_NAME}\`\n` +
        `🎒 **${data.used}/${data.maxSlots} ô** ⏱️ Còn ${data.timeLeft}s\n` +
        `_Bot đang auto-loot... Dùng \`/scavenge backpack\` để xem balo._`;
      interaction.editReply({ content: sessionMsg }).catch(() => {});
    };

    const result = await scavengeGame.startSession(interaction.user.id, interaction.user.username, mapId, timeOpt, { onLoot: onAutoLoot });
    if (result.error) {
      await addPoints(interaction.user.id, interaction.user.username, map.entryFee);
      await interaction.editReply({ content: `❌ ${result.error}` });
      return;
    }
    const durLabel = scavengeGame.DURATION_OPTIONS[timeOpt]?.label || `${timeOpt} phút`;

    let lootMsg = '';
    if (result.firstLoot && !result.firstLoot.error) {
      const item = result.firstLoot.item;
      lootMsg = `\n${item.rareEmoji} **${item.name}** ${item.rareLabel}\n└ ${item.emoji} ${item.rarityName} (${item.rarityColor}) | ${item.slots}ô | \`${item.value.toLocaleString()} ${CURRENCY_NAME}\`\n`;
    }

    sessionMsg = `${map.emoji} **${map.name}** — Bắt đầu lụm rác!\n` +
      `⏱️ Thời gian: ${durLabel}\n` +
      `🎒 Balo: 0/${result.session.maxSlots} ô\n` +
      `💸 Phí vào: \`${map.entryFee.toLocaleString()} ${CURRENCY_NAME}\`\n` +
      `${lootMsg}` +
      `_Bot đang auto-loot... Dùng \`/scavenge backpack\` để xem balo._`;
    await interaction.editReply({ content: sessionMsg });
    return;
  }

  if (sub === 'loot') {
    const result = await scavengeGame.loot(interaction.user.id);
    if (result.error) {
      await interaction.editReply({ content: `❌ ${result.error}` });
      return;
    }

    if (result.died) {
      await interaction.editReply({ content:
        `💀 **Bạn đã bị giết bởi ${result.enemy.emoji} ${result.enemy.name}**\n` +
        `${result.enemy.desc} đã hạ gục bạn khi đang lục đồ ở **${result.mapEmoji} ${result.mapName}**\n` +
        `📦 Mất **${result.itemCount} món** (trị giá \`${result.lostValue.toLocaleString()} ${CURRENCY_NAME}\`)\n` +
        `🏳️ Tất cả đồ đã rơi hết. Xin vui lòng đợi hồi sinh!`,
      });
      return;
    }

    const rareLabel = result.item.rareLabel ? ` ${result.item.rareLabel}` : '';
    await interaction.editReply({ content:
      `${result.item.emoji} **${result.item.name}**${rareLabel}\n` +
      `${result.item.emoji} ${result.item.rarityName} (${result.item.rarityColor}) | 📦 ${result.item.slots}ô | 💵 \`${result.item.value.toLocaleString()} ${CURRENCY_NAME}\`\n` +
      `🎒 Balo: ${result.used + result.item.slots}/${result.maxSlots} ô ⏱️ Còn ${result.timeLeft}s\n` +
      `_Bot đang auto-loot mỗi 12 giây..._`,
    });
    return;
  }

  if (sub === 'buyslots') {
    const numSlots = interaction.options.getInteger('số_lượng');
    const buyInfo = scavengeGame.buyBackpackSlots(interaction.user.id, numSlots);
    if (buyInfo.error) {
      await interaction.editReply({ content: `❌ ${buyInfo.error}` });
      return;
    }
    const p = await getUserProfile(interaction.user.id);
    if (!p || p.points < buyInfo.cost) {
      await interaction.editReply({ content: `❌ Cần \`${buyInfo.cost.toLocaleString()} ${CURRENCY_NAME}\` để mua thêm ${numSlots} ô (${buyInfo.currentMax} → ${buyInfo.newMax}). Bạn có \`${(p?.points || 0).toLocaleString()}\`.` });
      return;
    }
    await addPoints(interaction.user.id, interaction.user.username, -buyInfo.cost);
    const result = scavengeGame.applyBackpackUpgrade(interaction.user.id, numSlots);
    if (result.error) {
      await addPoints(interaction.user.id, interaction.user.username, buyInfo.cost);
      await interaction.editReply({ content: `❌ ${result.error}` });
      return;
    }
    await interaction.editReply({ content: `✅ Đã mua **+${numSlots} ô balo** (${buyInfo.currentMax} → ${result.maxSlots}) — \`${buyInfo.cost.toLocaleString()} ${CURRENCY_NAME}\`` });
    return;
  }

  if (sub === 'backpack') {
    const bp = scavengeGame.getBackpack(interaction.user.id);
    if (!bp) {
      await interaction.editReply({ content: '🎒 Bạn chưa vào map nào. Dùng `/scavenge start` để bắt đầu.' });
      return;
    }

    if (bp.items.length === 0) {
      await interaction.editReply({ content: `🎒 **${bp.mapEmoji} ${bp.mapName}** — Balo trống (0/${bp.maxSlots} ô) ⏱️ Còn ${bp.timeLeft}s\n_Bot đang auto-loot..._` });
      return;
    }

    let msg = `🎒 **${bp.mapEmoji} ${bp.mapName} — Balo** (${bp.used}/${bp.maxSlots} ô) ⏱️ Còn ${bp.timeLeft}s\n\n`;
    let total = 0;
    bp.items.forEach((item, i) => {
      const rareTag = item.rareEmoji || '';
      msg += `${i + 1}. ${item.emoji} ${item.name} ${rareTag}\n└ ${item.rarityName}(${item.rarityColor}) | ${item.slots}ô | \`${item.value.toLocaleString()}đ\`\n`;
      total += item.value;
    });
    msg += `\n💵 **Tổng giá trị:** \`${total.toLocaleString()} ${CURRENCY_NAME}\``;
    await interaction.editReply({ content: msg });
    return;
  }

  if (sub === 'end') {
    const result = await scavengeGame.endSession(interaction.user.id);
    if (result.error) {
      await interaction.editReply({ content: `❌ ${result.error}` });
      return;
    }

    let msg = `${result.mapEmoji} **${result.mapName} — Kết thúc lụm rác**\n\n`;
    if (result.itemCount === 0) {
      msg += `Bạn không lụm được gì cả.\n`;
    } else {
      result.backpack.forEach((item, i) => {
        msg += `${i + 1}. ${item.emoji} ${item.name} — ${item.rarityName}(${item.rarityColor}) \`${item.value.toLocaleString()}đ\`\n`;
      });
    }
    msg += `\n📦 **Đã cất ${result.stored}/${result.itemCount} món vào kho**\n`;
    if (result.full) msg += `⚠️ Kho đầy! Một số món đã bị bỏ lại.\n`;
    msg += `⏱️ ${Math.floor(result.duration / 60)}p${result.duration % 60}s\n`;
    msg += `💡 Dùng \`/storage\` để xem kho và bán đồ.`;
    await interaction.editReply({ content: msg });
    return;
  }
}

async function handleStorage(interaction) {
  const { initStorage, getStorage, getStorageItems, getStorageValue, sellItem, sellAllItems, getUserProfile, addPoints, upgradeStorage, applyUpgradeStorage } = require('./database');
  await initStorage(interaction.user.id);

  const sub = interaction.options.getSubcommand();

  if (sub === 'upgrade') {
    const info = await upgradeStorage(interaction.user.id);
    if (info.error) { await interaction.reply({ content: `❌ ${info.error}`, ephemeral: true }); return; }
    const p = await getUserProfile(interaction.user.id);
    if (!p || p.points < info.cost) {
      await interaction.reply({ content: `❌ Cần \`${info.cost.toLocaleString()} ${CURRENCY_NAME}\` để nâng cấp (${info.capacity} → ${info.nextCapacity} ô). Bạn có \`${(p?.points || 0).toLocaleString()}\`.`, ephemeral: true });
      return;
    }
    await addPoints(interaction.user.id, interaction.user.username, -info.cost);
    const result = await applyUpgradeStorage(interaction.user.id);
    if (result.error) { await interaction.reply({ content: `❌ ${result.error}`, ephemeral: true }); return; }
    await interaction.reply({ content: `✅ Đã nâng cấp kho lên **${result.capacity} ô** (${info.cost.toLocaleString()} ${CURRENCY_NAME}).`, ephemeral: true });
    return;
  }

  if (sub === 'sell') {
    const itemOpt = interaction.options.getString('item');
    if (itemOpt === 'all') {
      const result = await sellAllItems(interaction.user.id);
      if (result.error) { await interaction.reply({ content: `❌ ${result.error}`, ephemeral: true }); return; }
      await addPoints(interaction.user.id, interaction.user.username, result.total);
      await interaction.reply({ content: `💰 Đã bán **${result.count} món** được \`${result.total.toLocaleString()} ${CURRENCY_NAME}\`.`, ephemeral: true });
      return;
    }
    const itemId = parseInt(itemOpt);
    if (isNaN(itemId)) { await interaction.reply({ content: '❌ ID không hợp lệ. Dùng `/storage view` xem ID.', ephemeral: true }); return; }
    const result = await sellItem(itemId, interaction.user.id);
    if (result.error) { await interaction.reply({ content: `❌ ${result.error}`, ephemeral: true }); return; }
    await addPoints(interaction.user.id, interaction.user.username, result.value);
    await interaction.reply({ content: `💰 Đã bán món #${itemId} được \`${result.value.toLocaleString()} ${CURRENCY_NAME}\`.`, ephemeral: true });
    return;
  }

  // view
  const storage = await getStorage(interaction.user.id);
  const items = await getStorageItems(interaction.user.id);
  const soldItems = await getStorageItems(interaction.user.id, 1);
  const valueInfo = await getStorageValue(interaction.user.id);

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
  msg += `- \`/storage sell <id | all>\`: Bán 1 món hoặc tất cả\n`;
  msg += `- \`/storage upgrade\`: Nâng cấp kho (100→150: 5.000$, 150→200: 15.000$)`;
  if (soldItems.length > 0) msg += `\n📜 Đã bán: ${soldItems.length} món`;
  await interaction.reply({ content: msg, ephemeral: true });
}

async function handleGold(interaction) {
  const { content, updatedAt, change } = dataStore.getGold();
  if (!content) {
    await interaction.editReply('⏳ Chưa có dữ liệu giá vàng. Hãy đợi webhook cập nhật.');
    return;
  }
  await interaction.editReply(`${content}${change}\n⏰ *Cập nhật: ${updatedAt.toLocaleString('vi-VN')}*`);
}

async function handleWebhookStatus(interaction) {
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
  await interaction.reply(msg);
}

async function handleAsk(interaction) {
  await interaction.deferReply();
  const question = interaction.options.getString('question');
  const response = await ai.askAI(interaction.user.id, question);
  const maxLen = 1900;
  if (response.length > maxLen) {
    await interaction.editReply(response.slice(0, maxLen) + '...');
  } else {
    await interaction.editReply(response);
  }
}

async function handleSaeed(interaction) {
  await interaction.deferReply();
  const question = interaction.options.getString('noidung');
  const response = await ai.askAI(interaction.user.id, question);
  const maxLen = 1900;
  if (response.length > maxLen) {
    await interaction.editReply(response.slice(0, maxLen) + '...');
  } else {
    await interaction.editReply(response);
  }
}

async function handleRemind(interaction) {
  const time = interaction.options.getString('time');
  const message = interaction.options.getString('message');
  const result = await reminders.setReminder(interaction.user.id, interaction.channelId, time, message);
  if (result.error) {
    await interaction.reply({ content: result.error, ephemeral: true });
    return;
  }
  await interaction.reply(`⏰ Đã đặt nhắc nhở sau **${result.display}**: ${message}`);
}

async function handleWiki(interaction) {
  await interaction.deferReply();
  const query = interaction.options.getString('query');
  const result = await lookup.wiki(query);
  await interaction.editReply(result);
}

async function handleDefine(interaction) {
  await interaction.deferReply();
  const word = interaction.options.getString('word');
  const result = await lookup.define(word);
  await interaction.editReply(result);
}

async function handleSearch(interaction) {
  await interaction.deferReply();
  const query = interaction.options.getString('query');
  const result = await lookup.search(query);
  await interaction.editReply(result);
}

module.exports = {
  slashHandler,
  handleSlotInteraction
};
