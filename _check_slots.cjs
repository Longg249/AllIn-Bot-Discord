const { exec } = require('child_process');

const dbPath = 'item_df/auction_items.db';

const runQuery = (query) => {
  return new Promise((resolve, reject) => {
    const cmd = `sqlite3 -json ${dbPath} "${query}"`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(JSON.parse(stdout));
    });
  });
};

(async () => {
  console.log('Auction Items Check:');

  try {
    const rows1 = await runQuery("SELECT DISTINCT LENGTH(name) as len, name FROM auction_items WHERE name LIKE '%slot%' OR name LIKE '%ô%' OR name LIKE '%x%' LIMIT 20");
    console.log('Items with slot-like names:');
    rows1.forEach(r => console.log(' ', r.name));

    const rows2 = await runQuery("SELECT name FROM auction_items ORDER BY RANDOM() LIMIT 20");
    console.log('\nRandom items:');
    rows2.forEach(r => console.log(' ', r.name));
  } catch (e) {
    console.error('Error:', e);
  }
})();
