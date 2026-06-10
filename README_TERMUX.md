# 📱 Hướng dẫn cài đặt AllIn-Bot trên Termux

Tài liệu này hướng dẫn chi tiết cách cài đặt và vận hành bot trên Android thông qua Termux.

## 📥 Bước 1: Cài đặt môi trường ban đầu
Mở Termux và dán lệnh sau để cấp quyền truy cập bộ nhớ (nếu cần) và cập nhật:
```bash
termux-setup-storage
pkg update && pkg upgrade
```

## 🛠️ Bước 2: Chạy script cài đặt tự động
Trong thư mục của bot, hãy chạy lệnh:
```bash
bash setup-termux.sh
```
Script này sẽ:
- Cài đặt Node.js, Python, và các công cụ biên dịch.
- Tự động cài đặt thư viện (`npm install`).
- Biên dịch lại `sqlite3` để tương thích với kiến trúc chip điện thoại (ARM).

## ⚙️ Bước 3: Cấu hình Bot
Bạn cần tạo hoặc chỉnh sửa file `.env`:
```bash
nano .env
```
Nội dung cơ bản:
```env
DISCORD_TOKEN=Token_Của_Bạn_Ở_Đây
CLIENT_ID=ID_Của_Bot_Ở_Đây
```
*(Nhấn `Ctrl + O` -> `Enter` để lưu, `Ctrl + X` để thoát)*

## 🚀 Bước 4: Khởi động Bot
Sử dụng script khởi động thông minh (tự kiểm tra lỗi):
```bash
bash start.sh
```
Hoặc lệnh gốc:
```bash
node index.js
```

---

## 💡 Lưu ý quan trọng cho Termux:

1. **Giữ bot chạy ngầm**: 
   - Vuốt từ mép trái màn hình Termux qua, chọn **"Acquire Wake Lock"** để Android không ngắt kết nối bot khi tắt màn hình.
   
2. **Lỗi Sqlite3**: 
   - Nếu thấy lỗi `Error: Cannot find module 'sqlite3'`, hãy chạy lại lệnh: `npm rebuild sqlite3`.

3. **Cập nhật Bot**:
   - Nếu bạn cập nhật code mới, hãy luôn chạy `npm install` lại để đảm bảo không thiếu thư viện.

4. **Kênh chuyên dụng**:
   - Nhớ cấu hình đúng ID kênh trong `src/slash.js` để các lệnh game hoạt động.
