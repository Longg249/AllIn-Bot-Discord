@echo off
SETLOCAL EnableExtensions

echo ====================================================
echo    AllIn-Bot-Discord Startup Script (Windows)
echo ====================================================

:: 1. Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Error: Node.js is not installed.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [+] Node.js detected.

:: 2. Check for package.json
if not exist "package.json" (
    echo [!] Error: package.json not found in this directory.
    pause
    exit /b 1
)

:: 3. Check node_modules and install dependencies
if not exist "node_modules\" (
    echo [!] node_modules folder missing. Installing dependencies...
    npm install --silent
    if %errorlevel% neq 0 (
        echo [!] npm install failed.
        pause
        exit /b 1
    )
    echo [+] Dependencies installed successfully.
) else (
    echo [+] node_modules detected.
)

:: 4. Check dictionary database
if not exist "dictionary.db" (
    if exist "dictionary.db.partaa" (
        echo [+] dictionary.db missing but parts found. Merging...
        copy /b dictionary.db.partaa + dictionary.db.partab dictionary.db >nul
        echo [+] dictionary.db merged successfully.
    ) else (
        echo [!] Warning: dictionary.db not found. Game Noitu might not work.
    )
)

:: 5. Check .env file
if not exist ".env" (
    echo [!] Warning: .env file not found. 
    echo Please create a .env file with DISCORD_TOKEN and CLIENT_ID.
    pause
)

:: 5. Run the bot
echo [+] Starting the bot...
echo ----------------------------------------------------
node index.js
echo ----------------------------------------------------

pause
