const database = require('./database');

const parseTime = (str) => {
  str = str.toLowerCase();
  let totalMs = 0;

  // Try absolute format HH:MM
  const absMatch = str.match(/^(\d{1,2}):(\d{2})$/);
  if (absMatch) {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
      parseInt(absMatch[1]), parseInt(absMatch[2]), 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target.getTime() - now.getTime();
  }

  // Relative format: 30s, 5m, 1h, 2h30m, 1d
  const relMatch = str.match(/^(\d+d)?\s*(\d+h)?\s*(\d+m)?\s*(\d+s)?$/);
  if (relMatch) {
    const d = parseInt(relMatch[1]) || 0;
    const h = parseInt(relMatch[2]) || 0;
    const m = parseInt(relMatch[3]) || 0;
    const s = parseInt(relMatch[4]) || 0;
    totalMs = d * 86400000 + h * 3600000 + m * 60000 + s * 1000;
    if (totalMs > 0) return totalMs;
  }

  return null;
};

module.exports = {
  parseTime,

  setReminder: async (userId, channelId, timeStr, message) => {
    const ms = parseTime(timeStr);
    if (!ms) return { error: '⏰ Định dạng thời gian không hợp lệ. VD: `30m`, `1h`, `2h30m`, `1d`, `14:30`' };
    if (ms < 30000) return { error: '⏰ Thời gian tối thiểu là 30 giây.' };
    if (ms > 86400000 * 30) return { error: '⏰ Thời gian tối đa là 30 ngày.' };

    const remindAt = Date.now() + ms;
    await database.run(
      'INSERT INTO reminders (user_id, channel_id, message, remind_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [userId, channelId, message, remindAt, Date.now()]
    );

    const display = ms >= 86400000 ? `${Math.floor(ms / 86400000)} ngày` :
      ms >= 3600000 ? `${Math.floor(ms / 3600000)}h${Math.floor((ms % 3600000) / 60000)}m` :
      `${Math.floor(ms / 60000)} phút`;

    return { ok: true, display, remindAt };
  },

  checkReminders: async (client) => {
    const rows = await database.all(
      'SELECT * FROM reminders WHERE remind_at <= ? AND notified = 0',
      [Date.now()]
    );
    for (const row of rows) {
      try {
        await database.run('UPDATE reminders SET notified = 1 WHERE id = ?', [row.id]);
        const user = await client.users.fetch(row.user_id);
        if (user) {
          await user.send(`⏰ **Nhắc nhở:** ${row.message}`).catch(() => {});
        }
        if (row.channel_id) {
          const channel = await client.channels.fetch(row.channel_id).catch(() => null);
          if (channel) {
            await channel.send(`<@${row.user_id}> ⏰ **Nhắc nhở:** ${row.message}`);
          }
        }
      } catch (e) {
        console.error(`Reminder ${row.id} failed:`, e.message);
      }
    }
  },
};
