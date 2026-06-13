# Hướng dẫn thiết lập file .env

Để bot hoạt động, bạn cần tạo một file tên là `.env` nằm ở thư mục gốc của dự án. Dưới đây là các biến môi trường cần thiết:

### 1. File mẫu (.env)
Bạn có thể copy nội dung này vào file `.env`:

```env
# Discord Bot Token
DISCORD_TOKEN=your_discord_bot_token_here

# Bot Client ID (để tạo slash commands)
CLIENT_ID=your_client_id_here

# Webhook Port (mặc định là 3000)
WEBHOOK_PORT=3000

# Smee URL (nếu chạy trên local, dùng để forward webhook GitHub)
# Bạn có thể lấy tại https://smee.io/
SMEE_URL=https://smee.io/your_smee_channel_id

# GitHub Token (để lấy diff code khi push)
# Tạo token tại: https://github.com/settings/tokens
# Cần quyền 'repo'
GITHUB_TOKEN=your_github_token_here
```

---

### 2. Chi tiết các biến

| Biến | Mô tả |
| :--- | :--- |
| `DISCORD_TOKEN` | Token của bot Discord lấy từ [Discord Developer Portal](https://discord.com/developers/applications). |
| `CLIENT_ID` | ID của ứng dụng bot lấy từ [Discord Developer Portal](https://discord.com/developers/applications). |
| `WEBHOOK_PORT` | Cổng để bot lắng nghe webhook (thường là 3000). |
| `SMEE_URL` | URL từ Smee.io dùng để nhận webhook GitHub về máy local (nếu không chạy server công khai). |
| `GITHUB_TOKEN` | Personal Access Token của GitHub để bot có thể gọi API lấy thông tin commit/diff. |

---

### 3. Cách thực hiện
1.  Tại thư mục dự án, tạo file mới đặt tên là `.env`.
2.  Mở file bằng trình soạn thảo văn bản (Notepad, VS Code, v.v.).
3.  Copy template ở mục 1 vào.
4.  Thay thế các giá trị `your_..._here` bằng thông tin thực tế của bạn.
5.  Lưu file và khởi động lại bot.

**⚠️ Lưu ý bảo mật:**
*   **KHÔNG BAO GIỜ** commit file `.env` lên GitHub.
*   Token của bạn là chìa khóa quyền hạn của bot, hãy giữ bí mật tuyệt đối.
*   File `.gitignore` đã được cấu hình để bỏ qua file `.env`, vì vậy nó sẽ không bị đẩy lên repository.
