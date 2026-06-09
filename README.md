# Cài Đặt allin-bot trên Termux

> **⚠️ Disclaimer:** Các trò chơi trong bot này chỉ dành cho mục đích giải trí. Tất cả đơn vị tiền tệ trong game chỉ là tiền ảo, không có giá trị thật và không liên quan đến bất kỳ hình thức cá cược tiền thật nào.

## 1. Cài Đặt Termux

- Tải Termux từ **F-Droid** (bản từ Play Store đã lỗi thời)
- Mở Termux, chạy:

```bash
pkg update -y
pkg upgrade -y
pkg install -y nodejs python make gcc build-essential git
```

## 2. Copy Bot Vào Máy

Có 2 cách:

### Cách A — Clone từ Git

```bash
git clone <url-repo> ~/allin-bot
cd ~/allin-bot
```

### Cách B — Copy từ máy tính qua USB/MTP

Copy thư mục project vào `Internal Storage/allin-bot/`, rồi trên Termux:

```bash
cp -r ~/storage/shared/allin-bot ~/
cd ~/allin-bot
```

## 3. Cài Dependencies

```bash
npm install
npm rebuild sqlite3
```

Nếu `sqlite3` báo lỗi, chạy:

```bash
pkg install -y libsqlite
npm rebuild sqlite3
```

## 4. Cấu Hình .env

Tạo file `.env` trong thư mục project:

```
DISCORD_TOKEN=token_của_bot
CLIENT_ID=id_của_bot
GEMINI_API_KEY=key_của_gemini  # optional
WEBHOOK_SECRET=your_webhook_secret
```

## 5. Chạy Thử

```bash
node deploy-commands.js
node index.js
```

## 6. Tạo Shortcut Termux:Widget

```bash
bash setup-widget.sh
```

Sau đó:
- Cài **Termux:Widget** từ F-Droid
- Thêm widget Termux lên màn hình chính
- Chọn **allin-bot** từ danh sách

Nhấn widget là bot chạy ngay.

## 7. Dừng Bot

- Kéo thanh thông báo Termux xuống
- Nhấn **Exit**

## Cấu Trúc Thư Mục

```
allin-bot/
├── index.js          # File chính của bot
├── deploy-commands.js  # Đăng ký slash commands
├── .env              # Config token, key
├── game.db           # Database SQLite
├── dictionary.db     # Dictionary database
├── src/              # Source code
├── logs/             # Logs
├── item_df/          # Data files
├── setup-termux.sh   # Cài dependencies
├── setup-widget.sh   # Tạo widget shortcut
├── monitor-bot.sh    # Script giám sát
└── README.md
```

