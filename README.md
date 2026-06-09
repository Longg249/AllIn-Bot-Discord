# AllIn-Bot-Discord

AllIn-Bot là một bot Discord đa năng được phát triển đặc biệt để chạy mượt mà trên môi trường Termux (Android). Bot tập trung vào tính năng giải trí với các trò chơi tương tác thú vị.

> **⚠️ Disclaimer:** Các trò chơi trong bot này chỉ dành cho mục đích giải trí. Tất cả đơn vị tiền tệ trong game chỉ là tiền ảo, không có giá trị thật và không liên quan đến bất kỳ hình thức cá cược tiền thật nào.

## 🎮 Các Tính Năng Chính

*   **Trò Chơi Tương Tác:**
    *   **Nối Từ (NoiTu):** Trò chơi trí tuệ thách thức vốn từ vựng của bạn.
    *   **Over/Under:** Trò chơi dự đoán tài xỉu đầy kịch tính.
    *   **Cập Nhật Tin Tức:**
        *   Tự động theo dõi và cập nhật các thông tin mới nhất.
*   **Hệ Thống Tiền Tệ (Economy):**
    *   Kiếm tiền thông qua các trò chơi.
    *   Hệ thống lưu trữ dữ liệu người dùng an toàn.
*   **Hỗ Trợ Termux (Android):**
    *   Tối ưu hóa để chạy liên tục trên điện thoại Android.
    *   Hỗ trợ tạo shortcut widget để khởi chạy nhanh.

---

## 🚀 Hướng Dẫn Cài Đặt

### 1. Chuẩn bị
- Tải [Termux](https://f-droid.org/packages/com.termux/) từ **F-Droid** (khuyên dùng).
- Mở Termux và cấp quyền lưu trữ:
  ```bash
  termux-setup-storage
  ```

### 2. Cài Đặt Dependencies
Chạy lệnh sau để cài đặt các công cụ cần thiết:
```bash
pkg update -y && pkg upgrade -y
pkg install -y nodejs python make gcc build-essential git libsqlite
```

### 3. Cài Đặt Bot
Clone dự án từ GitHub:
```bash
git clone https://github.com/Longg249/AllIn-Bot-Discord ~/allin-bot
cd ~/allin-bot
npm install
npm rebuild sqlite3
```

### 4. Cấu Hình
Tạo file `.env` trong thư mục `~/allin-bot`:
```bash
nano .env
```
Nhập các thông tin sau:
```
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
WEBHOOK_SECRET=your_webhook_secret
```
*(Nhấn `Ctrl+O`, `Enter` để lưu và `Ctrl+X` để thoát)*

### 5. Khởi Chạy
- **Đăng ký lệnh (cần chạy 1 lần):**
  ```bash
  node deploy-commands.js
  ```
- **Chạy Bot:**
  ```bash
  node index.js
  ```

---

## 🛠 Tiện Ích Termux (Widget)
Bạn có thể khởi chạy bot ngay từ màn hình chính điện thoại bằng **Termux:Widget**:
1. Cài đặt **Termux:Widget** từ F-Droid.
2. Trong Termux, chạy script:
   ```bash
   bash setup-widget.sh
   ```
3. Thêm widget **Termux:Widget** ra màn hình chính và chọn `allin-bot`.

---

## 📁 Cấu Trúc Thư Mục
- `index.js`: Điểm bắt đầu của bot.
- `src/`: Chứa code xử lý logic các trò chơi (`games/`).
- `dictionary.db`: Dữ liệu cho game Nối Từ.
- `setup-widget.sh`: Script cài đặt shortcut cho Widget.

---
*Phát triển bởi Longg249.*
