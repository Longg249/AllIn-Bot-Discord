#!/bin/bash

# Deploy with Rollback Script
# This script updates the bot, checks if it starts correctly, 
# and automatically rolls back if it fails.

echo "[INFO] Starting deployment with rollback..."

# 1. Save current state
echo "[INFO] Stashing current changes..."
git stash > /dev/null

# 2. Update
echo "[INFO] Pulling latest changes..."
git pull
if [ $? -ne 0 ]; then
    echo "[ERROR] Git pull failed. Rolling back..."
    git stash pop
    exit 1
fi

# 3. Install Dependencies
echo "[INFO] Installing dependencies..."
npm install --silent
if [ $? -ne 0 ]; then
    echo "[ERROR] npm install failed. Rolling back..."
    git reset --hard HEAD@{1}
    exit 1
fi

# 4. Health Check
echo "[INFO] Running health check (10s)..."
# Start the bot in background
node index.js > bot.log 2>&1 &
BOT_PID=$!

# Wait 10 seconds
sleep 10

# Check if process is still running
if ps -p $BOT_PID > /dev/null; then
    echo "[SUCCESS] Bot is running stable. Deployment successful."
    # We could leave it running, or kill it if the main loop handles startup
    # For now, let's kill it so the main startup script can take over if needed
    kill $BOT_PID
    exit 0
else
    echo "[ERROR] Bot crashed during health check. Rolling back..."
    git reset --hard HEAD@{1}
    npm install --silent
    echo "[INFO] Previous version restored."
    exit 1
fi
