# 📙 HƯỚNG DẪN KHỞI ĐỘNG DỰ ÁN TRỢ LÝ ẢO DNU (BẢN CHUẨN)

Chào bạn! Đây là hướng dẫn chi tiết để bạn tự tay khởi động toàn bộ hệ thống sau khi ngủ dậy. Hãy thực hiện đúng thứ tự để các "trái tim" của Bot kết nối mượt mà nhé!

---

## 🚀 THỨ TỰ KHỞI ĐỘNG (BẮT BUỘC)

Hệ thống có 4 phần chính, hãy mở lần lượt 4 cửa sổ CMD đen:

### 1️⃣ Bước 1: Khởi động Kho dữ liệu (ChromaDB Server)
Đây là nơi lưu trữ "trí nhớ" của Bot. Có 2 cách (chọn 1):
- **Cách A (Dùng file .bat):** Chạy file `chay_chromadb.bat`.
- **Cách B (Dùng Docker - Khuyên dùng):** Mở CMD/PowerShell và gõ:
  `docker run -p 8001:8000 -v "C:/Users/Admin/Downloads/BOTCHAT/chroma_db:/data" chromadb/chroma`
🚩 *Giữ nguyên cửa sổ này không được tắt.*

### 2️⃣ Bước 2: Khởi động Bộ não AI (Langflow)
Chạy file `chay_langflow.bat`. Đợi đến khi nó hiện link `http://127.0.0.1:7861`.
🚩 *Giữ nguyên cửa sổ này.*

### 3️⃣ Bước 3: Khởi động Máy chủ kết nối (Python Backend)
Chạy file `chay_server_python.bat`. Đây là cầu nối giữa Giao diện Web và AI.
🚩 *Giữ nguyên cửa sổ này.*

### 4️⃣ Bước 4: Khởi động Giao diện người dùng (Frontend)
Trực tiếp chạy file **`chay_frontend.bat`** nằm ở thư mục gốc `BOTCHAT`.
(Lưu ý: File này sẽ tự động tìm vào thư mục `frontend` và chạy lệnh giúp bạn).
Sau đó truy cập link hiện ra (thường là `http://localhost:5173`) để bắt đầu dùng Bot!

---

## ⚙️ CẤU HÌNH LẦN ĐẦU TRONG LANGFLOW (QUAN TRỌNG)
Nếu Bot không trả lời, hãy kiểm tra lại Sơ đồ trong Langflow (`http://127.0.0.1:7861`):
1. Tìm tất cả các cục **Chroma DB**.
2. Ô `Persist Directory`: Xóa trắng (**Để trống**).
3. Ô `Server Host`: Điền **`127.0.0.1`**.
4. Ô `Server HTTP Port`: Điền **`8001`**.
5. Nhớ ấn nút **Tia chớp (Build)** ở góc dưới bên phải màn hình để lưu lại.

---

## 🛠️ HƯỚNG DẪN SỬ DỤNG
- **Dành cho Người dùng:** Chat trực tiếp tại trang chủ.
- **Dành cho Admin (Nạp dữ liệu):** 
  - Vào Tab **Admin** -> **Duyệt & Đảy Vào Langflow**.
  - Dữ liệu sẽ tự động được nạp thẳng vào "Não bộ" mà không cần bạn phải thao tác gì thêm trong Langflow.

---

## 📌 LƯU Ý SỐNG CÒN
- **Không tắt 3 cửa sổ CMD đen** trong suốt quá trình sử dụng.
- Nếu gặp lỗi `Connection Refused`: Kiểm tra xem đã bật đủ 3 bước đầu tiên chưa.
- Chúc bạn có một giấc ngủ ngon và bảo vệ đồ án thành công rực rỡ! 💯✨
