const { isValidWord } = require('../api');
const { updateGameState, isWordUsed, addPoints } = require('../database');

const isValidChain = (prevWord, nextWord) => {
  if (!prevWord) return true;
  const prevSyllables = prevWord.trim().toLowerCase().split(/\s+/);
  const nextSyllables = nextWord.trim().toLowerCase().split(/\s+/);
  const lastSyllableOfPrev = prevSyllables[prevSyllables.length - 1];
  const firstSyllableOfNext = nextSyllables[0];
  return lastSyllableOfPrev === firstSyllableOfNext;
};

module.exports = {
  handleMessage: async (message, state, tools) => {
    const { content, clearTimer, setTimer } = tools;
    
    // Ignore global bot commands
    if (content.startsWith('!')) return;

    if (state.last_word === null) {
      const valid = await isValidWord(content);
      if (valid) {
        await updateGameState(message.channel.id, content, message.author.id);
        setTimer(message.channel.id);
        message.reply(`✅ "${content}" hợp lệ! Tiếp theo: bắt đầu bằng "${content.split(/\s+/).pop()}". Bạn có 15s.`);
      } else {
        message.reply(`❌ "${content}" không phải là một từ tiếng Việt hợp lệ.`);
      }
    } else {
      if (isValidChain(state.last_word, content)) {
        if (await isWordUsed(message.channel.id, content)) {
          message.reply(`❌ "${content}" đã được sử dụng rồi.`);
          return;
        }
        const valid = await isValidWord(content);
        if (valid) {
          await updateGameState(message.channel.id, content, message.author.id);
          await addPoints(message.author.id, message.author.username, 100);
          
          clearTimer(message.channel.id);
          setTimer(message.channel.id);

          message.reply(`✅ "${content}" hợp lệ! +100 ${require('../database').CURRENCY_NAME}. Tiếp theo: bắt đầu bằng "${content.split(/\s+/).pop()}". Bạn có 15s.`);
        } else {
          message.reply(`❌ "${content}" không phải là một từ tiếng Việt hợp lệ.`);
        }
      } else {
        const prevSyllables = state.last_word.trim().toLowerCase().split(/\s+/);
        const lastSyllable = prevSyllables[prevSyllables.length - 1];
        message.reply(`❌ "${content}" không nối được với "${state.last_word}". Từ phải bắt đầu bằng "${lastSyllable}". Hãy thử lại!`);
      }
    }
  }
};
