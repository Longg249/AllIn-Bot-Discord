const store = {
  news: { items: [], updatedAt: null },
  crypto: { content: null, prevContent: null, updatedAt: null },
  exchange: { content: null, prevContent: null, updatedAt: null },
  fuel: { content: null, prevContent: null, updatedAt: null },
  gold: { content: null, prevContent: null, updatedAt: null },
};

// Try to extract first price-like number from text ($12,345 / 12.345 / 12345)
const extractPrice = (text) => {
  if (!text) return null;
  const m = text.match(/([\d,]+\.?\d*)/);
  if (!m) return null;
  return parseFloat(m[1].replace(/,/g, ''));
};

const formatChange = (current, previous) => {
  const curPrice = extractPrice(current);
  const prevPrice = extractPrice(previous);
  if (curPrice === null || prevPrice === null || prevPrice === 0) return '';
  const diff = curPrice - prevPrice;
  const pct = ((diff / prevPrice) * 100).toFixed(2);
  const arrow = diff > 0 ? '📈' : '📉';
  const color = diff > 0 ? '🟢' : '🔴';
  return `\n${color} ${arrow} **${diff > 0 ? '+' : ''}${diff.toLocaleString()} (${diff > 0 ? '+' : ''}${pct}%)** so với lần cập nhật trước`;
};

module.exports = {
  setNews(data) {
    store.news = { items: data, updatedAt: new Date() };
  },
  getNews() {
    return store.news;
  },

  setCrypto(content) {
    const old = store.crypto.content;
    store.crypto = { content, prevContent: old, updatedAt: new Date() };
  },
  getCrypto() {
    const data = store.crypto;
    return {
      content: data.content,
      updatedAt: data.updatedAt,
      change: formatChange(data.content, data.prevContent),
    };
  },

  setExchange(content) {
    const old = store.exchange.content;
    store.exchange = { content, prevContent: old, updatedAt: new Date() };
  },
  getExchange() {
    const data = store.exchange;
    return {
      content: data.content,
      updatedAt: data.updatedAt,
      change: formatChange(data.content, data.prevContent),
    };
  },

  setFuel(content) {
    const old = store.fuel.content;
    store.fuel = { content, prevContent: old, updatedAt: new Date() };
  },
  getFuel() {
    const data = store.fuel;
    return {
      content: data.content,
      updatedAt: data.updatedAt,
      change: formatChange(data.content, data.prevContent),
    };
  },

  setGold(content) {
    const old = store.gold.content;
    store.gold = { content, prevContent: old, updatedAt: new Date() };
  },
  getGold() {
    const data = store.gold;
    return {
      content: data.content,
      updatedAt: data.updatedAt,
      change: formatChange(data.content, data.prevContent),
    };
  },
};
