# Ứng Dụng Ôn Tập Trắc Nghiệm Thông Minh Dành Cho Học Sinh Cấp 2

## 🌟 Giới Thiệu
Ứng dụng web ôn tập trắc nghiệm được thiết kế trực quan, tươi sáng, dễ sử dụng dành riêng cho học sinh cấp 2.

## 🚀 Các Tính Năng Nổi Bật

1. **Nạp tài nguyên linh hoạt:**
   - Hỗ trợ tải file **.PDF** (tự động đọc bằng PDF.js).
   - Hỗ trợ tải file **.DOCX** (tự động đọc bằng Mammoth.js).
   - Hỗ trợ **Dán văn bản trực tiếp** vào ô soạn thảo.
   - Có sẵn nút **"Thử mẫu sẵn"** để học sinh trải nghiệm nhanh 1 chạm.

2. **Cảnh báo thông minh khi gặp file PDF không đọc được (PDF scan):**
   - Nếu file PDF là ảnh scan hoặc không có lớp chữ copy được, hệ thống sẽ bật hộp thoại thông báo thân thiện:
     *"Hệ thống chưa đọc được tài liệu, vui lòng nạp lại tài nguyên bằng dạng tài liệu có thể copy được. Bạn có thể lên ChatGPT/Claude/Gemini gửi file vào nhờ xuất ra file Word (.docx) rồi nạp lại vào đây nhé!"*

3. **Thuật toán xáo trộn Fisher-Yates (Bảo toàn 100% đáp án gốc):**
   - Khi vào ôn tập hoặc làm lại: Vị trí các câu hỏi bị đảo ngẫu nhiên.
   - Vị trí các đáp án (A, B, C, D) trong từng câu cũng bị đảo ngẫu nhiên.
   - **Hệ thống tuyệt đối bảo toàn đáp án gốc:** Ánh xạ theo nội dung chính xác của đáp án đúng ban đầu.

4. **Phòng thi & Chấm điểm trực quan:**
   - Đồng hồ bấm giờ ôn tập.
   - Bảng câu hỏi (Palette) trực quan hiển thị câu đã làm / chưa làm.
   - Tự động chuyển câu mượt mà sau khi chọn đáp án.
   - Nút nộp bài có xác nhận.
   - Xem chi tiết câu làm đúng, câu làm sai kèm đáp án đúng gốc.

5. **Nút "Làm lại":**
   - Tự động xáo trộn lại toàn bộ câu hỏi và đáp án theo một trật tự hoàn toàn mới.

6. **Mở khóa "ÔN TẬP NÂNG CAO" (10 câu / lượt):**
   - **Điều kiện:** Học sinh phải đạt điểm đúng tuyệt đối (100%) **đủ 5 lần** đối với bộ đề gốc.
   - Khi đủ 5 lần, nút **"🚀 ÔN TẬP NÂNG CAO"** sẽ xuất hiện cùng hiệu ứng chúc mừng rực rỡ.
   - Hệ thống tự động tổng hợp 10 câu hỏi tư duy, suy luận, vận dụng nâng cao.
   - Có tùy chọn **"Quay lại ôn tập bình thường"** bất kỳ lúc nào.
   - Có thể kết nối trực tiếp với **Google Gemini API** (nếu cài đặt API Key) để AI tự động sinh thêm đề vô tận.

7. **Lịch sử ôn tập lưu trữ tự động:**
   - Dữ liệu lưu trong `localStorage` của trình duyệt.
   - Học sinh chỉ cần mở trang chủ là thấy danh sách các bài đã nạp kèm số lần đạt 100%.
   - Bấm **"Ôn bài này"** để vào học ngay lập tức mà không cần tải lại file!

---

## 💻 Cách Khởi Chạy
Bạn chỉ cần mở trực tiếp file `index.html` bằng bất kỳ trình duyệt nào (Chrome, Cốc Cốc, Edge, Firefox, Safari) hoặc chạy với Live Server.
