const { hasEnoughPoints, getUserProfile, addPoints, getGameState, CURRENCY_NAME } = require('../database');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const DICE_EMOJIS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

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

const formatDiceEmojis = (dice) => dice.map(d => DICE_EMOJIS[d - 1]).join(' ');

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

async function checkBalanceAndFund(userId, username, betAmount) {
  const enough = await hasEnoughPoints(userId, betAmount);
  if (!enough && betAmount > 0) {
    const p = await getUserProfile(userId);
    if (!p || (p.points === 0 && p.bank === 0 && p.loan === 0)) {
      await addPoints(userId, username, 1000);
      return { ok: false, msg: `🎁 Bạn nhận được 1000 ${CURRENCY_NAME} khởi nghiệp! Hãy thử lại.` };
    }
    return { ok: false, msg: `❌ Bạn không đủ tiền mặt (Hiện có: ${p ? p.points : 0} ${CURRENCY_NAME}).` };
  }
  return { ok: true };
}

async function executeBet(userId, username, betAmount, command, replyFn, editReplyFn, opts = {}) {
  setUserBet(userId, opts.channelId || 0, betAmount);

  const check = await checkBalanceAndFund(userId, username, betAmount);
  if (!check.ok) {
    await replyFn(check.msg);
    return;
  }

  await replyFn('🎲 Đang lắc xí ngầu...');
  await new Promise(resolve => setTimeout(resolve, 800));

  const { dice, total, result } = rollDice();
  const isWin = (command === '!over' && result === 'over') || (command === '!under' && result === 'under');

  await addPoints(userId, username, isWin ? betAmount : -betAmount);
  await editReplyFn(
    `🎲 Kết quả: **${formatDiceEmojis(dice)}** = **${total}** (**${result.toUpperCase()}**)\n${isWin ? `✅ Chúc mừng! Bạn đã thắng **${betAmount} ${CURRENCY_NAME}**.` : `❌ Rất tiếc! Bạn đã thua **${betAmount} ${CURRENCY_NAME}**.`}`
  );
}

module.exports = {
  handleMessage: async (message, state, command, args) => {
    if (command === '!over' || command === '!under') {
      const bet = parseInt(args[1]);
      if (isNaN(bet) || bet < 100 || bet > 100000 || bet % 100 !== 0) {
        message.reply(`❌ Mức cược từ 100 đến 100,000 ${CURRENCY_NAME} và phải là bội số của 100.`);
        return true;
      }
      await executeBet(
        message.author.id, message.author.username, bet, command,
        (msg) => message.reply(msg),
        async (msg) => {
          const m = await message.reply('🎲 Đang lắc xí ngầu...');
          await m.edit({ content: msg, components: getBetButtons() });
        }
      );
      return true;
    }
    return false;
  },

  handleInteraction: async (interaction, data) => {
    const [action, amountStr] = data.split('_');
    const betAmount = parseInt(amountStr) || getUserBet(interaction.user.id, interaction.channelId);
    const command = action === 'over' ? '!over' : '!under';

    const check = await checkBalanceAndFund(interaction.user.id, interaction.user.username, betAmount);
    if (!check.ok) {
      await interaction.reply({ content: check.msg, ephemeral: true });
      return;
    }

    await executeBet(
      interaction.user.id, interaction.user.username, betAmount, command,
      (msg) => interaction.reply(msg),
      (msg) => interaction.editReply({ content: msg, components: getBetButtons() }),
      { channelId: interaction.channelId }
    );
  },

  handleSlashBet: async (interaction, command) => {
    const bet = interaction.options.getInteger('amount');
    const channelId = interaction.channelId;

    const state = await getGameState(channelId);
    if (!state || !state.is_active || state.game_type !== 'over-under') {
      await interaction.reply('❌ Không có game Tài Xỉu nào đang hoạt động ở kênh này.');
      return;
    }

    if (bet < 100 || bet > 100000 || bet % 100 !== 0) {
      await interaction.reply(`❌ Mức cược từ 100 đến 100,000 ${CURRENCY_NAME} và phải là bội số của 100.`);
      return;
    }

    await executeBet(
      interaction.user.id, interaction.user.username, bet, command,
      (msg, ephemeral) => interaction.reply({ content: msg, ephemeral }),
      (msg) => interaction.editReply({ content: msg, components: getBetButtons() })
    );
  },

  getBetButtons,
  getUserBet,
  setUserBet,
  DEFAULT_BET,
};
