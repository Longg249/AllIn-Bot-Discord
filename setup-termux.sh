#!/data/data/com.termux/files/usr/bin/bash

echo "===================================================="
echo "   AllIn-Bot-Discord Setup for Termux"
echo "===================================================="

# 1. Update system
echo "[1/4] Đang cập nhật hệ thống..."
pkg update -y && pkg upgrade -y

# 2. Install dependencies
echo "[2/4] Đang cài đặt Node.js và công cụ build..."
pkg install -y nodejs python binutils build-essential clang make sqlite

# 3. Install NPM packages
echo "[3/4] Đang cài đặt thư viện Node.js..."
# Xóa node_modules cũ nếu có để tránh xung đột kiến trúc
rm -rf node_modules package-lock.json
npm install --build-from-source sqlite3
npm install

# 4. Rebuild sqlite3 (Quan trọng cho Termux)
echo "[4/5] Đang tối ưu hóa Database cho Termux..."
npm rebuild sqlite3

# 5. Merge dictionary if needed
echo "[5/5] Đang kiểm tra Database từ điển..."
if [ ! -f "dictionary.db" ] && [ -f "dictionary.db.partaa" ]; then
    cat dictionary.db.partaa dictionary.db.partab > dictionary.db
    echo "[+] Đã hợp nhất Database từ điển."
fi

echo "----------------------------------------------------"
echo "✅ Cài đặt hoàn tất!"
echo "👉 Bước tiếp theo:"
echo "1. Chỉnh sửa file .env (thêm Token và Client ID)"
echo "2. Chạy bot bằng lệnh: bash start.sh"
echo "----------------------------------------------------"
