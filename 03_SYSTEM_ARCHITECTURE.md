# PHẦN 3: THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống được thiết kế theo mô hình **3-Tier Phân tách (Decoupled SSR)**, tổ chức mã nguồn theo **Feature-based**, áp dụng kiểm soát sở hữu **Ownership-based RBAC**, tích hợp chuẩn VietQR Napas247 và triển khai trên hạ tầng mạng độc lập bằng **Docker Compose** với cơ chế giám sát `healthcheck`.

---

### 3.1. Sơ đồ Kiến trúc Tổng thể (High-Level Architecture Diagram)

```text
[ Người dùng / Client Browser / Mobile / Nhà hảo tâm ]
              │ (HTTP GET/POST trên Cổng 3000)
              ▼
┌─────────────────────────────────────────────────────────────┐
│ TẦNG 1: FRONTEND SSR SERVICE (Node.js/Express + ViewEngine) │
│ - Đảm nhận: Render HTML động, OpenGraph Meta Tags, Session  │
│ - Pattern: ViewController (M-V-C nhẹ)                       │
│ - Feature-based: modules/auth, modules/warriors, ...        │
│ - Tích hợp: Trực tiếp hiển thị mã VietQR (từ CDN VietQR.io) │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ (Mạng Docker Nội bộ - Không lộ ra Internet)
                              │ HTTP REST Call (JSON API trên Cổng 5000)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ TẦNG 2: BACKEND API SERVICE (Node.js/Express + Business)    │
│ - Đảm nhận: Core Business, Validation, Multer, XSS Filter   │
│ - Phân quyền: 5-Tier RBAC & Middleware kiểm tra Ownership   │
│ - Pattern: Model-Service-Controller (Feature-based)         │
│ - Tương tác Database: Knex.js Query Builder                 │
│ - Giám sát sức khỏe: GET /api/v1/health                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ (Cổng nội bộ 5432 - Chỉ Backend & Session kết nối)
                              ▼
┌───────────────────────────────────────────┐    ┌─────────────────────────┐
│ TẦNG 3: DATABASE (PostgreSQL 16 Engine)   │    │ PGADMIN 4 (Quản trị GUI)│
│ - Bảng quan hệ chuẩn 3NF, Bảng Consents   │◄───│ - Port 5050 (Ánh xạ)    │
│ - Full-Text Search TSVECTOR & GIN Index   │    │ - Kết nối bảo trì DB    │
│ - Centralized Session Store (session tbl) │    └─────────────────────────┘
│ - Bảng Audit Logs & Persistent Volume     │
└───────────────────────────────────────────┘
```

---

### 3.2. Cấu trúc Tổ chức Thư mục theo Feature-Based

#### A. Phân hệ `frontend-ssr/` (Tập trung View & ViewController)

```text
frontend-ssr/
├── src/
│   ├── modules/ (Feature-based)
│   │   ├── auth/
│   │   │   ├── auth.viewcontroller.js     # Nhận request form login/register -> gọi Backend API
│   │   │   ├── auth.routes.js             # Định nghĩa router /login, /register, /logout
│   │   │   └── views/                     # login.hbs, register.hbs
│   │   ├── warriors/
│   │   │   ├── warrior.viewcontroller.js  # Gọi API lấy data danh sách, chi tiết, render OpenGraph
│   │   │   ├── warrior.routes.js          # /warriors, /warriors/:slug
│   │   │   └── views/                     # list.hbs, detail.hbs, create-warrior.hbs
│   │   ├── family-portal/                 # Không gian riêng dành cho Cha mẹ bệnh nhi
│   │   │   ├── family.viewcontroller.js   # Xử lý cập nhật nhật ký, đổi STK, rút/ẩn hồ sơ bé
│   │   │   ├── family.routes.js           # /family/my-child, /family/unpublish
│   │   │   └── views/                     # dashboard.hbs, edit-story.hbs
│   │   └── tributes/
│   │       ├── tribute.viewcontroller.js  # Xử lý action thắp nến, form gửi lời tri ân
│   │       ├── tribute.routes.js          # /warriors/:id/tributes
│   │       └── views/                     # tribute-wall.hbs, moderation-list.hbs
│   ├── shared/
│   │   ├── layouts/                       # main.hbs (Master Layout: Header, Footer, Flash Message)
│   │   ├── middlewares/                   # ensureAuth.js, ensureRole.js, csrfMiddleware.js
│   │   └── utils/
│   │       ├── apiClient.js               # Axios instance cấu hình BaseURL nội bộ Docker
│   │       └── vietqrHelper.js            # Hàm sinh link ảnh VietQR Napas247 chuẩn quốc gia
│   ├── public/                            # Static CSS (Tailwind/Bootstrap), Client-side JS, Logos
│   ├── app.js                             # Cấu hình Express SSR, session connect-pg-simple
│   └── Dockerfile
```

#### B. Phân hệ `backend-api/` (Tập trung Model, Service & Business Controller)

```text
backend-api/
├── src/
│   ├── features/ (Feature-based)
│   │   ├── auth/
│   │   │   ├── auth.controller.js         # Đăng nhập, cấp session/token, cấp tài khoản Family
│   │   │   ├── auth.service.js            # Xác thực bcrypt, kiểm tra trạng thái kích hoạt
│   │   │   ├── auth.model.js              # Knex query bảng 'users'
│   │   │   └── auth.routes.js             # /api/v1/auth/login, /api/v1/auth/provision-family
│   │   ├── warriors/
│   │   │   ├── warrior.controller.js      # Phân trang, FTS, tạo hồ sơ, ẩn/rút hồ sơ
│   │   │   ├── warrior.service.js         # Format tsvector, kiểm tra soft-delete, sanitize HTML
│   │   │   ├── warrior.model.js           # Knex query bảng 'children', index GIN
│   │   │   └── warrior.routes.js          # GET /api/v1/warriors, PATCH /api/v1/warriors/:id/unpublish
│   │   ├── sponsorships/
│   │   │   ├── sponsorship.controller.js  # Duyệt STK ngân hàng, thẩm định chứng từ viện phí
│   │   │   ├── sponsorship.service.js     # Logic cập nhật bank_verified = TRUE, ghi Audit Log
│   │   │   └── sponsorship.routes.js      # PATCH /api/v1/sponsorships/:childId/verify
│   │   └── tributes/
│   │       ├── tribute.controller.js      # Nhận lời chúc (PENDING), duyệt lời chúc (APPROVED)
│   │       ├── tribute.service.js         # Logic thắp nến hy vọng (Rate-limit), duyệt bài
│   │       ├── tribute.model.js           # Knex query bảng 'tributes'
│   │       └── tribute.routes.js          # POST /api/v1/tributes, PATCH /api/v1/tributes/:id/approve
│   ├── shared/
│   │   ├── database/                      # knexfile.js, migrations/, seeds/
│   │   ├── middlewares/
│   │   │   ├── errorHandler.js            # Bắt lỗi tập trung, format JSON response chuẩn
│   │   │   ├── uploadMiddleware.js        # Multer tải ảnh bé và chứng từ giám hộ
│   │   │   ├── rateLimiter.js             # express-rate-limit chống brute-force và spam
│   │   │   └── ensureFamilyOwnership.js   # Chặn truy cập chéo giữa các gia đình
│   │   ├── security/                      # xssSanitizer.js (DOMPurify)
│   │   └── audit/                         # auditLogger.js (ghi dữ liệu vào bảng audit_logs)
│   ├── server.js                          # Điểm khởi chạy API và route /api/v1/health
│   └── Dockerfile
```

---

### 3.3. Thiết kế Cơ sở Dữ liệu Quan hệ (Physical Database Schema)

Hệ thống được chuẩn hóa tối thiểu mức 3NF trên PostgreSQL 16, hỗ trợ đầy đủ **5-Tier RBAC**, **Minh chứng Giám hộ**, **VietQR Bảo trợ** và **Quyền được quên (Soft Delete)**:

```sql
-- 1. Bảng Users (Tài khoản người dùng: 5 Cấp độ Phân quyền)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50) DEFAULT 'MEMBER' 
        CHECK (role IN ('MEMBER', 'COORDINATOR', 'FAMILY', 'ADMIN')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Categories (Nhóm danh mục bệnh lý ung thư/hiểm nghèo)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT
);

-- 3. Bảng Children (Hồ sơ chiến binh nhí)
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    nickname VARCHAR(100),
    slug VARCHAR(200) UNIQUE NOT NULL,
    dob DATE,
    hometown VARCHAR(150),
    status VARCHAR(50) DEFAULT 'FIGHTER' 
        CHECK (status IN ('FIGHTER', 'ANGEL', 'URGENT', 'RECOVERED')),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    dream_summary VARCHAR(500),
    story_html TEXT NOT NULL,                     -- HTML sạch đã được sanitize
    avatar_url VARCHAR(500),
    candle_count INT DEFAULT 0,
    search_vector TSVECTOR,                       -- Phục vụ Full-Text Search
    
    -- Liên kết phân quyền & Sở hữu gia đình
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    family_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Gắn tài khoản cha mẹ
    
    -- Thông tin Bảo trợ & Mã VietQR (Nghị định 93/2021/NĐ-CP)
    sponsorship_type VARCHAR(30) DEFAULT 'HOSPITAL' 
        CHECK (sponsorship_type IN ('HOSPITAL', 'FAMILY_GUARDIAN')),
    hospital_patient_code VARCHAR(100),           -- Mã số bệnh nhân viện phí (nếu có)
    bank_code VARCHAR(20),                        -- Mã định danh ngân hàng (VCB, MB, ICB...)
    bank_account_number VARCHAR(50),              -- Số tài khoản thụ hưởng
    bank_account_name VARCHAR(150),               -- Tên chủ tài khoản (in hoa không dấu)
    bank_verified BOOLEAN DEFAULT FALSE,          -- Cờ kiểm duyệt tài khoản chính chủ
    
    -- Trạng thái xuất bản & Quyền được quên (Nghị định 13/2023/NĐ-CP)
    is_published BOOLEAN DEFAULT FALSE,           -- Mặc định False đến khi duyệt cam kết
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- Soft-delete phục vụ rút hồ sơ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Guardianship Consents (Minh chứng Giám hộ & Cam kết Pháp lý - Luật Trẻ Em)
CREATE TABLE guardianship_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    guardian_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_proof_url VARCHAR(500) NOT NULL,     -- Ảnh Giấy khai sinh/Giấy ủy quyền
    child_consent_verified BOOLEAN DEFAULT FALSE, -- Xác nhận của bé nếu từ đủ 7 tuổi
    legal_terms_agreed BOOLEAN DEFAULT TRUE,      -- Cam kết tuân thủ Luật Trẻ em 2016
    ip_address VARCHAR(45) NOT NULL,              -- Địa chỉ IP lưu vết chấp thuận
    agreed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Gallery Items (Kỷ vật / Tranh vẽ / Ảnh điều trị của các bé)
CREATE TABLE gallery_items (
    id SERIAL PRIMARY KEY,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    media_url VARCHAR(500) NOT NULL,
    media_type VARCHAR(20) DEFAULT 'IMAGE' 
        CHECK (media_type IN ('IMAGE', 'DRAWING', 'DOCUMENT')),
    caption VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Tributes & Wishes (Lời nhắn tri ân / Bức tường hy vọng)
CREATE TABLE tributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    sender_name VARCHAR(100) NOT NULL,
    sender_email VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng Audit Logs (Nhật ký Kiểm toán Hệ thống)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,                 -- VD: 'APPROVE_BANK', 'UNPUBLISH_CHILD'
    resource_type VARCHAR(50) NOT NULL,           -- VD: 'CHILDREN', 'TRIBUTES'
    resource_id UUID NOT NULL,
    metadata JSONB,                               -- Chi tiết dữ liệu thay đổi
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bảng Session (Lưu trữ Phiên làm việc Tập trung cho connect-pg-simple)
CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL COLLATE "default",
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX "IDX_session_expire" ON "session" ("expire");

-- Tối ưu hóa chỉ mục Tìm kiếm & Truy vấn (Performance Indexes)
CREATE INDEX idx_children_search_vector ON children USING GIN(search_vector);
CREATE INDEX idx_children_category ON children(category_id);
CREATE INDEX idx_children_status_published ON children(status, is_published) WHERE deleted_at IS NULL;
CREATE INDEX idx_children_family_user ON children(family_user_id);
CREATE INDEX idx_tributes_child_status ON tributes(child_id, status);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
```

---

### 3.4. Cấu hình Hạ tầng Khởi chạy với Docker Compose

File `docker-compose.yml` liên kết toàn bộ 3 tầng dịch vụ, áp dụng mạng nội bộ bảo mật và điều kiện giám sát sức khỏe container (`healthcheck`):

```yaml
version: '3.8'

networks:
  warrior_internal_net:
    driver: bridge

volumes:
  pgdata:
  uploads_data:

services:
  # CSDL PostgreSQL (Tầng 3: Engine Dữ liệu & Lưu trữ Session)
  postgres_db:
    image: postgres:16-alpine
    container_name: warrior_db
    restart: always
    environment:
      POSTGRES_USER: db_admin
      POSTGRES_PASSWORD: secure_password_2026
      POSTGRES_DB: warrior_hub_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - warrior_internal_net
    expose:
      - "5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U db_admin -d warrior_hub_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Công cụ GUI Quản lý pgAdmin 4 (Phụ trợ Tầng 3)
  pgadmin:
    image: dpage/pgadmin4
    container_name: warrior_pgadmin
    restart: always
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@warrior.org
      PGADMIN_DEFAULT_PASSWORD: admin_secure_pass
    ports:
      - "5050:80"
    depends_on:
      postgres_db:
        condition: service_healthy
    networks:
      - warrior_internal_net

  # Backend REST API Service (Tầng 2: Core Logic & Validation)
  backend_api:
    build:
      context: ./backend-api
      dockerfile: Dockerfile
    container_name: warrior_backend
    restart: always
    environment:
      PORT: 5000
      DATABASE_URL: postgres://db_admin:secure_password_2026@postgres_db:5432/warrior_hub_db
      INTERNAL_API_SECRET: super_secret_token_key_2026
      NODE_ENV: production
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      postgres_db:
        condition: service_healthy
    networks:
      - warrior_internal_net
    expose:
      - "5000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/v1/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Frontend SSR Web Server (Tầng 1: Cổng giao tiếp Client & Render HTML)
  frontend_ssr:
    build:
      context: ./frontend-ssr
      dockerfile: Dockerfile
    container_name: warrior_frontend
    restart: always
    environment:
      PORT: 3000
      BACKEND_API_URL: http://backend_api:5000/api/v1
      DATABASE_URL: postgres://db_admin:secure_password_2026@postgres_db:5432/warrior_hub_db
      SESSION_SECRET: session_secret_string_2026
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      backend_api:
        condition: service_healthy
    networks:
      - warrior_internal_net
```
