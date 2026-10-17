# 🎗️ Courageous Little Warriors Memorial and Tribute Hub
### Cổng Ký Ức, Tri Ân & Vinh Danh Các Chiến Binh Nhí

[![CI/CD Pipeline](https://github.com/NguyenPhan161206/Pediatric-Patient-Memorial-and-Support/actions/workflows/ci.yml/badge.svg)](https://github.com/NguyenPhan161206/Pediatric-Patient-Memorial-and-Support/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v22%20LTS-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20Alpine-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker%20Compose-v3.8-2496ED.svg)](https://www.docker.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-shadcn%2Fui%20style-38B2AC.svg)](https://tailwindcss.com/)

---

## 📖 Giới Thiệu Đề Tài (BIT208V1)

**Cổng Ký Ức, Tri Ân & Vinh Danh Các Chiến Binh Nhí (Courageous Little Warriors Hub)** là một không gian trực tuyến số hóa nhân văn nhằm:
* Lưu giữ hành trình kiên cường, nhật ký điều trị, tranh vẽ và ước mơ của các bệnh nhi ung thư/bệnh hiểm nghèo.
* Tạo không gian thắp nến hy vọng, gửi lời chúc động viên và tri ân các bé.
* Thiết lập cầu nối bảo trợ tài chính/hiện vật minh bạch **theo nguyên tắc "Không chạm dòng tiền" (Zero-touch Cashflow)** qua mã **VietQR Napas247** trực tiếp đến số tài khoản viện phí của Bệnh viện hoặc Người giám hộ hợp pháp.

### ⚖️ Tuân Thủ Pháp Lý Việt Nam
1. **Luật Trẻ Em 2016 (Điều 21, 54):** Bắt buộc có văn bản/cam kết đồng ý của cha mẹ và trẻ em (nếu từ 7 tuổi) trước khi công bố thông tin, hình ảnh đời tư.
2. **Nghị định 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân):** Bảo vệ dữ liệu y tế nhạy cảm; trao quyền cho gia đình đơn phương rút/ẩn hồ sơ (*Right to Withdraw Consent / Right to be Forgotten*) ngay lập tức.
3. **Nghị định 93/2021/NĐ-CP (Minh bạch từ thiện):** Hệ thống không thu phí, không giữ tiền trung gian.
4. **Nghị định 147/2024/NĐ-CP:** Tiền kiểm duyệt 100% lời chúc (*Pre-moderation: PENDING -> APPROVED*).

---

## 🏛️ Kiến Trúc Hệ Thống (3-Tier Decoupled SSR)

```text
[ Client Browser / Mobile ] 
       │ (Port 3000)
       ▼
┌─────────────────────────────────────────────────────────────┐
│ TẦNG 1: FRONTEND SSR SERVICE (Node.js/Express + Handlebars) │
│ - Phong cách thiết kế: shadcn/ui (TailwindCSS Slate/Zinc)   │
│ - Tích hợp: Trực tiếp sinh mã VietQR Napas247 từ CDN        │
└─────────────────────────────┬───────────────────────────────┘
                              │ (Mạng Docker Nội bộ)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ TẦNG 2: BACKEND REST API (ExpressJS + Knex.js Query Builder)│
│ - Phân quyền 5 cấp: 5-Tier RBAC & Ownership Verification    │
│ - Xử lý: Validation, Multer, XSS Sanitizer, Audit Logging   │
└─────────────────────────────┬───────────────────────────────┘
                              │ (Cổng nội bộ 5432)
                              ▼
┌───────────────────────────────────────────┐    ┌─────────────────────────┐
│ TẦNG 3: DATABASE (PostgreSQL 16 Engine)   │    │ PGADMIN 4 (Quản trị GUI)│
│ - Bảng quan hệ chuẩn 3NF (8 bảng)         │◄───│ - Port 5050 (Ánh xạ)    │
│ - Full-Text Search TSVECTOR & GIN Index   │    │ - Kết nối bảo trì DB    │
│ - Persistent Docker Volume (pgdata)       │    └─────────────────────────┘
└───────────────────────────────────────────┘
```

---

## 👥 Hệ Thống Phân Quyền 5 Cấp (5-Tier RBAC)

1. **`GUEST`:** Xem hồ sơ công khai, tìm kiếm FTS, thắp nến, gửi lời chúc (chờ duyệt).
2. **`MEMBER`:** Đăng ký tự do, lưu hồ sơ yêu thích, gửi quà/hiện vật bảo trợ.
3. **`COORDINATOR`:** Tình nguyện viên/Điều phối viên tại bệnh viện hỗ trợ chụp ảnh, viết câu chuyện ban đầu.
4. **`FAMILY` (Cha Mẹ / Người Giám Hộ):** **Tài khoản đóng do Admin cấp** sau khi kiểm tra CCCD + Giấy khai sinh; toàn quyền quản lý hồ sơ con mình và có **quyền ẩn/rút hồ sơ ngay lập tức**.
5. **`ADMIN`:** Quản trị viên toàn quyền hệ thống, phê duyệt tài khoản ngân hàng và xem Audit Logs.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Nhanh

> 📖 **Xem cẩm nang hướng dẫn đầy đủ từ A-Z (kèm chế độ Local Dev với Hot-reload và Sổ tay xử lý sự cố):**  
> 👉 **[DEVELOPER_SETUP_GUIDE.md](DEVELOPER_SETUP_GUIDE.md)**

### 1. Yêu cầu môi trường
* Đã cài đặt [Docker](https://docs.docker.com/get-docker/) và [Docker Compose](https://docs.docker.com/compose/).

### 2. Khởi chạy bằng Docker Compose
```bash
# 1. Clone repository
git clone git@github.com:NguyenPhan161206/Pediatric-Patient-Memorial-and-Support.git
cd Pediatric-Patient-Memorial-and-Support

# 2. Khởi tạo file biến môi trường
cp .env.example .env

# 3. Khởi động toàn bộ 4 container (Database, pgAdmin, Backend, Frontend)
docker compose up --build -d

# 4. Chạy migration tạo 8 bảng CSDL chuẩn 3NF
docker compose exec backend_api npm run migrate

# 5. Nạp dữ liệu mẫu
docker compose exec backend_api npm run seed
```

---

## 🔗 Danh Sách Cổng Dịch Vụ

| Dịch vụ | Địa chỉ URL | Ghi chú |
| :--- | :--- | :--- |
| **Frontend SSR Web** | [http://localhost:3000](http://localhost:3000) | Giao diện phong cách shadcn/ui |
| **Backend REST API** | [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health) | API kiểm tra kết nối CSDL |
| **pgAdmin 4 (GUI DB)** | [http://localhost:5050](http://localhost:5050) | `admin@warrior.org` / `admin_secure_pass` |
| **PostgreSQL Database** | `localhost:5435` | `db_admin` / `secure_password_2026` |

---

## 🔑 Tài Khoản Mẫu Để Kiểm Thử (Seeded Accounts)
* **Mật khẩu chung:** `Password@2026`
* **Admin:** `admin@warrior.org`
* **Coordinator:** `coordinator@warrior.org`
* **Family (Gia đình bé Minh An):** `family.minhan@gmail.com`
* **Family (Gia đình bé Mai Chi):** `family.maichi@gmail.com`
* **Nhà hảo tâm (Member):** `supporter@gmail.com`

---

## 📁 Tài Liệu Kỹ Thuật Chi Tiết
* [DEVELOPER_SETUP_GUIDE.md](DEVELOPER_SETUP_GUIDE.md): 🛠️ Cẩm nang cài đặt môi trường từ A-Z, chạy Local Dev và sổ tay xử lý sự cố.
* [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md): 🗺️ Bản đồ lộ trình các giai đoạn từ đầu đến kết thúc dự án.
* [01_PROJECT_SPECIFICATION.md](01_PROJECT_SPECIFICATION.md): Bản Đặc tả Dự án & Tech Stack.
* [02_SOFTWARE_REQUIREMENTS_SPECIFICATION.md](02_SOFTWARE_REQUIREMENTS_SPECIFICATION.md): Đặc tả 7 Module Yêu cầu Chức năng (FR) và Phi chức năng (NFR).
* [03_SYSTEM_ARCHITECTURE.md](03_SYSTEM_ARCHITECTURE.md): Bản Thiết kế Kiến trúc Hệ thống, CSDL 3NF và Docker Compose.
* [docs/PROJECT_HISTORY_AND_LOGS.md](docs/PROJECT_HISTORY_AND_LOGS.md): 📜 Nhật ký tiến độ toàn diện và lịch sử phát triển dự án.
* [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md): 📖 Tài liệu tham chiếu chi tiết 4 phân hệ Backend REST API.

