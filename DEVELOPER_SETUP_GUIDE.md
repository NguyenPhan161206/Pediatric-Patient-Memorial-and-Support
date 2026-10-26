# Cẩm Nang Cài Đặt Môi Trường Phát Triển Toàn Diện (Developer Setup Guide)

> **Dự án:** Cổng Lưu Trữ, Tri Ân & Vinh Danh Các Chiến Binh Nhí (*Courageous Little Warriors Memorial & Tribute Hub*)  
> **Môn học:** BIT208V1 - Dự Án Công Nghệ Thông Tin  
> **Kiến trúc:** 3-Tier Decoupled SSR (Node.js/Express, PostgreSQL, TailwindCSS/Handlebars, Docker)

Tài liệu này cung cấp hướng dẫn từng bước từ máy tính trắng (*bare machine*) đến khi khởi chạy hoàn chỉnh toàn bộ hệ thống web, cơ sở dữ liệu và công cụ quản trị.

---

## 📌 Mục Lục

1. [Yêu Cầu Tiên Quyết (Prerequisites)](#1-yêu-cầu-tiên-quyết-prerequisites)
2. [Tải Mã Nguồn & Cấu Hình Môi Trường (.env)](#2-tải-mã-nguồn--cấu-hình-môi-trường-env)
3. [Chế Độ 1: Khởi Chạy Toàn Bộ Qua Docker Compose (Khuyên Dùng Cho Demo)](#3-chế-độ-1-khởi-chạy-toàn-bộ-qua-docker-compose-khuyên-dùng-cho-demo)
4. [Chế Độ 2: Chạy Môi Trường Local Development (Dành Cho Lập Trình Viên)](#4-chế-độ-2-chạy-môi-trường-local-development-dành-cho-lập-trình-viên)
5. [Quản Trị Cơ Sở Dữ Liệu Qua pgAdmin 4 GUI](#5-quản-trị-cơ-sở-dữ-liệu-qua-pgadmin-4-gui)
6. [Tài Khoản Kiểm Thử Mẫu (Seeded Test Accounts)](#6-tài-khoản-kiểm-thử-mẫu-seeded-test-accounts)
7. [Đo Kiểm Hoạt Động Của Hệ Thống (Health Check & Verification)](#7-đo-kiểm-hoạt-động-của-hệ-thống-health-check--verification)
8. [Sổ Tay Xử Lý Sự Cố Thường Gặp (Troubleshooting / FAQ)](#8-sổ-tay-xử-lý-sự-cố-thường-gặp-troubleshooting--faq)

---

## 1. Yêu Cầu Tiên Quyết (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

| Công cụ | Phiên bản khuyến nghị | Mục đích sử dụng | Kiểm tra phiên bản trên máy |
| :--- | :--- | :--- | :--- |
| **Git** | `>= 2.30` | Quản lý mã nguồn | `git --version` |
| **Node.js** | `>= 20.x` (Khuyên dùng v22 LTS) | Môi trường chạy JavaScript Backend & Frontend SSR | `node -v` |
| **npm** | `>= 10.x` | Trình quản lý gói thư viện Node.js | `npm -v` |
| **Docker Engine** | `>= 24.0` | Ảo hóa container các dịch vụ | `docker -v` |
| **Docker Compose** | `>= 2.20` | Điều phối multi-container | `docker compose version` |

> [!NOTE]
> **Dành cho người dùng Windows:** Khuyến nghị cài đặt **WSL2 (Windows Subsystem for Linux)** với bản phân phối Ubuntu, bật tính năng *Docker Desktop WSL2 Integration* để đạt hiệu năng tối đa và tránh lỗi phân quyền đường dẫn tệp.

---

## 2. Tải Mã Nguồn & Cấu Hình Môi Trường (.env)

### Bước 2.1: Clone repository từ GitHub
```bash
git clone git@github.com:NguyenPhan161206/Pediatric-Patient-Memorial-and-Support.git
cd Pediatric-Patient-Memorial-and-Support
```

### Bước 2.2: Thiết lập tệp cấu hình `.env`
Sao chép tệp mẫu `.env.example` thành tệp cấu hình thực tế `.env`:
```bash
cp .env.example .env
```

### Bảng chú giải chi tiết các biến môi trường:

| Biến môi trường | Giá trị mặc định | Giải thích ý nghĩa & Lý do kỹ thuật |
| :--- | :--- | :--- |
| `POSTGRES_USER` | `db_admin` | Tên tài khoản Superuser của PostgreSQL. |
| `POSTGRES_PASSWORD` | `secure_password_2026` | Mật khẩu truy cập cơ sở dữ liệu. |
| `POSTGRES_DB` | `warrior_hub_db` | Tên CSDL chính thức của dự án. |
| `POSTGRES_PORT` | `5435` | **Cổng PostgreSQL map ra máy host.** Lý do chọn `5435`: Trên các máy tính phát triển thường đã cài sẵn PostgreSQL chạy cổng `5432`, `5433` hoặc `5434`. Việc map cổng `5435:5432` giúp tránh 100% nguy cơ xung đột cổng (*Port already allocated*). |
| `BACKEND_PORT` | `5000` | Cổng dịch vụ Backend REST API trên máy host. |
| `FRONTEND_PORT` | `3000` | Cổng dịch vụ Frontend Web SSR trên trình duyệt. |
| `JWT_SECRET` | *(chuỗi ngẫu nhiên)* | Khóa bí mật dùng để ký và giải mã JWT Token (Xác thực 5-Tier RBAC). |
| `SESSION_SECRET` | *(chuỗi ngẫu nhiên)* | Khóa ký Session cookie trên Frontend SSR. |

---

## 3. Chế Độ 1: Khởi Chạy Toàn Bộ Qua Docker Compose (Khuyên Dùng Cho Demo)

> [!TIP]
> **Khi nào nên dùng chế độ này?**
> Thích hợp nhất khi bạn muốn:
> - Trình diễn Demo trước Giảng viên / Hội đồng bảo vệ đồ án.
> - Người chấm bài muốn chạy ngay mà không cần cài đặt thư viện Node.js thủ công.
> - Đảm bảo tính nhất quán 100% giữa môi trường phát triển và môi trường triển khai thực tế.

### Bước 3.1: Build và khởi động cả 3 container (Database, Backend, Frontend)
```bash
docker compose up --build -d
```

### Bước 3.2: Kiểm tra trạng thái sức khỏe các dịch vụ
```bash
docker compose ps
```
*Kết quả mong đợi:* Cả 3 container (`warrior_db`, `warrior_backend`, `warrior_frontend`) đều ở trạng thái `Up` hoặc `Up (healthy)`.

### Bước 3.3: Khởi tạo bảng CSDL và nạp dữ liệu mẫu
Sau khi cơ sở dữ liệu chuyển sang trạng thái `healthy` (khoảng 5-10 giây sau khi bật):
```bash
# 1. Chạy Knex Migration để tạo 8 bảng quan hệ chuẩn 3NF và trigger FTS tsvector
docker compose exec backend_api npm run migrate

# 2. Chạy Knex Seed để nạp 5 tài khoản mẫu và 4 hồ sơ chiến binh nhí
docker compose exec backend_api npm run seed
```

---

## 4. Chế Độ 2: Chạy Môi Trường Local Development (Dành Cho Lập Trình Viên)

> [!TIP]
> **Khi nào nên dùng chế độ này?**
> Khi bạn đang trực tiếp chỉnh sửa code, thêm tính năng hoặc sửa lỗi giao diện. Chế độ này sử dụng **Nodemon Hot-reload**, code vừa lưu là máy chủ tự tải lại ngay trong 1 giây mà không phải chờ rebuild Docker!

### Bước 4.1: Chỉ bật cơ sở dữ liệu PostgreSQL trong Docker
```bash
docker compose up -d postgres_db
```

### Bước 4.2: Khởi chạy Backend API trên máy Host (Terminal 1)
```bash
cd backend-api
npm install

# Thiết lập biến môi trường trỏ vào cổng 5435 của Docker DB
export PORT=5000
export DATABASE_URL="postgres://db_admin:secure_password_2026@localhost:5435/warrior_hub_db"
export JWT_SECRET="super_secret_token_key_2026"

# Chạy migration và seed (nếu chưa chạy)
npm run migrate
npm run seed

# Khởi động Backend ở chế độ tự động reload (Nodemon)
npm run dev
```
*Backend API sẽ chạy tại:* [http://localhost:5000](http://localhost:5000)

### Bước 4.3: Khởi chạy Frontend SSR trên máy Host (Terminal 2)
```bash
cd frontend-ssr
npm install

export PORT=3000
export BACKEND_API_URL="http://localhost:5000/api/v1"
export SESSION_SECRET="warrior_hub_session_secret_2026"

# Khởi động Frontend ở chế độ tự động reload (Nodemon)
npm run dev
```
*Frontend Web sẽ chạy tại:* [http://localhost:3000](http://localhost:3000)

---

## 5. Quản Trị Cơ Sở Dữ Liệu Qua pgAdmin 4 Desktop (Ứng Dụng Cài Đặt Trên Máy)

Dự án sử dụng trực tiếp ứng dụng **pgAdmin 4 Desktop** (hoặc các công cụ tương đương như DBeaver, DataGrip, VS Code Database Client) cài đặt trên máy tính của bạn để kết nối vào database trong Docker:

1. Tải và cài đặt **pgAdmin 4 Desktop** (nếu chưa có): [https://www.pgadmin.org/download/](https://www.pgadmin.org/download/)
2. Mở ứng dụng pgAdmin 4 Desktop trên máy tính.
3. **Thêm kết nối vào CSDL (Register Server):**
   - Bấm chuột phải vào `Servers` ➔ chọn `Register` ➔ `Server...`
   - **Tab General:** Đặt Name là `Warrior Hub Local Database`.
   - **Tab Connection:**
     - **Host name/address:** `localhost` (hoặc `127.0.0.1`)
     - **Port:** `5435` *(Lưu ý: Sử dụng cổng 5435 đã được map từ container ra máy host)*
     - **Maintenance database:** `warrior_hub_db`
     - **Username:** `db_admin`
     - **Password:** `secure_password_2026`
   - Bấm **Save**.
4. Bạn sẽ thấy cây thư mục CSDL: `Databases` ➔ `warrior_hub_db` ➔ `Schemas` ➔ `public` ➔ `Tables`, bao gồm đầy đủ 8 bảng quan hệ:
   - `users` (Danh sách tài khoản & phân quyền)
   - `categories` (Nhóm bệnh lý)
   - `children` (Hồ sơ chiến binh nhí, FTS vector, mã VietQR)
   - `guardianship_consents` (Hồ sơ pháp lý giám hộ theo Luật Trẻ em 2016)
   - `gallery_items` (Tranh vẽ, kỷ vật của bé)
   - `tributes` (Lời chúc và nến hy vọng)
   - `audit_logs` (Nhật ký kiểm toán)
   - `session` (Phiên làm việc người dùng)

---

## 6. Tài Khoản Kiểm Thử Mẫu (Seeded Test Accounts)

Tất cả các tài khoản sau đã được mã hóa mật khẩu Bcrypt an toàn trong cơ sở dữ liệu:

> 🔑 **Mật khẩu chung:** `Password@2026`

| Vai trò (Role) | Email đăng nhập | Chức trách & Tính năng kiểm thử |
| :--- | :--- | :--- |
| **👑 ADMIN** | `admin@warrior.org` | Toàn quyền quản trị; Truy cập **Bảng Kiểm Duyệt** ([/tributes/moderation](http://localhost:3000/tributes/moderation)) để phê duyệt lời chúc; Quản lý hồ sơ bé; Đối soát ngân hàng. |
| **🩺 COORDINATOR** | `coordinator@warrior.org` | Điều phối viên Viện Nhi TW; Thêm mới và quản lý hồ sơ bệnh nhi; Duyệt lời chúc. |
| **👨‍👩‍👧 FAMILY (Bé Minh An)** | `family.minhan@gmail.com` | Phụ huynh bé Minh An; Truy cập **Cổng Gia Đình** ([/family/portal](http://localhost:3000/family/portal)); Cập nhật nhật ký điều trị; Nút **Rút Hồ Sơ Khẩn Cấp (Emergency Unpublish)**. |
| **👨‍👩‍👧 FAMILY (Bé Mai Chi)** | `family.maichi@gmail.com` | Phụ huynh bé Mai Chi (Bông); Quản lý tiến trình điều trị và tài khoản thụ hưởng. |
| **🤝 MEMBER** | `supporter@gmail.com` | Nhà hảo tâm cộng đồng; Thắp nến hy vọng, gửi lời chúc tri ân, quét mã VietQR. |

---

## 7. Đo Kiểm Hoạt Động Của Hệ Thống (Health Check & Verification)

Sau khi khởi chạy thành công, bạn có thể kiểm tra từng dịch vụ qua các lệnh sau:

### 1. Kiểm tra Backend REST API
```bash
curl -i http://localhost:5000/api/v1/health
```
*Phản hồi mong đợi:* `HTTP/1.0 200 OK` với body `{"status":"UP","database":"CONNECTED"}`.

### 2. Kiểm tra Tìm kiếm FTS tiếng Việt
```bash
curl -s "http://localhost:5000/api/v1/warriors?q=c%E1%BA%A3nh+s%C3%A1t" | grep "Nguyễn Minh An"
```

### 3. Kiểm tra Giao diện Web Frontend SSR
Mở trình duyệt truy cập:
* [http://localhost:3000](http://localhost:3000) (Trang chủ)
* [http://localhost:3000/warriors](http://localhost:3000/warriors) (Danh sách chiến binh nhí)
* [http://localhost:3000/warriors/nguyen-minh-an-bo](http://localhost:3000/warriors/nguyen-minh-an-bo) (Hồ sơ chi tiết, Thắp nến, Mã VietQR)
* [http://localhost:3000/auth/login](http://localhost:3000/auth/login) (Trang đăng nhập)

---

## 8. Sổ Tay Xử Lý Sự Cố Thường Gặp (Troubleshooting / FAQ)

### ❓ Sự cố 1: Báo lỗi cổng đã bị chiếm dụng (*Port is already allocated / address already in use*)
* **Nguyên nhân:** Máy tính của bạn đã có một dịch vụ khác (ví dụ: máy chủ PostgreSQL cục bộ hoặc một ứng dụng Node.js khác) đang chiếm cổng `5432`, `3000` hoặc `5000`.
* **Khắc phục:**
  1. Mở tệp `.env` trên máy host.
  2. Đổi các cổng bị trùng sang cổng khác, ví dụ:
     ```env
     POSTGRES_PORT=5436
     BACKEND_PORT=5001
     FRONTEND_PORT=3001
     ```
  3. Khởi động lại bằng lệnh: `docker compose up -d`.

### ❓ Sự cố 2: Lỗi chạy lệnh migrate báo *Connection refused* hoặc *Database is starting up*
* **Nguyên nhân:** Container PostgreSQL mất khoảng 3 đến 8 giây để khởi động tiến trình ghi đĩa lần đầu. Lệnh migrate chạy quá sớm khi cơ sở dữ liệu chưa mở cổng tiếp nhận kết nối.
* **Khắc phục:**
  Chờ khoảng 5 giây cho container database chuyển sang trạng thái `healthy`, sau đó chạy lại:
  ```bash
  docker compose exec backend_api npm run migrate
  ```

### ❓ Sự cố 3: Tôi muốn xóa sạch dữ liệu và làm lại từ đầu (Reset Database)
* **Cách 1 (Giữ nguyên container, chỉ xóa dữ liệu bảng):**
  ```bash
  docker compose exec backend_api npm run migrate:rollback --all
  docker compose exec backend_api npm run migrate
  docker compose exec backend_api npm run seed
  ```
* **Cách 2 (Xóa sạch toàn bộ volume và container về trạng thái ban đầu):**
  ```bash
  docker compose down -v
  docker compose up --build -d
  docker compose exec backend_api npm run migrate
  docker compose exec backend_api npm run seed
  ```

### ❓ Sự cố 4: Lỗi *permission denied* khi chạy lệnh `docker` trên Linux
* **Nguyên nhân:** Tài khoản người dùng Linux hiện tại chưa được cấp quyền giao tiếp với socket của Docker daemon.
* **Khắc phục:**
  Thêm người dùng vào nhóm docker (sau đó đăng xuất và đăng nhập lại hệ điều hành):
  ```bash
  sudo usermod -aG docker $USER
  ```

---

## 9. Quy Trình Đóng Góp Mã Nguồn (Git Contribution Workflow)

1. Luôn tạo nhánh mới khi phát triển tính năng: `git checkout -b feature/ten-tinh-nang`.
2. Kiểm tra trạng thái mã nguồn: `git status`.
3. Viết commit message theo chuẩn Conventional Commits:
   - `feat: ...` (Tính năng mới)
   - `fix: ...` (Sửa lỗi)
   - `docs: ...` (Cập nhật tài liệu)
   - `test: ...` (Viết kịch bản kiểm thử)
4. Đẩy mã nguồn lên GitHub: `git push origin feature/ten-tinh-nang`.
