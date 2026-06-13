const { spawn } = require('child_process');

function restartBot() {
  console.log('🔄 [System] Restarting bot...');
  
  // Relaunch the process
  const child = spawn(process.argv[0], process.argv.slice(1), {
    detached: true,
    stdio: 'inherit'
  });
  
  child.unref();
  process.exit(0);
}

module.exports = { restartBot };
