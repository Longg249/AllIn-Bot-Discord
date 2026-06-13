const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  // 🎮 Games
  new SlashCommandBuilder()
    .setName('noitu')
    .setDescription('🎮 Bắt đầu trò chơi Nối Từ'),
  new SlashCommandBuilder()
    .setName('taixiu')
    .setDescription('🎲 Bắt đầu trò chơi Tài Xỉu'),
  new SlashCommandBuilder()
    .setName('slot')
    .setDescription('🎰 Chơi máy quay trái cây (Slot Machine)')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('Số tiền cược (tối thiểu 100)')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('🏳️ Dừng trò chơi hiện tại'),
  new SlashCommandBuilder()
    .setName('over')
    .setDescription('🎲 Đặt Tài (Tài Xỉu)')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số tiền cược')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('under')
    .setDescription('🎲 Đặt Xỉu (Tài Xỉu)')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số tiền cược')
        .setRequired(true)),

  // 💰 Economy
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('👤 Xem số dư và hồ sơ cá nhân'),
  new SlashCommandBuilder()
    .setName('bal')
    .setDescription('💰 Xem số dư nhanh'),
  new SlashCommandBuilder()
    .setName('reward')
    .setDescription('🎁 Nhận quà điểm miễn phí mỗi 4 giờ'),
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 Xem bảng xếp hạng đại gia'),
  new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('🏦 Gửi tiền vào ngân hàng')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số tiền muốn gửi (bội số của 100)')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('🏦 Rút tiền từ ngân hàng')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số tiền muốn rút (bội số của 100)')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('loan')
    .setDescription('💸 Vay tiền từ ngân hàng (tối đa 5000)')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số tiền muốn vay')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('payback')
    .setDescription('💸 Trả nợ ngân hàng')
    .addStringOption(option =>
      option.setName('amount')
        .setDescription('Số tiền muốn trả hoặc "all"')
        .setRequired(true)),

  // 🤖 AI & Utils
  new SlashCommandBuilder()
    .setName('terminal')
    .setDescription('💻 Mở giao diện Terminal quản lý bot'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('📖 Xem danh sách lệnh của bot'),
  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('🤖 Hỏi trợ lý AI bất kỳ điều gì')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Câu hỏi của bạn')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('saeed')
    .setDescription('🦉 Trò chuyện với Saeed Ziaten (Fiery Owl)')
    .addStringOption(option =>
      option.setName('noidung')
        .setDescription('Nội dung trò chuyện')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('remind')
    .setDescription('⏰ Đặt nhắc nhở')
    .addStringOption(option =>
      option.setName('time')
        .setDescription('Thời gian (VD: 30m, 1h, 14:30)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Nội dung nhắc nhở')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('wiki')
    .setDescription('📖 Tra cứu Wikipedia')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Từ khóa tìm kiếm')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('define')
    .setDescription('📖 Tra từ điển tiếng Anh')
    .addStringOption(option =>
      option.setName('word')
        .setDescription('Từ cần tra')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('search')
    .setDescription('🔍 Tìm kiếm thông tin trên web')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Từ khóa tìm kiếm')
        .setRequired(true)),

  // 📊 News & Market
  new SlashCommandBuilder()
    .setName('news')
    .setDescription('📰 Đăng ký nhận tin tức hàng giờ')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Bật hoặc tắt')
        .setRequired(true)
        .addChoices(
          { name: 'Bật (On)', value: 'on' },
          { name: 'Tắt (Off)', value: 'off' }
        )),
  new SlashCommandBuilder()
    .setName('crypto')
    .setDescription('🪙 Xem giá tiền điện tử'),
  new SlashCommandBuilder()
    .setName('gold')
    .setDescription('🟡 Xem giá vàng các loại'),
  new SlashCommandBuilder()
    .setName('xang')
    .setDescription('⛽ Xem giá xăng dầu Petrolimex'),
  new SlashCommandBuilder()
    .setName('tygia')
    .setDescription('💹 Xem tỷ giá ngoại tệ'),
  new SlashCommandBuilder()
    .setName('webhook-status')
    .setDescription('🌐 Xem trạng thái hoạt động của các webhook'),

  // 🎒 Scavenger
  new SlashCommandBuilder()
    .setName('scavenge')
    .setDescription('🎒 Lụm rác Delta Force')
    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Vào map lụm rác')
        .addStringOption(opt =>
          opt.setName('map')
            .setDescription('Chọn map')
            .setRequired(true)
            .addChoices(
              { name: 'Zero Dam EZ (Free)', value: 'zeroDamEZ' },
              { name: 'Space City Normal (500$)', value: 'spaceCityNormal' },
              { name: 'Space City Hard (1000$)', value: 'spaceCityHard' },
              { name: 'Brakkesh (2000$)', value: 'brakkesh' }
            ))
        .addIntegerOption(opt =>
          opt.setName('time')
            .setDescription('Thời gian (mặc định 5p)')
            .addChoices(
              { name: '5 phút', value: 5 },
              { name: '10 phút', value: 10 },
              { name: '15 phút', value: 15 }
            )))
    .addSubcommand(sub =>
      sub.setName('loot')
        .setDescription('Lụm món đồ tiếp theo'))
    .addSubcommand(sub =>
      sub.setName('backpack')
        .setDescription('Xem balo hiện tại'))
    .addSubcommand(sub =>
      sub.setName('buyslots')
        .setDescription('Mua thêm ô balo')
        .addIntegerOption(opt =>
          opt.setName('số_lượng')
            .setDescription('Số lượng ô muốn mua')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('Kết thúc lụm rác và về kho')),

  new SlashCommandBuilder()
    .setName('storage')
    .setDescription('📦 Quản lý kho đồ Scavenger')
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('Xem danh sách đồ trong kho'))
    .addSubcommand(sub =>
      sub.setName('sell')
        .setDescription('Bán đồ trong kho')
        .addStringOption(opt =>
          opt.setName('item')
            .setDescription('ID món đồ hoặc "all"')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('upgrade')
        .setDescription('Nâng cấp sức chứa kho')),
].map(cmd => cmd.toJSON());

async function deployCommands() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    console.error('❌ Thiếu DISCORD_TOKEN hoặc CLIENT_ID trong .env');
    return;
  }
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log(`Đang đăng ký ${commands.length} slash commands...`);
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
