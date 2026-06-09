const { exec } = require('child_process');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'game.db');

// Constant for currency
const CURRENCY_NAME = 'Tekniq Alloy';
const CURRENCY_ICON = 'https://assetsdelivery.eldorado.gg/v7/_assets_/predefined-offers/v8/233/delta-force-ta.png';
const STARTING_BALANCE = 10000;

// Helper to escape values for sqlite3 CLI
const escapeValue = (val) => {
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  return val;
};

// Helper to replace '?' placeholders with escaped values
const formatSql = (sql, params) => {
  let i = 0;
  return sql.replace(/\?/g, () => escapeValue(params[i++]));
};

// Execute SQL command using sqlite3 CLI
const execSql = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const formattedSql = formatSql(sql, params);
    const cmd = `sqlite3 ${DB_PATH} "${formattedSql}"`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
};

// Helper to run queries as Promises
const run = async (sql, params = []) => {
  await execSql(sql, params);
  return { changes: 1 }; // Simplified
};

const get = async (sql, params = []) => {
  // Use -json or CSV for structured output
  return new Promise((resolve, reject) => {
    const formattedSql = formatSql(sql, params);
    const cmd = `sqlite3 -json ${DB_PATH} "${formattedSql}"`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(err);
      else {
        try {
          const rows = JSON.parse(stdout);
          resolve(rows && rows.length > 0 ? rows[0] : null);
        } catch (e) {
          resolve(null);
        }
      }
    });
  });
};

const all = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const formattedSql = formatSql(sql, params);
    const cmd = `sqlite3 -json ${DB_PATH} "${formattedSql}"`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(err);
      else {
        try {
          resolve(JSON.parse(stdout) || []);
        } catch (e) {
          resolve([]);
        }
      }
    });
  });
};

// Initialize tables
const init = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS game_state (
      channel_id TEXT PRIMARY KEY,
      game_type TEXT,
      last_word TEXT,
      last_user_id TEXT,
      is_active INTEGER DEFAULT 0
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS used_words (
      channel_id TEXT,
      word TEXT,
      PRIMARY KEY (channel_id, word)
    );
  `);
  await run(`
  CREATE TABLE IF NOT EXISTS user_scores (
    user_id TEXT PRIMARY KEY,
    points INTEGER DEFAULT 0,
    bank INTEGER DEFAULT 0,
    loan INTEGER DEFAULT 0,
    last_loan_at INTEGER DEFAULT 0,
    last_reward_at INTEGER DEFAULT 0,
    username TEXT
  );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS news_subscriptions (
      channel_id TEXT PRIMARY KEY
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS user_storage (
      user_id TEXT PRIMARY KEY,
      capacity INTEGER DEFAULT 100
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS storage_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      tier TEXT NOT NULL,
      value INTEGER NOT NULL,
      acquired_at INTEGER NOT NULL,
      sold INTEGER DEFAULT 0
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS df_items (
      item_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon_url TEXT DEFAULT '',
      base_price INTEGER DEFAULT 0,
      price_updated_at INTEGER DEFAULT 0
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      channel_id TEXT,
      message TEXT NOT NULL,
      remind_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      notified INTEGER DEFAULT 0
    );
  `);
};

init();

module.exports = {
  getGameState: (channelId) => {
    return get('SELECT * FROM game_state WHERE channel_id = ?', [channelId]);
  },
  subscribeNews: (channelId) => {
    return run('INSERT OR IGNORE INTO news_subscriptions (channel_id) VALUES (?)', [channelId]);
  },
  unsubscribeNews: (channelId) => {
    return run('DELETE FROM news_subscriptions WHERE channel_id = ?', [channelId]);
  },
  getNewsSubscriptions: () => {
    return all('SELECT channel_id FROM news_subscriptions');
  },
  startGame: async (channelId, gameType = 'noitu') => {
    await run('INSERT OR REPLACE INTO game_state (channel_id, game_type, is_active, last_word, last_user_id) VALUES (?, ?, 1, NULL, NULL)', [channelId, gameType]);
    if (gameType === 'noitu') {
      await run('DELETE FROM used_words WHERE channel_id = ?', [channelId]);
    }
  },
  stopGame: (channelId) => {
    return run('UPDATE game_state SET is_active = 0 WHERE channel_id = ?', [channelId]);
  },
  updateGameState: async (channelId, lastWord, lastUserId) => {
    await run('UPDATE game_state SET last_word = ?, last_user_id = ? WHERE channel_id = ?', [lastWord, lastUserId, channelId]);
    await run('INSERT INTO used_words (channel_id, word) VALUES (?, ?)', [channelId, lastWord.toLowerCase()]);
  },
  isWordUsed: async (channelId, word) => {
    const row = await get('SELECT 1 FROM used_words WHERE channel_id = ? AND word = ?', [channelId, word.toLowerCase()]);
    return !!row;
  },
  addPoints: (userId, username, points) => {
    return run(`
      INSERT INTO user_scores (user_id, username, points) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_id) DO UPDATE SET 
        points = user_scores.points + ?,
        username = ?
    `, [userId, username, points, points, username]);
  },
  getUserProfile: async (userId) => {
    const user = await get('SELECT * FROM user_scores WHERE user_id = ?', [userId]);
    if (user) return user;
    await run('INSERT INTO user_scores (user_id, username, points) VALUES (?, ?, ?)', [userId, 'Unknown', STARTING_BALANCE]);
    return get('SELECT * FROM user_scores WHERE user_id = ?', [userId]);
  },
  claimReward: async (userId, username, amount) => {
    const now = Date.now();
    await run(`
      INSERT INTO user_scores (user_id, username, points, last_reward_at) 
      VALUES (?, ?, ?, ?) 
      ON CONFLICT(user_id) DO UPDATE SET 
        points = user_scores.points + ?,
        last_reward_at = ?,
        username = ?
    `, [userId, username, amount, now, amount, now, username]);
  },
  deposit: async (userId, amount) => {
    await run('UPDATE user_scores SET points = points - ?, bank = bank + ? WHERE user_id = ? AND points >= ?', [amount, amount, userId, amount]);
  },
  withdraw: async (userId, amount) => {
    await run('UPDATE user_scores SET points = points + ?, bank = bank - ? WHERE user_id = ? AND bank >= ?', [amount, amount, userId, amount]);
  },
  takeLoan: async (userId, username, amount) => {
    const now = Date.now();
    await run(`
      INSERT INTO user_scores (user_id, username, points, loan, last_loan_at) 
      VALUES (?, ?, ?, ?, ?) 
      ON CONFLICT(user_id) DO UPDATE SET 
        points = user_scores.points + ?,
        loan = user_scores.loan + ?,
        last_loan_at = ?
    `, [userId, username, amount, amount, now, amount, amount, now]);
  },
  payback: async (userId, amount) => {
    await run('UPDATE user_scores SET points = points - ?, loan = loan - ? WHERE user_id = ? AND points >= ?', [amount, amount, userId, amount]);
  },
  getUserScore: (userId) => {
    return get('SELECT points FROM user_scores WHERE user_id = ?', [userId]);
  },
  hasEnoughPoints: async (userId, amount) => {
    const row = await get('SELECT points FROM user_scores WHERE user_id = ?', [userId]);
    return row && row.points >= amount;
  },
  getTopPlayers: (limit = 10) => {
    return all('SELECT username, points FROM user_scores ORDER BY points DESC LIMIT ?', [limit]);
  },
  getActiveGamesCount: async () => {
    const row = await get('SELECT COUNT(*) as count FROM game_state WHERE is_active = 1');
    return row ? row.count : 0;
  },
  initStorage: async (userId) => {
    await run('INSERT OR IGNORE INTO user_storage (user_id, capacity) VALUES (?, 100)', [userId]);
  },
  getStorage: async (userId) => {
    const info = await get('SELECT * FROM user_storage WHERE user_id = ?', [userId]);
    if (!info) { await run('INSERT INTO user_storage (user_id, capacity) VALUES (?, 100)', [userId]); return { user_id: userId, capacity: 100 }; }
    return info;
  },
  getStorageItems: async (userId, sold = 0) => {
    return all('SELECT * FROM storage_items WHERE user_id = ? AND sold = ? ORDER BY acquired_at DESC', [userId, sold]);
  },
  getStorageItem: async (itemId, userId) => {
    return get('SELECT * FROM storage_items WHERE id = ? AND user_id = ?', [itemId, userId]);
  },
  addItemToStorage: async (userId, name, tier, value) => {
    const info = await get('SELECT * FROM user_storage WHERE user_id = ?', [userId]);
    if (!info) {
      await run('INSERT INTO user_storage (user_id, capacity) VALUES (?, 100)', [userId]);
    }
    const count = await get('SELECT COUNT(*) as cnt FROM storage_items WHERE user_id = ? AND sold = 0', [userId]);
    if (count && count.cnt >= (info?.capacity || 100)) {
      return { error: 'Kho đã đầy!', capacity: info?.capacity || 100 };
    }
    await run('INSERT INTO storage_items (user_id, name, tier, value, acquired_at) VALUES (?, ?, ?, ?, ?)', [userId, name, tier, value, Date.now()]);
    return { ok: true };
  },
  sellItem: async (itemId, userId) => {
    const item = await get('SELECT * FROM storage_items WHERE id = ? AND user_id = ? AND sold = 0', [itemId, userId]);
    if (!item) return { error: 'Không tìm thấy vật phẩm.' };
    await run('UPDATE storage_items SET sold = 1 WHERE id = ?', [itemId]);
    return { value: item.value };
  },
  sellAllItems: async (userId) => {
    const items = await all('SELECT * FROM storage_items WHERE user_id = ? AND sold = 0', [userId]);
    if (items.length === 0) return { error: 'Kho trống, không có gì để bán.' };
    const total = items.reduce((sum, item) => sum + item.value, 0);
    await run('UPDATE storage_items SET sold = 1 WHERE user_id = ? AND sold = 0', [userId]);
    return { total, count: items.length };
  },
  upgradeStorage: async (userId) => {
    const info = await get('SELECT * FROM user_storage WHERE user_id = ?', [userId]);
    if (!info) {
      await run('INSERT INTO user_storage (user_id, capacity) VALUES (?, 100)', [userId]);
      return { capacity: 100, cost: 0 };
    }
    const current = info.capacity;
    if (current >= 200) return { error: 'Kho đã đạt cấp tối đa (200 ô).' };
    const upgrades = { 100: { next: 150, cost: 5000 }, 150: { next: 200, cost: 15000 } };
    const upgrade = upgrades[current];
    if (!upgrade) return { error: 'Cấp độ không hợp lệ.' };
    return { capacity: current, nextCapacity: upgrade.next, cost: upgrade.cost };
  },
  applyUpgradeStorage: async (userId) => {
    const info = await get('SELECT * FROM user_storage WHERE user_id = ?', [userId]);
    const current = info?.capacity || 100;
    const upgrades = { 100: { next: 150, cost: 5000 }, 150: { next: 200, cost: 15000 } };
    const upgrade = upgrades[current];
    if (!upgrade) return { error: 'Không thể nâng cấp thêm.' };
    await run('UPDATE user_storage SET capacity = ? WHERE user_id = ?', [upgrade.next, userId]);
    return { capacity: upgrade.next, cost: upgrade.cost };
  },
  getStorageValue: async (userId) => {
    const row = await get('SELECT COALESCE(SUM(value), 0) as total, COUNT(*) as count FROM storage_items WHERE user_id = ? AND sold = 0', [userId]);
    return row || { total: 0, count: 0 };
  },
  getDFItemCount: async () => {
    const row = await get('SELECT COUNT(*) as count FROM df_items');
    return row ? row.count : 0;
  },
  getRandomDFItem: async () => {
    return get('SELECT * FROM df_items ORDER BY RANDOM() LIMIT 1');
  },
  CURRENCY_NAME,
  CURRENCY_ICON,
  run,
  all,
  get,
};
