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
- **Webhook Robustness:** 
    - Thêm nội dung plain-text vào thông báo GitHub để hiển thị rõ ràng ngay cả khi Discord không tải được Embed.
    - Xử lý thành công các Webhook từ GitHub ở định dạng form-encoded (unwrap `payload` key).
    - Tự động parse stringified JSON từ các dịch vụ proxy trung gian.
    - Thêm logging chi tiết trong Terminal để dễ dàng debug quá trình nhận và gửi thông báo.
- **Smee.io Auto-Config Fix:** Sửa lỗi bot tự động ghi đè URL Webhook trên GitHub bằng IP công khai ngay cả khi đang sử dụng Smee.io. Giờ đây bot sẽ ưu tiên dùng `SMEE_URL` để cấu hình GitHub Webhook.

- **Auto-Restart on Update:** Bot tự động kiểm tra code mới trên GitHub mỗi giờ, tự cập nhật và khởi động lại nếu phát hiện commit mới.

---
