# 📜 Nhật Ký Tiến Độ & Lịch Sử Phát Triển Dự Án
### Dự án: Cổng Ký Ức, Tri Ân & Vinh Danh Các Chiến Binh Nhí (Courageous Little Warriors Hub)
**Mã đề tài / Môn học:** BIT208V1  
**Repository:** [https://github.com/NguyenPhan161206/Pediatric-Patient-Memorial-and-Support](https://github.com/NguyenPhan161206/Pediatric-Patient-Memorial-and-Support)  
**Ngày cập nhật:** 17/10/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Kiến Trúc & Quyết Định Kỹ Thuật](#1-tổng-quan-kiến-trúc--quyết-định-kỹ-thuật)
2. [Khung Pháp Lý Đã Tích Hợp Vào Hệ Thống](#2-khung-pháp-lý-đã-tích-hợp-vào-hệ-thống)
3. [Chi Tiết Tiến Độ Thực Hiện Ngày 17/10/2026](#3-chi-tiết-tiến-độ-thực-hiện-ngày-17102026)
   - [Khởi tạo Tài liệu Đặc tả Kỹ thuật](#31-khởi-tạo-tài-liệu-đặc-tả-kỹ-thuật)
   - [Giai đoạn 1: Khởi tạo Khung Dự án & Docker 3 Tầng](#32-giai-đoạn-1-khởi-tạo-khung-dự-án--docker-3-tầng)
   - [Giai đoạn 2: Thiết Kế CSDL 3NF, FTS & Nạp Dữ Liệu Mẫu](#33-giai-đoạn-2-thiết-kế-csdl-3nf-fts--nạp-dữ-liệu-mẫu)
   - [Thiết lập CI/CD GitHub Actions & Repository](#34-thiết-lập-cicd-github-actions--repository)
   - [Giai đoạn 3: Xây Dựng Lõi Backend REST API](#35-giai-đoạn-3-xây-dựng-lõi-backend-rest-api)
4. [Bảng Kiểm Thử Thực Tế Các Endpoint](#4-bảng-kiểm-thử-thực-tế-các-endpoint)
5. [Kế Hoạch Cho Bước Tiếp Theo (Giai Đoạn 4)](#5-kế-hoạch-cho-bước-tiếp-theo-giai-đoạn-4)

---

## 1. Tổng Quan Kiến Trúc & Quyết Định Kỹ Thuật

* **Mô hình kiến trúc:** **3-Tier Phân tách (Decoupled SSR Architecture)**:
  * **Tầng 1 (Frontend SSR):** Node.js v22 LTS, ExpressJS, Handlebars Template Engine (`hbs`), CSS Framework TailwindCSS mang ngôn ngữ thiết kế **shadcn/ui** (Slate/Zinc tối giản, thanh lịch, bo góc tinh tế).
  * **Tầng 2 (Backend REST API):** Node.js v22 LTS, ExpressJS, Knex.js Query Builder, Bcrypt, JWT Authentication, DOMPurify/sanitize-html, Multer.
  * **Tầng 3 (Database):** PostgreSQL 16 Alpine hỗ trợ Full-Text Search `tsvector`, chỉ mục `GIN`, Session Store tập trung cho `connect-pg-simple`.
  * **Hạ tầng & Điều phối:** Docker & Docker Compose (Mạng cầu nối nội bộ `warrior_internal_net`, giám sát sức khỏe `healthcheck`).

---

## 2. Khung Pháp Lý Đã Tích Hợp Vào Hệ Thống

Hệ thống được thiết kế đáp ứng chặt chẽ các quy định pháp luật Việt Nam hiện hành:
1. **Luật Trẻ Em 2016 (Điều 21, Điều 54):**
   * Bảo vệ quyền bí mật đời sống riêng tư của trẻ em.
   * Tạo bảng `guardianship_consents` lưu trữ ảnh giấy khai sinh/ủy quyền, IP và timestamp cam kết chấp thuận của cha mẹ và trẻ em (nếu từ đủ 7 tuổi trở lên) trước khi công bố thông tin.
2. **Nghị định 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân nhạy cảm - PDPD):**
   * Dữ liệu y tế và bệnh án của bệnh nhi được bảo vệ nghiêm ngặt.
   * Trao **Quyền Tối Thượng Rút Hồ Sơ (Emergency Unpublish / Right to be Forgotten)** cho cha mẹ bệnh nhi thông qua cơ chế Soft-delete (`deleted_at = NOW()` và `is_published = FALSE`). Hồ sơ lập tức biến mất khỏi trang công khai và tìm kiếm mà không cần chờ Admin duyệt.
3. **Nghị định 93/2021/NĐ-CP (Vận động, tiếp nhận nguồn đóng góp tự nguyện):**
   * Nền tảng hoạt động theo nguyên tắc **"Không chạm dòng tiền" (Zero-touch Cashflow)**: không mở ví điện tử trung gian, không thu phí hoa hồng.
   * Tự động sinh mã **VietQR Napas247 chuẩn quốc gia**, kết nối trực tiếp nhà hảo tâm tới tài khoản viện phí Bệnh viện hoặc cha mẹ ruột đã được Admin thẩm định (`bank_verified = TRUE`).
4. **Nghị định 147/2024/NĐ-CP & Luật An ninh mạng:**
   * Tiền kiểm duyệt 100% lời chúc tri ân trước khi công khai (`PENDING -> APPROVED`).

---

## 3. Chi Tiết Tiến Độ Thực Hiện Ngày 17/10/2026

### 3.1. Khởi tạo Tài liệu Đặc tả Kỹ thuật
* Hoàn thiện 3 tài liệu cốt lõi:
  * `01_PROJECT_SPECIFICATION.md`: Bản đặc tả dự án, mục tiêu học thuật, danh sách công nghệ.
  * `02_SOFTWARE_REQUIREMENTS_SPECIFICATION.md`: Bản đặc tả 7 Module yêu cầu chức năng (FR) và các yêu cầu phi chức năng (NFR).
  * `03_SYSTEM_ARCHITECTURE.md`: Sơ đồ kiến trúc 3 tầng, cấu trúc thư mục Feature-based, CSDL quan hệ 3NF và Docker Compose.
* Loại bỏ phần 3.5 (bảng phân công nhóm) theo đúng yêu cầu đề bài.

### 3.2. Giai đoạn 1: Khởi tạo Khung Dự án & Docker 3 Tầng
* Thiết lập cấu trúc thư mục 2 phân hệ: `backend-api/` và `frontend-ssr/`.
* Cấu hình file `docker-compose.yml`, `.env`, `.env.example`, `.gitignore`.
* Xử lý giải quyết xung đột cổng CSDL host bằng cách ánh xạ cổng máy chủ sang `5435:5432`.
* Khởi chạy thành công 4 container:
  * `warrior_db` (PostgreSQL 16) -> `healthy`
  * `warrior_backend` (Express API) -> `healthy`
  * `warrior_frontend` (Handlebars SSR) -> `Up`
  * `warrior_pgadmin` (pgAdmin 4 GUI) -> `Up`
* Thiết lập giao diện trang chủ phong cách **shadcn/ui** hiển thị thẻ Live System Health theo dõi trạng thái kết nối 3 tầng thời gian thực.

### 3.3. Giai đoạn 2: Thiết Kế CSDL 3NF, FTS & Nạp Dữ Liệu Mẫu
* Viết file Knex Migration `20261017000001_create_warrior_hub_tables.js` tạo trọn vẹn 8 bảng CSDL:
  1. `users` (5 vai trò: `MEMBER`, `COORDINATOR`, `FAMILY`, `ADMIN`)
  2. `categories` (Nhóm bệnh lý hiểm nghèo)
  3. `children` (Hồ sơ chiến binh nhí, VietQR, soft-delete, `family_user_id`)
  4. `guardianship_consents` (Minh chứng giám hộ)
  5. `gallery_items` (Tranh vẽ, kỷ vật)
  6. `tributes` (Lời chúc và thắp nến)
  7. `audit_logs` (Nhật ký kiểm toán)
  8. `session` (Lưu session PostgreSQL)
* Tạo Trigger và Function PostgreSQL tự động sinh vector tìm kiếm đa trọng số `search_vector` kèm chỉ mục `GIN`.
* Viết file Knex Seed `01_initial_warriors_data.js` nạp dữ liệu mẫu:
  * 5 tài khoản mẫu phân quyền (Mật khẩu chung: `Password@2026`).
  * 4 hồ sơ chiến binh nhí mẫu đại diện cho 4 trạng thái: `FIGHTER`, `URGENT`, `RECOVERED`, `ANGEL`.
  * Tranh vẽ, lời chúc tri ân, minh chứng giám hộ và lịch sử kiểm toán.

### 3.4. Thiết lập CI/CD GitHub Actions & Repository
* Tạo quy trình CI tự động `.github/workflows/ci.yml`:
  * Job 1: Kiểm tra cú pháp và dependencies của mã nguồn.
  * Job 2: Khởi chạy môi trường tích hợp Docker 3 tầng, kiểm tra Healthcheck, tự động chạy Knex Migration & Seed data, đối soát số lượng bản ghi CSDL.
* Tạo file `README.md` chuyên nghiệp kèm hệ thống huy hiệu trạng thái.
* Khởi tạo Git remote và push toàn bộ mã nguồn lên GitHub:
  `git@github.com:NguyenPhan161206/Pediatric-Patient-Memorial-and-Support.git`.

### 3.5. Giai đoạn 3: Xây Dựng Lõi Backend REST API
Triển khai trọn vẹn 4 phân hệ REST API:
1. **Module Auth & 5-Tier RBAC:**
   * Cấp JWT token 7 ngày sau khi đối soát bcrypt.
   * Middleware `ensureFamilyOwnership` bảo vệ quyền sở hữu của gia đình, chống can thiệp chéo giữa các tài khoản.
   * Cấp tài khoản gia đình đóng (*Admin-Provisioned*) qua endpoint `/provision-family`.
2. **Module Warriors Catalog & FTS Engine:**
   * Server-side Pagination với `LIMIT` và `OFFSET`.
   * Tìm kiếm toàn văn tiếng Việt không dấu/có dấu qua `search_vector @@ plainto_tsquery('simple', ?)`.
   * Endpoint rút hồ sơ khẩn cấp (`/unpublish`).
3. **Module Tributes & Thắp Nến:**
   * Tăng biến đếm nguyên tử `candle_count`.
   * Tiếp nhận lời chúc với trạng thái ban đầu `PENDING`.
   * Quy trình kiểm duyệt `APPROVED` / `REJECTED`.
4. **Module Bảo Trợ & VietQR Napas247:**
   * Tự động sinh link ảnh VietQR ngân hàng chính chủ.
   * Thẩm định tài khoản (`bank_verified = TRUE`) và ghi nhật ký kiểm toán.

---

## 4. Bảng Kiểm Thử Thực Tế Các Endpoint

Toàn bộ các endpoint đã được kiểm thử trực tiếp bằng cURL trên hệ thống đang chạy:

```text
✓ GET   /api/v1/health                  -> HTTP 200 {"status":"UP","database":"CONNECTED"}
✓ POST  /api/v1/auth/login               -> HTTP 200 {token: "...", role: "ADMIN"}
✓ GET   /api/v1/warriors?page=1&limit=2  -> HTTP 200 {data: [2 items], total: 4, totalPages: 2}
✓ GET   /api/v1/warriors?q=cảnh+sát       -> HTTP 200 {data: [Bé Minh An]} (FTS Match)
✓ GET   /api/v1/warriors/nguyen-minh-an-bo -> HTTP 200 {warrior, gallery, tributes, vietqrUrl}
✓ POST  /api/v1/tributes/:id/candle      -> HTTP 200 {candleCount: 143} (Atomic increment)
✓ POST  /api/v1/tributes/:id/tributes    -> HTTP 201 {status: "PENDING"} (Waiting moderation)
✓ GET   /api/v1/sponsorships/:id/vietqr  -> HTTP 200 {verified: true, vietqrUrl: "https://img.vietqr.io/..."}
```

---

## 5. Nhật Ký Hoàn Thành Giai Đoạn 4 (Frontend SSR UI & Phân Hệ Giao Diện)

### Ngày hoàn thành: 17/10/2026
Đã triển khai thành công trọn vẹn toàn bộ 6 bước của Giai đoạn 4 theo phong cách thiết kế **shadcn/ui** (Express Handlebars + TailwindCSS Slate/Zinc design tokens), tích hợp thông suốt với Backend REST API và PostgreSQL Database:

1. **Bước 4.1: Cấu hình Session & Dynamic Navbar:**
   * Tích hợp `express-session` lưu trạng thái đăng nhập 7 ngày.
   * Navbar hiển thị dynamic: Trạng thái khách (Login/Register) và Trạng thái người dùng đã xác thực (Họ tên, Badge vai trò, Cổng Gia Đình, Duyệt Lời Chúc, Đăng xuất).
2. **Bước 4.2: Module Auth (Đăng nhập / Đăng ký):**
   * `/auth/login`: Form đăng nhập phong cách shadcn/ui kèm danh sách tài khoản mẫu click-to-fill phục vụ demo.
   * `/auth/register`: Form đăng ký thành viên cộng đồng (`MEMBER`).
   * `/auth/logout`: Xóa session an toàn và điều hướng về trang chủ.
3. **Bước 4.3: Module Warriors Catalog & FTS:**
   * `/warriors`: Thanh tìm kiếm toàn văn tiếng Việt qua PostgreSQL tsvector (`q`), bộ lọc đa chiều (Nhóm bệnh lý, Trạng thái `FIGHTER`, `URGENT`, `RECOVERED`, `ANGEL`), phân trang Server-side.
4. **Bước 4.4: Module Chi Tiết Bé, Thắp Nến & VietQR:**
   * `/warriors/:slug`: Hiển thị thông tin hồ sơ bé, câu chuyện `story_html`, bộ sưu tập kỷ vật tranh vẽ `gallery_items`.
   * **Thắp Nến Hy Vọng:** Nút bấm tương tác AJAX trực tiếp `POST /warriors/:id/candle` tăng biến đếm tức thời.
   * **Thẻ Bảo Trợ VietQR Napas247 (Zero-Touch):** Mã QR chính chủ hiển thị trực quan, cam kết không thu phí trung gian theo NĐ 93/2021.
   * **Bức Tường Tri Ân:** Form gửi lời chúc tự động chuyển vào hàng chờ kiểm duyệt theo Luật Trẻ em 2016 & NĐ 147/2024.
5. **Bước 4.5: Cổng Hộ Gia Đình & Bảng Kiểm Duyệt:**
   * `/family/portal`: Dành cho phụ huynh cập nhật nhật ký điều trị cho con và nút **Rút Hồ Sơ Khẩn Cấp (Emergency Unpublish)** có hiệu lực tức thời.
   * `/tributes/moderation`: Bảng quản trị tiền kiểm duyệt lời chúc (`APPROVE` / `REJECT`).
6. **Bước 4.6: Rebuild Docker & Kiểm Thử Toàn Diện:**
   * Rebuild `frontend_ssr` container, kiểm thử thành công 100% các endpoint qua curl và session cookies.

---

## 6. Kế Hoạch Cho Bước Tiếp Theo (Giai Đoạn 5)
1. **Kiểm thử tích hợp đầu cuối (End-to-End Testing):**
   * Viết kịch bản kiểm thử tự động e2e (hoặc integration test suites) xác minh chu trình từ tạo hồ sơ -> thắp nến -> quét QR -> gửi lời chúc -> duyệt lời chúc -> rút hồ sơ khẩn cấp.
2. **Tối ưu hóa SEO, OpenGraph Meta Tags & Caching:**
   * Bổ sung meta tags dynamic cho từng hồ sơ bé chia sẻ lên mạng xã hội Facebook/Zalo.
