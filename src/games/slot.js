module.exports = {
  play: (bet) => {
    const symbols = ['🍒', '🍋', '🍇', '💎', '🔔'];
    const result = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];
    
    let multiplier = 0;
    if (result[0] === result[1] && result[1] === result[2]) {
      multiplier = 5; // Trúng cả 3
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      multiplier = 1.5; // Trúng 2
    }
    
    const win = multiplier * bet;
    return { result, win, multiplier };
  }
};
