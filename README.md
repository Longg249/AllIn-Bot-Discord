# AllIn-Bot-Discord

AllIn-Bot là một bot Discord đa năng, hiện đại, tích hợp AI và nhiều trò chơi giải trí, được tối ưu hóa cho cả môi trường **Windows** và **Termux (Android)**.

> **⚠️ Disclaimer:** Các trò chơi trong bot này chỉ dành cho mục đích giải trí. Tất cả đơn vị tiền tệ trong game chỉ là tiền ảo, không có giá trị thật và không liên quan đến bất kỳ hình thức cá cược tiền thật nào.

---

## 🚀 Tính Năng Nổi Bật

### 🎮 Trò Chơi Giải Trí
*   **Nối Từ (`/noitu`):** Thử thách vốn từ vựng tiếng Việt với hệ thống đếm ngược thời gian thực.
*   **Tài Xỉu (`/taixiu`):** Cá cược vui nhộn với kênh chuyên dụng và giao diện nút bấm tương tác.
*   **Slot Machine (`/slot`):** Máy quay số may mắn nhận thưởng.
*   **Delta Force Scavenge (`/scavenge`):** Hệ thống giả lập đi map nhặt đồ, nâng cấp kho đồ cá nhân.

### 💰 Kinh Tế & Cá Nhân
*   **Hồ Sơ (`/profile`):** Xem cấp độ, số dư và danh hiệu.
*   **Ngân Hàng:** Gửi tiền (`/deposit`), rút tiền (`/withdraw`), và vay vốn (`/loan`) để đầu tư.
*   **Quà Tặng (`/reward`):** Nhận quà miễn phí định kỳ mỗi 4 giờ.
*   **Bảng Xếp Hạng (`/leaderboard`):** Vinh danh những người giàu nhất máy chủ.

### 🤖 Tiện Ích & AI
*   **Hỏi Đáp AI (`/ask`):** Tích hợp Gemini AI mạnh mẽ trả lời mọi thắc mắc.
*   **Nhắc Nhở (`/remind`):** Quản lý thời gian hiệu quả với hệ thống thông báo hẹn giờ.
*   **Tin Tức & Tài Chính:** Tự động cập nhật Tin tức, Crypto, Giá xăng dầu và Tỷ giá ngoại tệ qua Webhook.

### 🛠 Hệ Thống Thông Minh
*   **Self-Repair:** Tự động sửa lỗi môi trường SQLite3 và cấu hình Git khi khởi động.
*   **Auto-Update:** Luôn cập nhật code mới nhất từ GitHub.
*   **Monitoring:** Giao diện Terminal theo dõi trạng thái bot thời gian thực.

---

## 💻 Hướng Dẫn Cài Đặt

### 1. Chuẩn Bị
- Cài đặt [Node.js](https://nodejs.org/) (Windows) hoặc [Termux](https://f-droid.org/packages/com.termux/) (Android).
- Tạo Bot trên [Discord Developer Portal](https://discord.com/developers/applications).

### 2. Cài Đặt
```bash
git clone https://github.com/Longg249/AllIn-Bot-Discord.git
cd AllIn-Bot-Discord
npm install
```

### 3. Cấu Hình
Tạo file `.env` từ mẫu `.env.example`:
```env
DISCORD_TOKEN=Token_của_bạn
CLIENT_ID=ID_của_bot
GEMINI_API_KEY=Key_Gemini_AI (nếu dùng /ask)
```

### 4. Khởi Chạy

#### Chế độ mặc định (Tự động cập nhật):
- **Windows:** Chạy file `start.bat`.
- **Lệnh console:** `node index.js`.

#### Chế độ Manual (Không tự động cập nhật):
Nếu bạn đã sửa code local và không muốn bị ghi đè:
- **Windows:** Chạy file `start-no-update.bat`.
- **Lệnh console:** `node index-no-update.js`.

---

## 🛠 Hướng Dẫn Riêng Cho Termux
1. Cấp quyền: `termux-setup-storage`.
2. Cài đặt tool build: `pkg install nodejs python make gcc build-essential git libsqlite`.
3. Khởi chạy nhanh qua Widget bằng cách chạy: `bash setup-termux.sh`.

---

## 📁 Cấu Trúc Dự Án
- `index.js`: Điểm khởi đầu của bot (có auto-update).
- `src/games/`: Chứa mã nguồn các trò chơi.
- `src/database.js`: Quản lý dữ liệu SQLite.
- `dictionary.db`: Từ điển cho game Nối Từ.

---
*Phát triển và duy trì bởi **Longg249**.*
