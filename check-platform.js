const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 [System] Checking environment compatibility...');

try {
    // Thử load sqlite3
    require('sqlite3');
    console.log('✅ [System] SQLite3 is compatible.');
} catch (e) {
    console.log('⚠️ [System] SQLite3 incompatibility detected (GLIBC or Arch mismatch).');
    console.log('🛠️ [System] Running automatic repair...');

    try {
        if (process.env.TERMUX_VERSION) {
            console.log('📱 [Termux] Detected Termux environment. Rebuilding from source...');
            execSync('npm install sqlite3@5.1.7 --build-from-source --no-save', { stdio: 'inherit' });
        } else {
            console.log('☁️ [Server/Docker] Attempting to install compatible version...');
            execSync('npm install sqlite3@5.1.7 --no-save', { stdio: 'inherit' });
        }
        console.log('✅ [System] Repair successful!');
    } catch (err) {
        console.error('❌ [System] Critical: Automatic repair failed. Please install build-essential/python.');
        process.exit(1);
    }
}
