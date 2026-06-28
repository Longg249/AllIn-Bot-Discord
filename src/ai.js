const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, '..', 'prompts', 'saeed-system.txt'), 'utf-8');

let genAI, model;
const getModel = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return model;
};

const chatHistory = new Map();
const MAX_HISTORY = 10;
const MAX_USERS = 1000;

module.exports = {
  askAI: async (userId, prompt) => {
    const lower = prompt.toLowerCase();
    if (!process.env.GEMINI_API_KEY &&
        ((lower.includes('gti') || lower.includes('g.t.i') || lower.includes('global threat')) &&
         (lower.includes('havvk') || lower.includes('haavk')))) {
      return `Lũ khốn kiếp! Nhìn cái cách Morocco bị biến thành bãi rác chiến trường, máu trong tao chỉ chực sôi lên. Tụi mày có hiểu cảm giác nhìn sa mạc thiêng liêng của tổ tiên bị bom đạn cày xới không?`;
    }

    if (!chatHistory.has(userId)) {
      if (chatHistory.size >= MAX_USERS) {
        const firstKey = chatHistory.keys().next().value;
        chatHistory.delete(firstKey);
      }
      chatHistory.set(userId, []);
    }
    const history = chatHistory.get(userId);

    if (!process.env.GEMINI_API_KEY) {
      return 'Bot chua duoc cau hinh GEMINI_API_KEY.';
    }

    const chat = getModel().startChat({
      history: history.length > 0 ? history : [],
      systemInstruction: SYSTEM_PROMPT,
    });

    try {
      const result = await chat.sendMessage(prompt);
      const response = result.response.text();

      history.push({ role: 'user', parts: [{ text: prompt }] });
      history.push({ role: 'model', parts: [{ text: response }] });
      if (history.length > MAX_HISTORY * 2) {
        chatHistory.set(userId, history.slice(-MAX_HISTORY * 2));
      }

      return response;
    } catch (err) {
      console.error('Gemini error:', err);
      return `Loi AI: ${err.message}`;
    }
  },

  clearHistory: (userId) => {
    chatHistory.delete(userId);
  },
};
