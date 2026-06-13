const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Trạng thái đơn giản cho terminal
const sessions = new Map();

function createTerminalEmbed(userId) {
  const session = sessions.get(userId) || { output: 'Chào mừng bạn đến với AllIn Terminal.\nGõ lệnh để bắt đầu.' };
  
  const embed = new EmbedBuilder()
    .setTitle('💻 AllIn Terminal')
    .setDescription(`\`\`\`bash\n${session.output}\n\`\`\``)
    .setColor('#000000');

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('term_clear').setLabel('Clear').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('term_status').setLabel('Status').setStyle(ButtonStyle.Primary)
    );

  return { embed, row };
}

async function handleTerminalCommand(interaction) {
  const { embed, row } = createTerminalEmbed(interaction.user.id);
  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleTerminalInteraction(interaction) {
  if (interaction.customId === 'term_clear') {
    sessions.set(interaction.user.id, { output: '' });
  } else if (interaction.customId === 'term_status') {
    sessions.set(interaction.user.id, { output: 'Bot đang hoạt động bình thường.' });
  }

  const { embed, row } = createTerminalEmbed(interaction.user.id);
  await interaction.update({ embeds: [embed], components: [row] });
}

module.exports = { handleTerminalCommand, handleTerminalInteraction };
