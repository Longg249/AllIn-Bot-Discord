const axios = require('axios');

const PORT = process.env.WEBHOOK_PORT || 3000;

async function checkHealth() {
  try {
    const res = await axios.get(`http://localhost:${PORT}/health`, { timeout: 10000 });
    const health = res.data;
    let allOk = true;

    for (const [key, value] of Object.entries(health)) {
      if (key !== 'server' && !value.alive) {
        console.error(`Webhook ${key.toUpperCase()} failed`);
        allOk = false;
      }
    }

    if (allOk) {
      console.log('All webhooks healthy');
    } else {
      console.warn('Webhook errors detected');
    }
  } catch (e) {
    console.error(`Health check connection failed: ${e.message}`);
  }
}

checkHealth();
setInterval(checkHealth, 300000);
