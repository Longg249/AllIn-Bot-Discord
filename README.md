# AllIn-Bot-Discord

AllIn-Bot là một bot Discord đa năng được phát triển đặc biệt để chạy mượt mà trên môi trường Termux (Android).

> **⚠️ Disclaimer:** Các trò chơi trong bot này chỉ dành cho mục đích giải trí. Tất cả đơn vị tiền tệ trong game chỉ là tiền ảo, không có giá trị thật và không liên quan đến bất kỳ hình thức cá cược tiền thật nào.

## 🎮 Các Trò Chơi

*   **Nối Từ (`noitu.js`):** Trò chơi trí tuệ thách thức vốn từ vựng của bạn.
*   **Over/Under (`overUnder.js`):** Trò chơi dự đoán tài xỉu đầy kịch tính.
*   **Slot Machine (`slot.js`):** Vòng quay may mắn với cơ hội trúng thưởng lớn.

## 🛠 Các Tính Năng Khác

*   **Cập Nhật Tin Tức:** Tự động theo dõi và cập nhật các thông tin mới nhất.
*   **Hệ Thống Tiền Tệ (Economy):** Kiếm tiền thông qua các trò chơi, lưu trữ dữ liệu người dùng an toàn.
*   **Hỗ Trợ Termux (Android):** Tối ưu hóa chạy trên điện thoại, hỗ trợ tạo shortcut widget khởi chạy nhanh.

---

## 🚀 Hướng Dẫn Cài Đặt

### 1. Chuẩn bị
- Tải [Termux](https://f-droid.org/packages/com.termux/) từ **F-Droid**.
- Mở Termux và cấp quyền lưu trữ:
  ```bash
  termux-setup-storage
  ```

### 2. Cài Đặt Dependencies
Chạy lệnh sau:
```bash
pkg update -y && pkg upgrade -y
pkg install -y nodejs python make gcc build-essential git libsqlite
```

### 3. Cài Đặt Bot
```bash
git clone https://github.com/Longg249/AllIn-Bot-Discord ~/allin-bot
cd ~/allin-bot
npm install
npm rebuild sqlite3
```

### 4. Cấu Hình
Tạo file `.env` và nhập thông tin:
```bash
nano .env
```
*(Nhập: `DISCORD_TOKEN`, `CLIENT_ID`, `WEBHOOK_SECRET`)*

### 5. Khởi Chạy
- Đăng ký lệnh: `node deploy-commands.js`
- Chạy Bot: `node index.js`

---

## 🛠 Tiện Ích Termux (Widget)
1. Cài **Termux:Widget** từ F-Droid.
2. Chạy: `bash setup-widget.sh`
3. Thêm widget ra màn hình chính, chọn `allin-bot`.

---

## 📁 Cấu Trúc Thư Mục
- `index.js`: File chính.
- `src/games/`: Chứa code các trò chơi.
- `dictionary.db`: Dữ liệu game Nối Từ.

---
*Phát triển bởi Longg249.*
