const { initStorage, addItemToStorage, getRandomDFItem } = require('./database');

const MAX_SLOTS = 20;
const AUTO_LOOT_INTERVAL = 12000;
const SLOT_UPGRADE_BASE_COST = 2000;
const SLOT_UPGRADE_INCREMENT = 500;

const DURATION_OPTIONS = {
  5:  { label: '5 phút',  ms: 300000 },
  10: { label: '10 phút', ms: 600000 },
  15: { label: '15 phút', ms: 900000 },
};

const DEATH_ENEMIES = [
  { name: '法師 (Pháp Sư)', emoji: '🧙', desc: 'một thằng pháp sư tên tiếng Tàu' },
  { name: 'Lính Ahshara', emoji: '⛑️', desc: 'lính Ahshara thường' },
  { name: 'Machine Gun', emoji: '🔫', desc: 'Machine Gun' },
  { name: 'Rocket', emoji: '🚀', desc: 'Rocket' },
  { name: 'Giám Đốc An Ninh Saeed Ziaten (Anh Liêm)', emoji: '💼', desc: 'Giám Đốc An Ninh Saeed Ziaten (Anh Liêm)' },
];

const DEATH_PROBABILITY = {
  zeroDamEZ: 0.05,
  spaceCityNormal: 0.10,
  spaceCityHard: 0.15,
  brakkesh: 0.20,
};

const activeSessions = new Map();

const MAPS = {
  zeroDamEZ: {
    name: 'Zero Dam EZ',
    entryFee: 0,
    tiers: { common: 0.62, uncommon: 0.22, rare: 0.10, epic: 0.04, legendary: 0.015, mythic: 0.005 },
    emoji: '🌿',
  },
  spaceCityNormal: {
    name: 'Space City Normal',
    entryFee: 500,
    tiers: { common: 0.40, uncommon: 0.30, rare: 0.15, epic: 0.10, legendary: 0.04, mythic: 0.01 },
    emoji: '🏙️',
  },
  spaceCityHard: {
    name: 'Space City Hard',
    entryFee: 1000,
    tiers: { common: 0.20, uncommon: 0.25, rare: 0.25, epic: 0.18, legendary: 0.10, mythic: 0.02 },
    emoji: '🌆',
  },
  brakkesh: {
    name: 'Brakkesh',
    entryFee: 2000,
    tiers: { common: 0.10, uncommon: 0.20, rare: 0.25, epic: 0.25, legendary: 0.15, mythic: 0.05 },
    emoji: '🏚️',
  },
};

const TIER_VALUE = {
  common: [100, 5000],
  uncommon: [5000, 25000],
  rare: [25000, 100000],
  epic: [100000, 500000],
  legendary: [500000, 2000000],
  mythic: [2000000, 10000000],
};

const RARITY = [
  { id: 'common',    name: 'Common',    color: 'Trắng', emoji: '⬜', minPrice: 0 },
  { id: 'uncommon',  name: 'Uncommon',  color: 'Xanh',  emoji: '🟢', minPrice: 5000 },
  { id: 'rare',      name: 'Rare',      color: 'Lam',   emoji: '🔵', minPrice: 25000 },
  { id: 'epic',      name: 'Epic',      color: 'Tím',   emoji: '🟣', minPrice: 100000 },
  { id: 'legendary', name: 'Legendary', color: 'Vàng',  emoji: '🟡', minPrice: 500000 },
  { id: 'mythic',    name: 'Mythic',    color: 'Đỏ',    emoji: '🔴', minPrice: 2000000 },
];

function getRarity(price) {
  let result = RARITY[0];
  for (const r of RARITY) {
    if (price >= r.minPrice) result = r;
  }
  return result;
}

function fluctuatePrice(price) {
  if (price <= 0) return 0;
  const pct = (Math.random() * 0.15) + 0.05;
  const dir = Math.random() < 0.5 ? 1 : -1;
  const multiplier = 1 + (pct * dir);
  return Math.max(1, Math.floor(price * multiplier));
}

function pickTier(mapTiers) {
  const r = Math.random();
  let cumulative = 0;
  for (const [tier, prob] of Object.entries(mapTiers)) {
    cumulative += prob;
    if (r < cumulative) return tier;
  }
  return 'common';
}

function randomValue(tier) {
  const [min, max] = TIER_VALUE[tier];
  return Math.floor(Math.random() * (max - min)) + min;
}

function getRareFindMultiplier() {
  const r = Math.random();
  if (r < 0.05) return 5;
  if (r < 0.15) return 3;
  if (r < 0.35) return 2;
  return 1;
}

function getRareFindLabel(mult) {
  if (mult >= 5) return { label: '🔥 SIÊU PHẨM', emoji: '🔥' };
  if (mult >= 3) return { label: '💎 HÀNG HIẾM', emoji: '💎' };
  if (mult >= 2) return { label: '⭐ GIÁ TRỊ CAO', emoji: '⭐' };
  return { label: '', emoji: '' };
}

async function findRandomItem(mapId) {
  const map = MAPS[mapId];
  const item = await getRandomDFItem();
  if (!item) return { name: 'Unknown Item', rarity: getRarity(0), tier: 'common', value: randomValue('common'), emoji: RARITY[0].emoji, slots: 1 };

  const tier = pickTier(map.tiers);
  const rareMult = getRareFindMultiplier();
  const rareInfo = getRareFindLabel(rareMult);
  const baseValue = item.base_price > 0 ? fluctuatePrice(item.base_price) : randomValue(tier);
  const rarity = getRarity(baseValue);
  return {
    name: item.name || 'Unknown Item',
    tier,
    rarityId: rarity.id,
    rarityName: rarity.name,
    rarityColor: rarity.color,
    value: baseValue * rareMult,
    emoji: rarity.emoji,
    icon: item.icon_url || null,
    slots: item.slots || 1,
    rareLabel: rareInfo.label,
    rareEmoji: rareInfo.emoji,
  };
}

function getUsedSlots(backpack) {
  return backpack.reduce((sum, item) => sum + (item.slots || 1), 0);
}

function buyBackpackSlots(userId, numSlots) {
  const session = getSession(userId);
  if (!session) return { error: 'Bạn chưa vào map nào.' };
  if (session.ended) return { error: 'Session đã kết thúc.' };
  if (numSlots < 1 || numSlots > 50) return { error: 'Số ô không hợp lệ (1-50).' };
  const currentExtra = session.maxSlots - MAX_SLOTS;
  let totalCost = 0;
  for (let i = 0; i < numSlots; i++) {
    totalCost += SLOT_UPGRADE_BASE_COST + (currentExtra + i) * SLOT_UPGRADE_INCREMENT;
  }
  return { ok: true, cost: totalCost, numSlots, currentMax: session.maxSlots, newMax: session.maxSlots + numSlots };
}

function applyBackpackUpgrade(userId, numSlots) {
  const session = getSession(userId);
  if (!session) return { error: 'Bạn chưa vào map nào.' };
  session.maxSlots += numSlots;
  return { ok: true, maxSlots: session.maxSlots };
}

async function startSession(userId, username, mapId, durationMinutes = 5, opts = {}) {
  const existing = activeSessions.get(userId);
  if (existing && Date.now() < existing.endTime) {
    return { error: `Bạn đang có session ở ${MAPS[existing.mapId].name}. Hãy dùng \`!scavenge end\` để kết thúc.` };
  }

  const dur = DURATION_OPTIONS[durationMinutes];
  if (!dur) return { error: 'Thời gian không hợp lệ. Chọn 5, 10, hoặc 15 phút.' };

  const onLoot = opts.onLoot || null;

  const session = {
    userId,
    username,
    mapId,
    durationMinutes,
    startTime: Date.now(),
    endTime: Date.now() + dur.ms,
    backpack: [],
    maxSlots: MAX_SLOTS,
    ended: false,
    timer: null,
    autoLootTimer: null,
    onLoot,
  };

  session.timer = setTimeout(() => endSession(userId), dur.ms);
  session.autoLootTimer = setInterval(() => autoLoot(userId), AUTO_LOOT_INTERVAL);
  activeSessions.set(userId, session);

  // First loot immediately
  const firstLoot = await loot(userId);
  return { ok: true, session, firstLoot };
}

function getSession(userId) {
  const session = activeSessions.get(userId);
  if (!session) return null;
  if (Date.now() > session.endTime) {
    clearTimeout(session.autoLootTimer);
    clearTimeout(session.timer);
    activeSessions.delete(userId);
    return null;
  }
  return session;
}

function checkDeath(mapId) {
  const prob = DEATH_PROBABILITY[mapId] || 0.05;
  if (Math.random() < prob) {
    const enemy = DEATH_ENEMIES[Math.floor(Math.random() * DEATH_ENEMIES.length)];
    return enemy;
  }
  return null;
}

function killSession(userId) {
  const session = activeSessions.get(userId);
  if (!session) return null;
  clearTimeout(session.timer);
  clearTimeout(session.autoLootTimer);
  session.ended = true;
  activeSessions.delete(userId);
  return session;
}

async function autoLoot(userId) {
  const session = getSession(userId);
  if (!session || session.ended) return;
  
  const used = getUsedSlots(session.backpack);
  if (used >= session.maxSlots) {
    if (session.onLoot) {
      try { session.onLoot({ full: true, used, maxSlots: session.maxSlots }); } catch (_) {}
    }
    clearTimeout(session.autoLootTimer);
    session.autoLootTimer = null;
    return;
  }

  const item = await findRandomItem(session.mapId);
  if (item.slots > session.maxSlots - used) return; // skip if too big

  session.backpack.push(item);
  const newUsed = getUsedSlots(session.backpack);

  if (session.onLoot) {
    try {
      session.onLoot({
        item,
        used: newUsed,
        maxSlots: session.maxSlots,
        timeLeft: Math.ceil((session.endTime - Date.now()) / 1000),
        mapName: MAPS[session.mapId].name,
        mapEmoji: MAPS[session.mapId].emoji,
      });
    } catch (_) {}
  }
}

async function loot(userId) {
  const session = getSession(userId);
  if (!session) return { error: 'Bạn chưa vào map nào. Dùng `/scavenge start` hoặc `!scavenge <map>`.' };

  const used = getUsedSlots(session.backpack);
  if (used >= session.maxSlots) {
    return { error: `Balo đã đầy (${session.maxSlots}/${session.maxSlots}). Dùng \`!scavenge end\` để kết thúc.` };
  }

  const enemy = checkDeath(session.mapId);
  if (enemy) {
    const deadSession = killSession(userId);
    return {
      died: true,
      enemy,
      itemCount: deadSession?.backpack.length || 0,
      lostValue: (deadSession?.backpack || []).reduce((sum, item) => sum + item.value, 0),
      mapName: MAPS[session.mapId].name,
      mapEmoji: MAPS[session.mapId].emoji,
    };
  }

  const item = await findRandomItem(session.mapId);
  if (item.slots > session.maxSlots - used) {
    return { error: `Vật phẩm này cần ${item.slots} ô nhưng balo chỉ còn ${session.maxSlots - used} ô trống.` };
  }

  session.backpack.push(item);

  const timeLeft = Math.ceil((session.endTime - Date.now()) / 1000);
  return {
    item,
    slot: getUsedSlots(session.backpack),
    maxSlots: session.maxSlots,
    used,
    timeLeft,
    mapName: MAPS[session.mapId].name,
  };
}

async function endSession(userId) {
  const session = activeSessions.get(userId);
  if (!session) return { error: 'Không có session nào.' };
  if (session.ended) return { error: 'Session đã kết thúc.' };

  clearTimeout(session.timer);
  if (session.autoLootTimer) clearTimeout(session.autoLootTimer);
  session.ended = true;
  activeSessions.delete(userId);

  await initStorage(userId);
  let stored = 0;
  let full = false;
  for (const item of session.backpack) {
    const result = await addItemToStorage(userId, item.name, item.tier, item.value);
    if (result.error) { full = true; break; }
    stored++;
  }

  const totalValue = session.backpack.reduce((sum, item) => sum + item.value, 0);
  const map = MAPS[session.mapId];

  return {
    mapName: map.name,
    mapEmoji: map.emoji,
    backpack: session.backpack,
    stored,
    totalValue,
    full,
    itemCount: session.backpack.length,
    maxSlots: session.maxSlots,
    duration: Math.round((Date.now() - session.startTime) / 1000),
  };
}

function getBackpack(userId) {
  const session = getSession(userId);
  if (!session) return null;
  return {
    mapName: MAPS[session.mapId].name,
    mapEmoji: MAPS[session.mapId].emoji,
    items: session.backpack,
    used: getUsedSlots(session.backpack),
    maxSlots: session.maxSlots,
    timeLeft: Math.ceil((session.endTime - Date.now()) / 1000),
    durationMinutes: session.durationMinutes,
  };
}

module.exports = {
  MAPS,
  DURATION_OPTIONS,
  DEATH_ENEMIES,
  DEATH_PROBABILITY,
  MAX_SLOTS,
  startSession,
  getSession,
  loot,
  endSession,
  getBackpack,
  buyBackpackSlots,
  applyBackpackUpgrade,
};
