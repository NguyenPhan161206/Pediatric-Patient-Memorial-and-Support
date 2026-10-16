# PHẦN 1: BẢN ĐẶC TẢ DỰ ÁN (PROJECT SPECIFICATION)

---

### 1.1. Tên đề tài & Sứ mệnh

* **Tên chính thức**: Cổng Ký ức, Tri ân & Vinh danh Các Chiến Binh Nhí (Courageous Little Warriors Memorial & Tribute Hub).
* **Mục tiêu xã hội & Pháp lý**: 
  * Xây dựng một không gian trực tuyến số hóa nhân văn để lưu giữ hành trình kiên cường, tranh vẽ, câu chuyện vượt khó của các bệnh nhi ung thư/bệnh hiểm nghèo; đồng thời tạo kênh tiếp nhận lời chúc, thắp nến hy vọng và tri ân các bé.
  * Thiết lập kênh kết nối bảo trợ tài chính/hiện vật minh bạch trực tiếp giữa nhà hảo tâm và Bệnh viện/Gia đình theo **Nghị định 93/2021/NĐ-CP** (Hệ thống hoạt động theo nguyên tắc *"Không chạm dòng tiền"*, kết nối qua mã VietQR Napas247 chính chủ, không giữ tiền trung gian).
  * Tuân thủ nghiêm ngặt **Luật Trẻ em 2016** và **Nghị định 13/2023/NĐ-CP** về Bảo vệ dữ liệu cá nhân nhạy cảm: bảo vệ tối đa quyền riêng tư, quyền của người giám hộ và trao quyền đơn phương rút/ẩn hồ sơ (*Right to Withdraw Consent / Right to be Forgotten*) cho gia đình bệnh nhi.
* **Mục tiêu học thuật**: 
  * Vận dụng kiến trúc **3-Tier Phân tách (Decoupled SSR: 1 Frontend SSR + 1 Backend API + 1 Database PostgreSQL)**.
  * Áp dụng mô hình **MVC kết hợp Feature-based**, phân quyền **5-Tier RBAC kết hợp Ownership Check**.
  * Đóng gói hoàn chỉnh bằng **Docker Compose** có thiết lập điều kiện giám sát sức khỏe container (`healthcheck`), vượt qua các bài kiểm thử tải (Load Testing bằng k6/Autocannon) và các tiêu chuẩn bảo mật web theo chuẩn đề cương môn học BIT208V1.

---

### 1.2. Danh sách công nghệ sử dụng (Technology Stack)

* **Frontend Web SSR**:
  * Môi trường & Server: Node.js (v20+ LTS), ExpressJS.
  * Template Engine: Handlebars (`hbs`) hoặc `ejs` (hỗ trợ layout, partials, helpers format ngày tháng, tiền tệ).
  * Session Management: `express-session` kết hợp `connect-pg-simple` (lưu trữ session tập trung trong PostgreSQL để bảo toàn phiên khi scale/restart container).
  * Giao diện & Trình bày: TailwindCSS (hoặc Bootstrap 5), Responsive Design (Mobile-First), OpenGraph Meta Tags cho mạng xã hội.
  * HTTP Client: Axios (cấu hình BaseURL nội bộ, timeout, interceptor quản lý lỗi).

* **Backend REST API**:
  * Môi trường & Framework: Node.js, ExpressJS.
  * Database Query Builder: Knex.js (hỗ trợ Parameterized Queries, Transaction, Raw Queries, Migration và Seeding).
  * Xác thực & Phân quyền: Bcrypt (mã hóa mật khẩu `saltRounds = 10`), Middleware phân quyền 5 cấp RBAC & Ownership Verification.
  * Bảo mật & Kiểm định dữ liệu: `express-validator` (Validation schema), `DOMPurify` / `sanitize-html` (lọc sạch mã độc XSS từ WYSIWYG Editor), `helmet` (HTTP Security Headers), `express-rate-limit` (chống brute-force đăng nhập và spam nến).
  * Xử lý Tệp Đa phương tiện: Multer (quản lý Multipart Form-data, kiểm tra MIME-type, đổi tên file UUID chống ghi đè).

* **Database & Management**:
  * Hệ quản trị CSDL: PostgreSQL 16 (hỗ trợ kiểu dữ liệu `tsvector`, chỉ mục `GIN` cho Full-Text Search, chuẩn hóa 3NF, lưu trữ Session).
  * Công cụ GUI Quản trị: pgAdmin 4.

* **DevOps & Testing**:
  * Container hóa: Docker, Docker Compose (cấu hình mạng Bridge nội bộ `warrior_internal_net`, volumes bền vững `pgdata`, `uploads_data`, healthcheck phụ thuộc).
  * Kiểm thử hiệu năng & Tải: k6 / Autocannon (đo lường Throughput req/s, Latency p95, Error rate).
