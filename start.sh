#!/bin/bash

echo "===================================================="
echo "   AllIn-Bot-Discord Startup Script (Linux/Mac)"
echo "===================================================="

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[!] Error: Node.js is not installed."
    echo "Please install Node.js using your package manager (apt, brew, etc.)"
    exit 1
fi
echo "[+] Node.js detected: $(node -v)"

# 2. Check for package.json
if [ ! -f "package.json" ]; then
    echo "[!] Error: package.json not found in this directory."
    exit 1
fi

# 3. Check node_modules and install dependencies
if [ ! -d "node_modules" ]; then
    echo "[!] node_modules folder missing. Installing dependencies..."
    npm install --silent
    if [ $? -ne 0 ]; then
        echo "[!] npm install failed."
        exit 1
    fi
    echo "[+] Dependencies installed successfully."
else
    echo "[+] node_modules detected."
fi

# 4. Check dictionary database
if [ ! -f "dictionary.db" ]; then
    if [ -f "dictionary.db.partaa" ]; then
        echo "[+] dictionary.db missing but parts found. Merging..."
        cat dictionary.db.partaa dictionary.db.partab > dictionary.db
        echo "[+] dictionary.db merged successfully."
    else
        echo "[!] Warning: dictionary.db not found. Game Noitu might not work."
    fi
fi

# 5. Check .env file
if [ ! -f ".env" ]; then
    echo "[!] Warning: .env file not found."
    echo "Please create a .env file with DISCORD_TOKEN and CLIENT_ID."
fi

# 5. Run the bot
echo "[+] Starting the bot..."
echo "----------------------------------------------------"
node check-env.js && node index.js
echo "----------------------------------------------------"
