@echo off
:: Deploy with Rollback Script (Windows)
:: This script updates the bot, checks if it starts correctly, 
:: and automatically rolls back if it fails.

echo [INFO] Starting deployment with rollback...

:: 1. Save current state
echo [INFO] Stashing current changes...
git stash >nul 2>&1

:: 2. Update
echo [INFO] Pulling latest changes...
git pull
if %errorlevel% neq 0 (
    echo [ERROR] Git pull failed. Rolling back...
    git stash pop
    pause
    exit /b 1
)

:: 3. Install Dependencies
echo [INFO] Installing dependencies...
call npm install --silent
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Rolling back...
    git reset --hard HEAD@{1}
    pause
    exit /b 1
)

:: 4. Health Check
echo [INFO] Running health check (10s)...
:: Start the bot in background and capture PID
start /B node index.js > bot.log 2>&1
:: Note: Getting PID of the started process in batch is tricky without tools,
:: we will rely on checking if the process is running.

:: Wait 10 seconds
timeout /t 10 >nul

:: Check if process is still running (using tasklist)
tasklist /FI "IMAGENAME eq node.exe" | find "node.exe" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Bot is running stable. Deployment successful.
    :: Kill the node process started by this script
    taskkill /F /IM node.exe /T >nul 2>&1
    exit /b 0
) else (
    echo [ERROR] Bot crashed during health check. Rolling back...
    git reset --hard HEAD@{1}
    call npm install --silent
    echo [INFO] Previous version restored.
    pause
    exit /b 1
)
