# 🎓 Trợ lý ảo AI Tư vấn Tuyển sinh & Học vụ (DNU Botchat)

![Banners](https://img.shields.io/badge/AI-Langchain-blue)
![Banners](https://img.shields.io/badge/Backend-FastAPI-green)
![Banners](https://img.shields.io/badge/Frontend-ReactJS-cyan)
![Banners](https://img.shields.io/badge/Database-ChromaDB-orange)

Dự án **Trợ lý ảo AI Tư vấn Học vụ Đại học Đại Nam (DNU)** là một hệ thống hỏi đáp thông minh được phát triển dựa trên kiến trúc **Retrieval-Augmented Generation (RAG)** và sức mạnh của Mô hình Ngôn ngữ Lớn (LLM) OpenAI. 
Dự án được thiết kế chuyên biệt để trả lời các quy chế, hướng dẫn học vụ và lịch trình đào tạo nội bộ của nhà trường với độ chính xác tuyệt đối, loại bỏ triệt để hiện tượng "Ảo giác" (Hallucination) của AI thông thường.

---

## 🚀 Tính năng Nổi bật
- **⚡ Trả lời theo Ngữ Cảnh Chuyên biệt (RAG):** AI chỉ trả lời dựa trên những tài liệu PDF pháp lý đã được nạp vào, từ chối trả lời bịa đặt nếu không có thông tin.
- **🛡️ Chống Nhân Bản Dữ Liệu (MD5 Deduplication):** Thuật toán tự chế sử dụng mã băm Hash MD5 ngăn chặn việc nạp lại nhiều lần cùng một tài liệu PDF vào cơ sở dữ liệu.
- **🌐 Trích xuất & Bóc tách Tự động (Data Ingestion Pipeline):** Công cụ tải lên (Upload PDF) và Cào Dữ Liệu Web (Web Scraper) tự động bốc lớp text, loại bỏ nhiễu và băm thành các Chunk siêu nhỏ (1000 từ/chunk).
- **🎨 Giao Diện Người Dùng Sắc Nét:** Khách hàng (Sinh viên) trải nghiệm khung chat mượt mà qua ReactJS; Quản trị viên (Phòng Đào tạo) sở hữu một bảng điều khiển Admin ngầm để Duyệt & Nạp file thời gian thực.

---

## 🛠️ Công Nghệ Sử Dụng
Hệ thống được thiết kế theo cấu trúc Microservices cục bộ liền mạch:
1. **Lõi Xử Lý Ngôn Ngữ (LLM RAG Engine):** Langflow, Langchain, GPT-4o-mini, OpenAI Text-Embeddings.
2. **Lưu trữ Trí Nhớ Vector:** ChromaDB (Bản Local Sqlite - Tiếng Việt).
3. **Máy Chủ Điều Phối (Middleware):** FastAPI (Python), Uvicorn.
4. **Giao Diện Frontend:** ReactJs, TailwindCSS.

---

## ⚙️ Cài Đặt Và Chạy Cục Bộ (Local Installation)

### 1. Yêu cầu Hệ thống
- Python 3.10+
- Node.js & npm (v18+)

### 2. Thiết lập Môi trường Backend (Python)
Cài đặt các thư viện lõi cho Python và thiết lập Khóa bí mật API:
```bash
# Kích hoạt môi trường ảo
.\VENV_NAME\Scripts\activate

# Tạo file .env ở thư mục gốc và khai báo khóa
OPENAI_API_KEY=sk-....
LANGFLOW_API_KEY=sk-...
SECRET_KEY=DAI_NAM_UNIVERSITY_SUPER_SECRET_KEY

# Mở một Terminal để chạy Backend FastAPI (Mặc định Port 8000)
uvicorn server:app --reload
```

### 3. Thiết lập Môi trường RAG (Langflow)
```bash
# Mở Terminal thứ 2 để khởi chạy Máy Lõi AI (Port 7861)
langflow run --port 7861
```
*Lưu ý:* Node `ChromaDB` trong Langflow cần được thiết lập đúng đường dẫn Persist Directory của thư mục `./chroma_db` nội bộ dự án.

### 4. Thiết lập Giao diện Frontend (React)
```bash
# Mở thư mục frontend 
cd frontend

# Cài đặt thư viện rồi chạy
npm install
npm run dev
```

---

## 📂 Cấu Trúc Mã Nguồn (Repository Structure)
- `/frontend/` - Chứa toàn bộ mã nguồn giao diện User và Admin (React).
- `server.py` - Trái tim của hệ thống: Tiếp nhận File, điều phối API và giao tiếp RAG.
- `lam_sach_va_nap.py` - Script thủ công tích hợp Mật mã MD5 giúp dọn rác và nạp Tệp PDF thông minh.
- `PDF/` - Kho dự trữ tài liệu gốc được sao lưu định kì trước khi nén vào VectorDB.
- `chroma_db/` - Khối Não bộ (Lưu trữ Vector) ẩn danh tàng hình.

---
*Dự án NCKH Đại học Đại Nam 2026. Sinh viên thực hiện: HOANGTHI2509.*
