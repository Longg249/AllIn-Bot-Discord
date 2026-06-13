# Changelog

Tất cả các thay đổi quan trọng đối với dự án này sẽ được ghi lại trong tệp này.

## [1.1.0] - 2026-06-13

### Added
- **Manual Mode:** Thêm `index-no-update.js` cho phép chạy bot mà không tự động cập nhật code từ GitHub, giúp bảo vệ các thay đổi tùy chỉnh local.
- **Windows Support:** Thêm `start-no-update.bat` để khởi chạy Manual Mode dễ dàng trên Windows.
- **Auto-Restart System:** 
    - Bot tự động thoát sau mỗi 12 giờ hoạt động để làm mới hệ thống tin tức và giải phóng bộ nhớ.
    - Cập nhật `start.bat`, `start-no-update.bat` và `start.sh` với vòng lặp tự động khởi động lại bot sau khi thoát.
- **PM2 Support:** Thêm `cron_restart` vào `ecosystem.config.js` để PM2 tự động restart bot mỗi 12 giờ.

### Changed
- **README.md:** Viết lại toàn bộ tài liệu hướng dẫn, bổ sung chi tiết các tính năng Trò chơi (Games), Kinh tế (Economy), AI, và hướng dẫn sử dụng Manual Mode.
- **Startup Logic:** Cải thiện thông báo trạng thái khởi động trong Terminal với giao diện trực quan hơn.

### Fixed
- Khắc phục lỗi tin tức/webhook thỉnh thoảng không cập nhật sau thời gian dài chạy liên tục bằng cơ chế restart định kỳ.

---
*Cập nhật bởi Gemini CLI.*
