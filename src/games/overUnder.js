const { hasEnoughPoints, getUserProfile, addPoints, CURRENCY_NAME } = require('../database');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const rollDice = () => {
  const dice = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];
  const total = dice.reduce((a, b) => a + b, 0);
  const result = total >= 11 ? 'over' : 'under';
  return { dice, total, result };
};

const userBets = new Map();
const DEFAULT_BET = 1000;

function getUserBet(userId, channelId) {
  const key = `${userId}:${channelId}`;
  return userBets.get(key) || DEFAULT_BET;
}

function setUserBet(userId, channelId, amount) {
  const key = `${userId}:${channelId}`;
  userBets.set(key, amount);
}

const BET_AMOUNTS = [1000, 10000, 100000];

function getBetButtons() {
  return BET_AMOUNTS.map(amount =>
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`over-under_over_${amount}`)
          .setLabel(`🎲 Tài ${amount.toLocaleString()}`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`over-under_under_${amount}`)
          .setLabel(`🎲 Xỉu ${amount.toLocaleString()}`)
          .setStyle(ButtonStyle.Danger),
      )
  );
}

async function processBet(interactionOrUserId, betAmount, command, channelId, isInteraction = false) {
  const userId = isInteraction ? interactionOrUserId.user.id : interactionOrUserId.id;
  const username = isInteraction ? interactionOrUserId.user.username : interactionOrUserId.author.username;
  const reply = isInteraction
    ? (msg, ephemeral) => interactionOrUserId.reply({ content: msg, ephemeral: ephemeral || false })
    : (msg) => interactionOrUserId.reply(msg);
  const editReply = isInteraction
    ? (msg) => interactionOrUserId.editReply({ content: msg, components: getBetButtons() })
    : async (msg) => {
        const m = await interactionOrUserId.reply('🎲 Đang lắc xí ngầu...');
        await m.edit({ content: msg, components: getBetButtons() });
      };

  setUserBet(userId, channelId, betAmount);

  const enough = await hasEnoughPoints(userId, betAmount);
  if (!enough && betAmount > 0) {
    const p = await getUserProfile(userId);
    if (!p || (p.points === 0 && p.bank === 0 && p.loan === 0)) {
      await addPoints(userId, username, 1000);
      await reply(`🎁 Bạn nhận được 1000 ${CURRENCY_NAME} khởi nghiệp! Hãy thử lại.`);
      return;
    }
    await reply(`❌ Bạn không đủ tiền mặt (Hiện có: ${p ? p.points : 0} ${CURRENCY_NAME}). Dùng \`/withdraw\` để rút tiền hoặc \`/loan\` để vay.`);
    return;
  }

  await reply('🎲 Đang lắc xí ngầu...');
  await new Promise(resolve => setTimeout(resolve, 800));

  const { dice, total, result } = rollDice();
  const isWin = (command === '!over' && result === 'over') || (command === '!under' && result === 'under');

  const diceEmojis = dice.map(d => {
    const emojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return emojis[d - 1];
  }).join(' ');

  if (isWin) {
    await addPoints(userId, username, betAmount);
    await editReply(`🎲 Kết quả: **${diceEmojis}** = **${total}** (**${result.toUpperCase()}**)\n✅ Chúc mừng! Bạn đã thắng **${betAmount} ${CURRENCY_NAME}**.`);
  } else {
    await addPoints(userId, username, -betAmount);
    await editReply(`🎲 Kết quả: **${diceEmojis}** = **${total}** (**${result.toUpperCase()}**)\n❌ Rất tiếc! Bạn đã thua **${betAmount} ${CURRENCY_NAME}**.`);
  }
}

module.exports = {
  handleMessage: async (message, state, command, args) => {
    if (command === '!over' || command === '!under') {
      const bet = parseInt(args[1]);
      if (isNaN(bet) || bet < 100 || bet > 100000 || bet % 100 !== 0) {
        message.reply(`❌ Mức cược từ 100 đến 100,000 ${CURRENCY_NAME} và phải là bội số của 100.`);
        return true;
      }

      await processBet(message, bet, command, message.channel.id, false);
      return true;
    }
    return false;
  },

  handleInteraction: async (interaction, data) => {
    const userId = interaction.user.id;
    const channelId = interaction.channelId;
    const [action, amountStr] = data.split('_');
    const betAmount = parseInt(amountStr) || getUserBet(userId, channelId);
    const command = action === 'over' ? '!over' : '!under';

    const enough = await hasEnoughPoints(userId, betAmount);
    if (!enough && betAmount > 0) {
      const p = await getUserProfile(userId);
      if (!p || (p.points === 0 && p.bank === 0 && p.loan === 0)) {
        await addPoints(userId, interaction.user.username, 1000);
        await interaction.reply({ content: `🎁 Bạn nhận được 1000 ${CURRENCY_NAME} khởi nghiệp! Hãy thử lại.`, ephemeral: true });
        return;
      }
      await interaction.reply({ content: `❌ Bạn không đủ tiền mặt (Hiện có: ${p ? p.points : 0} ${CURRENCY_NAME}).`, ephemeral: true });
      return;
    }

    setUserBet(userId, channelId, betAmount);

    await interaction.reply('🎲 Đang lắc xí ngầu...');
    await new Promise(resolve => setTimeout(resolve, 800));

    const { dice, total, result } = rollDice();
    const isWin = (command === '!over' && result === 'over') || (command === '!under' && result === 'under');

    const diceEmojis = dice.map(d => {
      const emojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      return emojis[d - 1];
    }).join(' ');

    const resultMsg = `🎲 Kết quả: **${diceEmojis}** = **${total}** (**${result.toUpperCase()}**)\n${isWin ? `✅ Chúc mừng! Bạn đã thắng **${betAmount} ${CURRENCY_NAME}**.` : `❌ Rất tiếc! Bạn đã thua **${betAmount} ${CURRENCY_NAME}**.`}`;
    await interaction.editReply({ content: resultMsg, components: getBetButtons() });
  },

  handleSlashBet: async (interaction, command) => {
    const bet = interaction.options.getInteger('amount');
    const channelId = interaction.channelId;
    const { getGameState } = require('../database');

    const state = await getGameState(channelId);
    if (!state || !state.is_active || state.game_type !== 'over-under') {
      await interaction.reply('❌ Không có game Tài Xỉu nào đang hoạt động ở kênh này.');
      return;
    }

    if (bet < 100 || bet > 100000 || bet % 100 !== 0) {
      await interaction.reply(`❌ Mức cược từ 100 đến 100,000 ${CURRENCY_NAME} và phải là bội số của 100.`);
      return;
    }

    setUserBet(interaction.user.id, channelId, bet);

    const enough = await hasEnoughPoints(interaction.user.id, bet);
    if (!enough && bet > 0) {
      const p = await getUserProfile(interaction.user.id);
      if (!p || (p.points === 0 && p.bank === 0 && p.loan === 0)) {
        await addPoints(interaction.user.id, interaction.user.username, 1000);
        await interaction.reply(`🎁 Bạn nhận được 1000 ${CURRENCY_NAME} khởi nghiệp! Hãy thử lại.`);
        return;
      }
      await interaction.reply(`❌ Bạn không đủ tiền mặt (Hiện có: ${p ? p.points : 0} ${CURRENCY_NAME}).`);
      return;
    }

    await interaction.reply('🎲 Đang lắc xí ngầu...');
    await new Promise(resolve => setTimeout(resolve, 800));

    const { dice, total, result } = rollDice();
    const isWin = (command === '!over' && result === 'over') || (command === '!under' && result === 'under');

    const diceEmojis = dice.map(d => {
      const emojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      return emojis[d - 1];
    }).join(' ');

    const resultMsg = `🎲 Kết quả: **${diceEmojis}** = **${total}** (**${result.toUpperCase()}**)\n${isWin ? `✅ Chúc mừng! Bạn đã thắng **${bet} ${CURRENCY_NAME}**.` : `❌ Rất tiếc! Bạn đã thua **${bet} ${CURRENCY_NAME}**.`}`;
    await interaction.editReply({ content: resultMsg, components: getBetButtons() });
  },

  getBetButtons,
  getUserBet,
  setUserBet,
  DEFAULT_BET,
};
