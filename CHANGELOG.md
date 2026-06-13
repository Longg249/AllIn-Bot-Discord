# Changelog 🚀

Tất cả các thay đổi quan trọng đối với dự án này sẽ được ghi lại trong tệp này.

## [1.1.0] - 2026-06-13

### Added
- **Manual Mode:** Thêm `index-no-update.js` cho phép chạy bot mà không tự động cập nhật code từ GitHub, giúp bảo vệ các thay đổi tùy chỉnh local.
- **Windows Support:** Thêm `start-no-update.bat` để khởi chạy Manual Mode dễ dàng trên Windows.
- **Auto-Restart System:** 
    - Bot tự động thoát sau mỗi 12 giờ hoạt động để làm mới hệ thống tin tức và giải phóng bộ nhớ.
    - Cập nhật `start.bat`, `start-no-update.bat` và `start.sh` với vòng lặp tự động khởi động lại bot sau khi thoát.
- **PM2 Support:** Thêm `cron_restart` vào `ecosystem.config.js` để PM2 tự động restart bot mỗi 12 giờ.
- **GitHub Notifier:** Bot tích hợp sẵn khả năng nhận Webhook từ GitHub và gửi thông báo Embed chi tiết vào Discord.
- **Auto-Config Webhook:** Bot tự động lấy IP công khai khi khởi động và cập nhật Payload URL lên GitHub Webhook (yêu cầu GITHUB_TOKEN).
- **Smee.io Integration:** Hỗ trợ nhận Webhook qua URL cố định của Smee, giúp hệ thống hoạt động ổn định trên cả máy có IP động mà không cần mở port.
- **Node.js Compatibility:** Hạ cấp `smee-client` xuống v2.x để đảm bảo tương thích hoàn hảo với Node.js v21 và các môi trường cũ hơn.
- **IP Detection:** Hiển thị địa chỉ IP và Payload URL gợi ý ngay trong Terminal khi khởi động.

### Changed
- **README.md:** Viết lại toàn bộ tài liệu hướng dẫn, bổ sung chi tiết các tính năng Trò chơi (Games), Kinh tế (Economy), AI, và hướng dẫn sử dụng Manual Mode.
- **Startup Logic:** Cải thiện thông báo trạng thái khởi động trong Terminal với giao diện trực quan hơn.

### Fixed
- Khắc phục lỗi tin tức/webhook thỉnh thoảng không cập nhật sau thời gian dài chạy liên tục bằng cơ chế restart định kỳ.
- **Webhook Formatting:** Thêm nội dung plain-text vào thông báo GitHub để đảm bảo thông tin luôn hiển thị rõ ràng trên Discord ngay cả khi Embed gặp sự cố.

---
*Cập nhật bởi Gemini CLI.*
