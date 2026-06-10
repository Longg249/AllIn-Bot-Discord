module.exports = {
  play: (bet) => {
    const symbols = ['🍒', '🍋', '🍇', '💎', '🔔'];
    const result = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];
    
    let multiplier = 0;
    let title = '😞 Rất tiếc!';
    let color = 0xed4245; // Red

    if (result[0] === result[1] && result[1] === result[2]) {
      multiplier = 5; // Trúng cả 3
      title = '💎 SIÊU THẮNG (JACKPOT)!';
      color = 0xf1c40f; // Gold
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      multiplier = 1.5; // Trúng 2
      title = '🎉 Thắng lớn!';
      color = 0x2ecc71; // Green
    }
    
    const win = Math.floor(multiplier * bet);
    return { result, win, multiplier, title, color };
  }
};
