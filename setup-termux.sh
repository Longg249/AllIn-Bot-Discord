#!/data/data/com.termux/files/usr/bin/bash
# Setup script for Termux
pkg update -y
pkg install -y nodejs python make gcc build-essential
npm install
npm rebuild sqlite3
echo "Setup done! Run: node index.js"
