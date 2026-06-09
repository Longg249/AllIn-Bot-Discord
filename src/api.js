const { exec } = require('child_process');
const path = require('path');

// Use the local dictionary.db
const dbPath = path.resolve(__dirname, '../dictionary.db');

module.exports = {
  isValidWord: (word) => {
    return new Promise((resolve, reject) => {
      // Use sqlite3 CLI to check for the word
      const query = `SELECT 1 FROM words WHERE word = '${word.toLowerCase().replace(/'/g, "''")}' AND lang_code = 'vi' LIMIT 1`;
      const cmd = `sqlite3 ${dbPath} "${query}"`;

      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          console.error('Database Error:', stderr);
          resolve(false);
        } else {
          resolve(stdout.trim() === '1');
        }
      });
    });
  },
};
