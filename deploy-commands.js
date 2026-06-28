const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('noitu')
    .setDescription('Bat dau tro choi Noi Tu'),
  new SlashCommandBuilder()
    .setName('taixiu')
    .setDescription('Bat dau tro choi Tai Xiu'),
  new SlashCommandBuilder()
    .setName('slot')
    .setDescription('May quay trai cay (Slot Machine)')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('So tien cuoc (toi thieu 100)')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Dung tro choi hien tai'),
  new SlashCommandBuilder()
    .setName('over')
    .setDescription('Dat Tai (Tai Xiu)')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('So tien cuoc')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('under')
    .setDescription('Dat Xiu (Tai Xiu)')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('So tien cuoc')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Xem so du va ho so ca nhan'),
  new SlashCommandBuilder()
    .setName('bal')
    .setDescription('Xem so du nhanh'),
  new SlashCommandBuilder()
    .setName('reward')
    .setDescription('Nhan qua diem mien phi moi 4 gio'),
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Xem bang xep hang dai gia'),
  new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('Gui tien vao ngan hang')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('So tien muon gui (boi so cua 100)')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Rut tien tu ngan hang')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('So tien muon rut (boi so cua 100)')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('loan')
    .setDescription('Vay tien tu ngan hang (toi da 5000)')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('So tien muon vay')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('payback')
    .setDescription('Tra no ngan hang')
    .addStringOption(option =>
      option.setName('amount')
        .setDescription('So tien muon tra hoac "all"')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('terminal')
    .setDescription('Mo giao dien Terminal quan ly bot'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Xem danh sach lenh cua bot'),
  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Hoi tro ly AI bat ky dieu gi')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Cau hoi cua ban')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('saeed')
    .setDescription('Truyen chuyen voi Saeed Ziaten (Fiery Owl)')
    .addStringOption(option =>
      option.setName('noidung')
        .setDescription('Noi dung truyen chuyen')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Dat nhac nho')
    .addStringOption(option =>
      option.setName('time')
        .setDescription('Thoi gian (VD: 30m, 1h, 14:30)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Noi dung nhac nho')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('wiki')
    .setDescription('Tra cuu Wikipedia')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Tu khoa tim kiem')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('define')
    .setDescription('Tra tu dien tieng Anh')
    .addStringOption(option =>
      option.setName('word')
        .setDescription('Tu can tra')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('search')
    .setDescription('Tim kiem thong tin tren web')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Tu khoa tim kiem')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('news')
    .setDescription('Dang ky nhan tin tuc hang gio')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Bat hoac tat')
        .setRequired(true)
        .addChoices(
          { name: 'Bat (On)', value: 'on' },
          { name: 'Tat (Off)', value: 'off' }
        )),
  new SlashCommandBuilder()
    .setName('crypto')
    .setDescription('Xem gia tien dien tu'),
  new SlashCommandBuilder()
    .setName('gold')
    .setDescription('Xem gia vang cac loai'),
  new SlashCommandBuilder()
    .setName('xang')
    .setDescription('Xem gia xang dau'),
  new SlashCommandBuilder()
    .setName('tygia')
    .setDescription('Xem ty gia ngoai te'),
  new SlashCommandBuilder()
    .setName('webhook-status')
    .setDescription('Xem trang thai hoat dong cua cac webhook'),

  new SlashCommandBuilder()
    .setName('scavenge')
    .setDescription('Lum rac Delta Force')
    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Vao map lum rac')
        .addStringOption(opt =>
          opt.setName('map')
            .setDescription('Chon map')
            .setRequired(true)
            .addChoices(
              { name: 'Zero Dam EZ (Free)', value: 'zeroDamEZ' },
              { name: 'Space City Normal (500$)', value: 'spaceCityNormal' },
              { name: 'Space City Hard (1000$)', value: 'spaceCityHard' },
              { name: 'Brakkesh (2000$)', value: 'brakkesh' }
            ))
        .addIntegerOption(opt =>
          opt.setName('time')
            .setDescription('Thoi gian (mac dinh 5p)')
            .addChoices(
              { name: '5 phut', value: 5 },
              { name: '10 phut', value: 10 },
              { name: '15 phut', value: 15 }
            )))
    .addSubcommand(sub =>
      sub.setName('loot')
        .setDescription('Lum mon do tiep theo'))
    .addSubcommand(sub =>
      sub.setName('backpack')
        .setDescription('Xem balo hien tai'))
    .addSubcommand(sub =>
      sub.setName('buyslots')
        .setDescription('Mua them o balo')
        .addIntegerOption(opt =>
          opt.setName('so_luong')
            .setDescription('So luong o muon mua')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('Ket thuc lum rac va ve kho')),

  new SlashCommandBuilder()
    .setName('storage')
    .setDescription('Quan ly kho do Scavenger')
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('Xem danh sach do trong kho'))
    .addSubcommand(sub =>
      sub.setName('sell')
        .setDescription('Ban do trong kho')
        .addStringOption(opt =>
          opt.setName('item')
            .setDescription('ID mon do hoac "all"')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('upgrade')
        .setDescription('Nang cap suc chua kho')),
  new SlashCommandBuilder()
    .setName('fishing')
    .setDescription('Cau ca')
    .addSubcommand(sub =>
      sub.setName('cast')
        .setDescription('Tha cau cau ca')
        .addStringOption(opt =>
          opt.setName('spot')
            .setDescription('Chon dia diem cau')
            .setRequired(true)
            .addChoices(
              { name: 'Ao Lang (Free)', value: 'pond' },
              { name: 'Song (500$)', value: 'river' },
              { name: 'Ho Lon (2000$)', value: 'lake' },
              { name: 'Dai Duong (5000$)', value: 'ocean' },
              { name: 'Vuc Sau (15000$)', value: 'abyss' }
            )))
    .addSubcommand(sub =>
      sub.setName('sell')
        .setDescription('Ban ca trong gio')
        .addStringOption(opt =>
          opt.setName('item')
            .setDescription('So thu tu hoac "all"')
            .setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('inventory')
        .setDescription('Xem gio ca'))
    .addSubcommand(sub =>
      sub.setName('stats')
        .setDescription('Xem thong tin cau ca'))
    .addSubcommand(sub =>
      sub.setName('shop')
        .setDescription('Cua hang dung cu cau ca'))
    .addSubcommand(sub =>
      sub.setName('buyrod')
        .setDescription('Mua can cau')
        .addStringOption(opt =>
          opt.setName('rod')
            .setDescription('Chon can cau')
            .setRequired(true)
            .addChoices(
              { name: 'Can Bamboo (Free)', value: 'bamboo' },
              { name: 'Can Soi Thuy Tinh (5,000$)', value: 'fiber' },
              { name: 'Can Carbon (25,000$)', value: 'carbon' },
              { name: 'Can Titanium (100,000$)', value: 'titanium' },
              { name: 'Can Master (500,000$)', value: 'master' }
            )))
    .addSubcommand(sub =>
      sub.setName('buybait')
        .setDescription('Mua moi cau')
        .addStringOption(opt =>
          opt.setName('bait')
            .setDescription('Chon moi cau')
            .setRequired(true)
            .addChoices(
              { name: 'Giun Dat (100$)', value: 'earthworm' },
              { name: 'Tom (500$)', value: 'shrimp' },
              { name: 'Moi Cao Cap (2,000$)', value: 'premium' },
              { name: 'Moi Vang (10,000$)', value: 'golden' }
            ))),
].map(cmd => cmd.toJSON());

const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 3;

async function deployCommands() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    console.error('Thieu DISCORD_TOKEN hoac CLIENT_ID trong .env');
    process.exit(1);
  }
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Dang dang ky ${commands.length} slash commands (lan ${attempt}/${MAX_RETRIES})...`);
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
      );
      console.log('Da dang ky thanh cong slash commands!');
      return;
    } catch (error) {
      console.error(`Loi dang ky commands (lan ${attempt}):`, error.message);
      if (attempt < MAX_RETRIES) {
        console.log(`Thu lai sau ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
  console.error('That bai sau nhieu lan thu.');
  process.exit(1);
}

if (require.main === module) {
  deployCommands();
}

module.exports = { commands, deployCommands };
