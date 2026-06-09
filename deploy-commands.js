const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('game')
    .setDescription('Các lệnh liên quan đến trò chơi')
    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Bắt đầu một trò chơi')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Chọn game')
            .setRequired(true)
            .addChoices(
              { name: 'Nối Từ', value: 'noitu' },
              { name: 'Tài Xỉu', value: 'over-under' },
              { name: 'Slot Machine', value: 'slot' },
              { name: 'Tung đồng xu', value: 'flip' },
              { name: 'Đố vui (Quiz)', value: 'quiz' }
            )))
    .addSubcommand(sub =>
      sub.setName('play')
        .setDescription('Chơi trò chơi đang hoạt động')
        .addStringOption(option =>
          option.setName('action')
            .setDescription('Hành động hoặc giá trị đặt cược')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('stop')
        .setDescription('Dừng trò chơi hiện tại')),
  
  // Các lệnh khác giữ nguyên nhưng có thể nhóm lại sau...
].map(cmd => cmd.toJSON());

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log(`Đang đăng ký slash commands...`);
    // Cần thay thế CLIENT_ID bằng giá trị thật nếu chưa có trong .env
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log(`✅ Đã đăng ký thành công slash commands!`);
  } catch (error) {
    console.error('❌ Lỗi đăng ký commands:', error.message);
  }
}

if (require.main === module) {
  deployCommands();
}

module.exports = { commands, deployCommands };
