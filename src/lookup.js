const https = require('https');

const fetch = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
  }).on('error', reject);
});

module.exports = {
  wiki: async (query) => {
    try {
      const url = `https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const data = await fetch(url);
      if (data.type === 'disambiguation') {
        return `📚 **${query}** có nhiều nghĩa:\n${data.extract || 'Xem chi tiết tại trang Wikipedia.'}`;
      }
      if (data.extract) {
        const ext = data.extract.length > 1500 ? data.extract.slice(0, 1500) + '...' : data.extract;
        return `📖 **${data.title}**\n${ext}\n🔗 ${data.content_urls?.desktop?.page || url}`;
      }
      return `❌ Không tìm thấy kết quả cho "${query}".`;
    } catch (err) {
      return `❌ Lỗi tra cứu Wikipedia: ${err.message}`;
    }
  },

  define: async (word) => {
    try {
      const data = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!Array.isArray(data) || data.length === 0) {
        return `❌ Không tìm thấy từ "${word}".`;
      }
      const entry = data[0];
      let msg = `📖 **${entry.word}**`;
      if (entry.phonetic) msg += ` (${entry.phonetic})`;

      for (const meaning of entry.meanings.slice(0, 3)) {
        const defs = meaning.definitions.slice(0, 2);
        for (const d of defs) {
          msg += `\n• *${meaning.partOfSpeech}*: ${d.definition}`;
          if (d.example) msg += `\n  _VD: ${d.example}_`;
        }
      }
      return msg;
    } catch (err) {
      return `❌ Lỗi tra từ điển: ${err.message}`;
    }
  },

  search: async (query) => {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const data = await fetch(url);

      let msg = `🔍 **Kết quả tìm kiếm cho:** ${query}\n`;

      if (data.AbstractText) {
        msg += `\n${data.AbstractText.slice(0, 1000)}`;
        if (data.AbstractURL) msg += `\n🔗 ${data.AbstractURL}`;
      }

      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const count = data.AbstractText ? 3 : 5;
        msg += `\n\n**Liên quan:**`;
        for (const topic of data.RelatedTopics.slice(0, count)) {
          if (topic.Text) {
            const text = topic.Text.length > 200 ? topic.Text.slice(0, 200) + '...' : topic.Text;
            msg += `\n• ${text}`;
          }
        }
      }

      if (!data.AbstractText && (!data.RelatedTopics || data.RelatedTopics.length === 0)) {
        msg += '\n*(Không có kết quả nổi bật)*';
      }

      return msg;
    } catch (err) {
      return `❌ Lỗi tìm kiếm: ${err.message}`;
    }
  },
};
