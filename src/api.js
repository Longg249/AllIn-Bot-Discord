const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the local dictionary.db
const dbPath = path.resolve(__dirname, '../dictionary.db');
const db = new sqlite3.Database(dbPath);

module.exports = {
  isValidWord: (word) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT 1 FROM words WHERE word = ? AND lang_code = 'vi' LIMIT 1`;
      db.get(query, [word.toLowerCase()], (err, row) => {
        if (err) {
          console.error('Database Error:', err.message);
          resolve(false);
        } else {
          resolve(!!row);
        }
      });
    });
  },
};
