const { getUserProfile, addPoints, CURRENCY_NAME } = require('../database');

const STAMINA_MAX = 10;
const STAMINA_REGEN_MS = 30000;

const FISHING_RODS = {
  bamboo:   { name: 'Cần Bamboo',        cost: 0,      mult: 1.0, catchRate: 0.7, emoji: '🎋' },
  fiber:    { name: 'Cần Sợi Thủy Tinh', cost: 5000,   mult: 1.3, catchRate: 0.8, emoji: '🎣' },
  carbon:   { name: 'Cần Carbon',        cost: 25000,  mult: 1.6, catchRate: 0.9, emoji: '⚡' },
  titanium: { name: 'Cần Titanium',      cost: 100000, mult: 2.0, catchRate: 0.95, emoji: '💠' },
  master:   { name: 'Cần Master',        cost: 500000, mult: 3.0, catchRate: 0.99, emoji: '👑' },
};

const BAIT = {
  earthworm:  { name: 'Giun Đất',    cost: 100,   mult: 1.0, emoji: '🪱' },
  shrimp:     { name: 'Tôm',         cost: 500,   mult: 1.4, emoji: '🦐' },
  premium:    { name: 'Mồi Cao Cấp', cost: 2000,  mult: 2.0, emoji: '✨' },
  golden:     { name: 'Mồi Vàng',    cost: 10000, mult: 3.0, emoji: '🌟' },
};

const FISHING_SPOTS = {
  pond:   { name: 'Ao Làng',     entryFee: 0,     tiers: { trash: 0.15, common: 0.50, uncommon: 0.30, rare: 0.05 }, emoji: '🏞️' },
  river:  { name: 'Sông',        entryFee: 500,   tiers: { trash: 0.08, common: 0.35, uncommon: 0.35, rare: 0.18, epic: 0.04 }, emoji: '🌊' },
  lake:   { name: 'Hồ Lớn',      entryFee: 2000,  tiers: { trash: 0.03, common: 0.20, uncommon: 0.30, rare: 0.30, epic: 0.15, legendary: 0.02 }, emoji: '🏖️' },
  ocean:  { name: 'Đại Dương',   entryFee: 5000,  tiers: { trash: 0.02, common: 0.10, uncommon: 0.20, rare: 0.30, epic: 0.25, legendary: 0.12, mythic: 0.01 }, emoji: '🌅' },
  abyss:  { name: 'Vực Sâu',     entryFee: 15000, tiers: { trash: 0.01, common: 0.05, uncommon: 0.10, rare: 0.20, epic: 0.30, legendary: 0.25, mythic: 0.09 }, emoji: '🌀' },
};

const FISH_DATA = {
  trash: [
    { name: 'Ủng Cao Su',        emoji: '🥾', value: [0, 0] },
    { name: 'Lốp Xe Cũ',        emoji: '🛞', value: [0, 0] },
    { name: 'Chai Nhựa',        emoji: '🧴', value: [0, 0] },
    { name: 'Rong Rêu',         emoji: '🌿', value: [0, 0] },
    { name: 'Bịch Nylon',       emoji: '🛍️', value: [0, 0] },
  ],
  common: [
    { name: 'Cá Rô Phi',        emoji: '🐟', value: [100, 500] },
    { name: 'Cá Chép',          emoji: '🐟', value: [150, 600] },
    { name: 'Cá Mè',            emoji: '🐟', value: [100, 400] },
    { name: 'Cá Trê',           emoji: '🐟', value: [200, 700] },
    { name: 'Tép',              emoji: '🦐', value: [50, 200] },
    { name: 'Ốc',               emoji: '🐚', value: [50, 150] },
  ],
  uncommon: [
    { name: 'Cá Diêu Hồng',     emoji: '🐠', value: [500, 2000] },
    { name: 'Cá Trắm',          emoji: '🐠', value: [600, 2500] },
    { name: 'Cá Chép Koi',      emoji: '🐠', value: [1000, 4000] },
    { name: 'Lươn',             emoji: '🐍', value: [800, 3000] },
    { name: 'Cua Đồng',         emoji: '🦀', value: [500, 2000] },
  ],
  rare: [
    { name: 'Cá Hồi',           emoji: '🐟', value: [3000, 10000] },
    { name: 'Cá Thu',           emoji: '🐟', value: [4000, 12000] },
    { name: 'Cá Ngừ Vây Vàng', emoji: '🐟', value: [5000, 15000] },
    { name: 'Mực Ống',         emoji: '🦑', value: [3000, 8000] },
    { name: 'Ghẹ Xanh',        emoji: '🦀', value: [2500, 7000] },
  ],
  epic: [
    { name: 'Cá Ngừ Đại Dương', emoji: '🐋', value: [15000, 50000] },
    { name: 'Cá Kiếm',          emoji: '🗡️', value: [20000, 60000] },
    { name: 'Cá Mập Trắng',     emoji: '🦈', value: [25000, 80000] },
    { name: 'Bạch Tuộc Khổng Lồ', emoji: '🐙', value: [20000, 70000] },
    { name: 'Cá Đuối',          emoji: '🪸', value: [15000, 45000] },
  ],
  legendary: [
    { name: 'Cá Mập Hammer',    emoji: '🦈', value: [80000, 300000] },
    { name: 'Cá Voi Xanh',      emoji: '🐳', value: [100000, 500000] },
    { name: 'Cá Mập Miệng Rộng', emoji: '🦈', value: [120000, 400000] },
    { name: 'Rùa Biển Khổng Lồ', emoji: '🐢', value: [80000, 250000] },
  ],
  mythic: [
    { name: 'Rồng Biển',        emoji: '🐉', value: [500000, 2000000] },
    { name: 'Thủy Thần Cổ Đại', emoji: '🧜', value: [800000, 3000000] },
    { name: 'Kraken Huyền Thoại', emoji: '🐙', value: [1000000, 5000000] },
    { name: 'Cá Mập Ma',        emoji: '👻', value: [800000, 3000000] },
  ],
};

const RARITY_CONFIG = [
  { id: 'trash',     name: 'Rác',         color: 'Xám',   emoji: '⬜', emoji2: '🗑️' },
  { id: 'common',    name: 'Common',      color: 'Trắng', emoji: '⬜' },
  { id: 'uncommon',  name: 'Uncommon',    color: 'Xanh',  emoji: '🟢' },
  { id: 'rare',      name: 'Rare',        color: 'Lam',   emoji: '🔵' },
  { id: 'epic',      name: 'Epic',        color: 'Tím',   emoji: '🟣' },
  { id: 'legendary', name: 'Legendary',   color: 'Vàng',  emoji: '🟡' },
  { id: 'mythic',    name: 'Mythic',      color: 'Đỏ',    emoji: '🔴' },
];

const FISH_TIER_VALUE = {
  trash:     { min: 0,    max: 0 },
  common:    { min: 100,  max: 700 },
  uncommon:  { min: 500,  max: 4000 },
  rare:      { min: 2500, max: 15000 },
  epic:      { min: 15000,max: 80000 },
  legendary: { min: 80000,max: 500000 },
  mythic:    { min: 500000, max: 5000000 },
};

const ROD_NAMES = Object.keys(FISHING_RODS);
const BAIT_NAMES = Object.keys(BAIT);
const SPOT_NAMES = Object.keys(FISHING_SPOTS);

const userFishing = new Map();
const fishingSessions = new Map();

function initFishing(userId) {
  if (!userFishing.has(userId)) {
    userFishing.set(userId, {
      rod: 'bamboo',
      bait: 'earthworm',
      stamina: STAMINA_MAX,
      maxStamina: STAMINA_MAX,
      lastRegen: Date.now(),
      caught: [],
      totalCaught: 0,
      xp: 0,
    });
  }
  return userFishing.get(userId);
}

function regenStamina(userId) {
  const data = userFishing.get(userId);
  if (!data) return;
  const now = Date.now();
  const elapsed = now - data.lastRegen;
  const regen = Math.floor(elapsed / STAMINA_REGEN_MS);
  if (regen > 0) {
    data.stamina = Math.min(data.maxStamina, data.stamina + regen);
    data.lastRegen = now;
  }
}

function pickTier(spotTiers, rodMult, baitMult) {
  const totalMult = rodMult * baitMult;
  const modified = {};
  for (const [tier, prob] of Object.entries(spotTiers)) {
    modified[tier] = prob;
  }
  if (totalMult > 1) {
    const bonus = (totalMult - 1) * 0.5;
    for (const tier of Object.keys(modified)) {
      const idx = RARITY_CONFIG.findIndex(r => r.id === tier);
      if (idx >= 3) {
        modified[tier] = Math.min(1, modified[tier] + bonus * 0.1);
      }
    }
    const totalProb = Object.values(modified).reduce((a, b) => a + b, 0);
    if (totalProb > 1) {
      for (const tier of Object.keys(modified)) {
        modified[tier] /= totalProb;
      }
    }
  }
  const r = Math.random();
  let cumulative = 0;
  for (const [tier, prob] of Object.entries(modified)) {
    cumulative += prob;
    if (r < cumulative) return tier;
  }
  return 'common';
}

function getRandomFish(tier) {
  const fishes = FISH_DATA[tier];
  if (!fishes || fishes.length === 0) return null;
  const fish = fishes[Math.floor(Math.random() * fishes.length)];
  const [min, max] = fish.value;
  const value = Math.floor(Math.random() * (max - min + 1)) + min;
  const rarity = RARITY_CONFIG.find(r => r.id === tier);
  return {
    name: fish.name,
    emoji: fish.emoji,
    tier,
    value,
    rarityName: rarity.name,
    rarityColor: rarity.color,
    rarityEmoji: rarity.emoji,
  };
}

function canCatch(rodCatchRate) {
  return Math.random() < rodCatchRate;
}

async function cast(userId, spotId) {
  const data = initFishing(userId);
  regenStamina(userId);

  if (data.stamina < 2) {
    return { error: `⏳ Bạn đã hết thể lực (${data.stamina}/${data.maxStamina}). Hãy chờ hồi phục (1 thể lực mỗi 30s).` };
  }

  const spot = FISHING_SPOTS[spotId];
  if (!spot) return { error: 'Địa điểm không hợp lệ.' };

  const rod = FISHING_RODS[data.rod];
  const bait = BAIT[data.bait];

  data.stamina -= 2;
  const waitTime = 2000 + Math.random() * 4000;

  await new Promise(resolve => setTimeout(resolve, waitTime));

  const tier = pickTier(spot.tiers, rod.mult, bait.mult);
  const canCatchIt = canCatch(rod.catchRate);

  if (!canCatchIt) {
    return {
      escaped: true,
      message: `😤 **Cá đã tuột mất!** Cần câu của bạn không đủ tốt để kéo lên.`,
      stamina: data.stamina,
      maxStamina: data.maxStamina,
    };
  }

  const fish = getRandomFish(tier);
  if (!fish) {
    return {
      escaped: true,
      message: `😞 Không cắn câu lần này. Hãy thử lại!`,
      stamina: data.stamina,
      maxStamina: data.maxStamina,
    };
  }

  data.caught.push(fish);
  data.totalCaught++;
  data.xp += fish.value > 0 ? Math.ceil(fish.value / 100) : 1;

  const tierEmoji = fish.tier === 'trash' ? '🗑️' : (RARITY_CONFIG.find(r => r.id === fish.tier)?.emoji || '⬜');
  const valueStr = fish.value > 0 ? `💵 \`${fish.value.toLocaleString()} ${CURRENCY_NAME}\`` : '💵 Vô giá trị';

  return {
    fish,
    message: `${fish.emoji} **${fish.name}**\n${tierEmoji} ${fish.rarityName} (${fish.rarityColor}) — ${valueStr}`,
    stamina: data.stamina,
    maxStamina: data.maxStamina,
    spot: spot.emoji,
    spotName: spot.name,
  };
}

function getInventory(userId) {
  const data = userFishing.get(userId);
  if (!data || data.caught.length === 0) return { items: [], total: 0, count: 0 };
  const total = data.caught.reduce((sum, f) => sum + f.value, 0);
  return { items: data.caught, total, count: data.caught.length };
}

async function sellAll(userId) {
  const data = userFishing.get(userId);
  if (!data || data.caught.length === 0) return { error: 'Bạn chưa câu được con cá nào.' };
  const total = data.caught.reduce((sum, f) => sum + f.value, 0);
  const count = data.caught.length;
  if (total > 0) {
    const p = await getUserProfile(userId);
    const username = p?.username || 'Unknown';
    await addPoints(userId, username, total);
  }
  data.caught = [];
  return { total, count };
}

function sellOne(userId, index) {
  const data = userFishing.get(userId);
  if (!data || index < 0 || index >= data.caught.length) return { error: 'Chỉ số không hợp lệ.' };
  const fish = data.caught.splice(index, 1)[0];
  return { fish, value: fish.value };
}

function getStats(userId) {
  const data = userFishing.get(userId);
  if (!data) return null;
  const rod = FISHING_RODS[data.rod];
  const bait = BAIT[data.bait];
  return {
    rod: rod,
    bait: bait,
    stamina: data.stamina,
    maxStamina: data.maxStamina,
    totalCaught: data.totalCaught,
    xp: data.xp,
    level: Math.floor(data.xp / 100) + 1,
    inventory: data.caught.length,
  };
}

function getShop(userId) {
  const rods = Object.entries(FISHING_RODS);
  const baits = Object.entries(BAIT);
  return { rods, baits };
}

async function buyRod(userId, rodId) {
  const rod = FISHING_RODS[rodId];
  if (!rod) return { error: 'Cần câu không tồn tại.' };
  const data = initFishing(userId);
  if (data.rod === rodId) return { error: `Bạn đang dùng ${rod.emoji} ${rod.name} rồi.` };
  if (rod.cost === 0) {
    data.rod = rodId;
    return { ok: true, rod, cost: 0 };
  }
  const p = await getUserProfile(userId);
  if (!p || p.points < rod.cost) {
    return { error: `Bạn cần \`${rod.cost.toLocaleString()} ${CURRENCY_NAME}\` để mua ${rod.emoji} ${rod.name}. Bạn có \`${(p?.points || 0).toLocaleString()}\`.` };
  }
  const username = p?.username || 'Unknown';
  await addPoints(userId, username, -rod.cost);
  data.rod = rodId;
  return { ok: true, rod, cost: rod.cost };
}

async function buyBait(userId, baitId) {
  const bait = BAIT[baitId];
  if (!bait) return { error: 'Mồi câu không tồn tại.' };
  const data = initFishing(userId);
  if (bait.cost === 0) {
    data.bait = baitId;
    return { ok: true, bait, cost: 0 };
  }
  const p = await getUserProfile(userId);
  if (!p || p.points < bait.cost) {
    return { error: `Bạn cần \`${bait.cost.toLocaleString()} ${CURRENCY_NAME}\` để mua ${bait.emoji} ${bait.name}. Bạn có \`${(p?.points || 0).toLocaleString()}\`.` };
  }
  const username = p?.username || 'Unknown';
  await addPoints(userId, username, -bait.cost);
  data.bait = baitId;
  return { ok: true, bait, cost: bait.cost };
}

function formatInventory(userId) {
  const data = userFishing.get(userId);
  if (!data || data.caught.length === 0) return null;

  let msg = `🎒 **GIỎ CÁ**\n━━━━━━━━━━━━━━━\n`;
  let total = 0;
  data.caught.forEach((fish, i) => {
    const tierEmoji = fish.tier === 'trash' ? '🗑️' : (RARITY_CONFIG.find(r => r.id === fish.tier)?.emoji || '⬜');
    msg += `${i + 1}. ${fish.emoji} **${fish.name}** ${tierEmoji}\n└ ${fish.rarityName}(${fish.rarityColor}) | 💵 \`${fish.value.toLocaleString()} ${CURRENCY_NAME}\`\n`;
    total += fish.value;
  });
  msg += `━━━━━━━━━━━━━━━\n💰 **Tổng giá trị:** \`${total.toLocaleString()} ${CURRENCY_NAME}\`\n`;
  msg += `💡 \`/fishing sell all\` để bán hết, \`/fishing sell <số>\` để bán 1 con.`;
  return msg;
}

function formatStats(userId) {
  const stats = getStats(userId);
  if (!stats) return null;

  const staminaBar = '█'.repeat(stats.stamina) + '░'.repeat(stats.maxStamina - stats.stamina);
  return `🎣 **THÔNG TIN CÂU CÁ**
━━━━━━━━━━━━━━━
🪙 **Cấp độ:** ${stats.level}
🐟 **Tổng cá:** ${stats.totalCaught}
━━━━━━━━━━━━━━━
🎋 **Cần câu:** ${stats.rod.emoji} ${stats.rod.name} (x${stats.rod.mult})
🪱 **Mồi câu:** ${stats.bait.emoji} ${stats.bait.name} (x${stats.bait.mult})
━━━━━━━━━━━━━━━
⚡ **Thể lực:** ${staminaBar} ${stats.stamina}/${stats.maxStamina}
🎒 **Giỏ cá:** ${stats.inventory} con
━━━━━━━━━━━━━━━
💡 \`/fishing shop\` — Cửa hàng
💡 \`/fishing cast <spot>\` — Câu cá`;
}

const FISHING_COOLDOWNS = new Map();

function hasCooldown(userId) {
  const last = FISHING_COOLDOWNS.get(userId);
  if (last && Date.now() - last < 3000) return true;
  FISHING_COOLDOWNS.set(userId, Date.now());
  return false;
}

module.exports = {
  FISHING_RODS,
  BAIT,
  FISHING_SPOTS,
  ROD_NAMES,
  BAIT_NAMES,
  SPOT_NAMES,

  initFishing,
  cast,
  getInventory,
  sellAll,
  sellOne,
  getStats,
  getShop,
  buyRod,
  buyBait,
  formatInventory,
  formatStats,
  hasCooldown,
};
