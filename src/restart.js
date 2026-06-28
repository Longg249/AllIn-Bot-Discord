let cleanup = [];

function onCleanup(fn) {
  cleanup.push(fn);
}

async function gracefulShutdown() {
  console.log('Shutting down gracefully...');
  for (const fn of cleanup) {
    try { await fn(); } catch (e) { console.error('Cleanup error:', e); }
  }
  cleanup = [];
  process.exit(0);
}

function restartBot() {
  console.log('Restarting...');
  gracefulShutdown();
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = { restartBot, onCleanup, gracefulShutdown };
