# 📜 Nhật Ký Tiến Độ & Lịch Sử Phát Triển Dự Án
### Dự Án: Cổng Ký Ức, Tri Ân & Vinh Danh Các Chiến Binh Nhí (Courageous Little Warriors Hub)
> **Mã môn học / Đề tài:** BIT208V1 - Đồ Án Chuyên Ngành Công Nghệ Thông Tin  
> **Repository:** [https://github.com/NguyenPhan161206/Pediatric-Patient-Memorial-and-Support](https://github.com/NguyenPhan161206/Pediatric-Patient-Memorial-and-Support)  
> **Kiến trúc:** 3-Tier Decoupled SSR (Node.js/Express, PostgreSQL 16, TailwindCSS shadcn/ui, Docker Compose)  
> **Cập nhật lần cuối:** 19/10/2026 (Phiên bản v2.1 - Dynamic Multi-Tenancy, Phân quyền Least Privilege & Tải Mã QR Gia Đình)

---

## 📑 Mục Lục
1. [Tổng Quan Kiến Trúc & Quyết Định Kỹ Thuật](#1-tổng-quan-kiến-trúc--quyết-định-kỹ-thuật)
2. [Khung Pháp Lý Việt Nam Đã Tích Hợp Sâu Vào Hệ Thống](#2-khung-pháp-lý-việt-nam-đã-tích-hợp-sâu-vào-hệ-thống)
3. [Biên Niên Sử Phát Triển Theo Từng Giai Đoạn](#3-biên-niên-sử-phát-triển-theo-từng-giai-đoạn)
   - [Giai đoạn 1 & 2 (17/10/2026): Khởi tạo Khung Dự Án, Docker 3 Tầng & CSDL 3NF](#31-giai-đoạn-1--2-17102026-khởi-tạo-khung-dự-án-docker-3-tầng--csdl-3nf)
   - [Giai đoạn 3 & 4 (17 - 18/10/2026): Lõi REST API, Cây Điều Ước & Zero-Touch VietQR](#32-giai-đoạn-3--4-17---18102026-lõi-rest-api-cây-điều-ước--zero-touch-vietqr)
   - [Giai đoạn 5 & 6 (18/10/2026): Đa Bệnh Viện, Bản Đồ Hy Vọng & Demo Dazzlers](#33-giai-đoạn-5--6-18102026-đa-bệnh-viện-bản-đồ-hy-vọng--demo-dazzlers)
   - [Giai đoạn Tái Cấu Trúc UI (18/10/2026): Thanh Công Cụ Toolbar Bên Trái (Left Sidebar)](#34-giai-đoạn-tái-cấu-trúc-ui-18102026-thanh-công-cụ-toolbar-bên-trái-left-sidebar)
   - [Giai đoạn Khắc Phục 7 Thiếu Sót & Quy Tắc Git Mềm (18/10/2026)](#35-giai-đoạn-khắc-phục-7-thiếu-sót--quy-tắc-git-mềm-18102026)
   - [Giai đoạn Tối Ưu Hóa 6 Roles & Chuẩn Hóa Danh Tính Đa Thành Tố (19/10/2026)](#36-giai-đoạn-tối-ưu-hóa-6-roles--chuẩn-hóa-danh-tính-đa-thành-tố-19102026)
   - [Giai đoạn Quản Trị Đa Cơ Sở Động, Phân Quyền Nghiêm Ngặt & Tải Mã QR Gia Đình (19/10/2026)](#micro-phase-6-quản-trị-đa-cơ-sở-động-phân-quyền-nghiêm-ngặt--tải-mã-qr-gia-đình-family-qr--dynamic-tenancy)
4. [Bảng Ma Trận Nghiệm Thu 6/6 Roles](#4-bảng-ma-trận-nghiệm-thu-66-roles)
5. [Lịch Sử Commit Trên Git Remote (origin/main)](#5-lịch-sử-commit-trên-git-remote-originmain)

---

## 1. Tổng Quan Kiến Trúc & Quyết Định Kỹ Thuật

* **Mô hình kiến trúc cốt lõi:** **3-Tier Decoupled SSR (Server-Side Rendering)**:
  * **Tầng 1 - Presentation Layer (Frontend SSR):**
    * Express.js, Handlebars Template Engine (`hbs`), TailwindCSS mang ngôn ngữ thiết kế **shadcn/ui** (Slate/Zinc tối giản, thanh lịch, bo góc lớn tinh tế).
    * Thanh công cụ Toolbar bên trái (Left Sidebar) có thể thu gọn (*Collapsible*), phân quyền menu động theo vai trò.
    * Thu âm trực tiếp qua trình duyệt với HTML5 Web Audio API (`MediaRecorder`).
    * Proxy streaming trung gian cho tệp âm thanh và hình ảnh tải lên `/uploads/`.
  * **Tầng 2 - Business Logic Layer (Backend REST API):**
    * Express.js, Knex.js Query Builder, JWT Authentication, Bcrypt.
    * Xử lý giải mã Base64 sang buffer âm thanh `.webm` và hình ảnh `.jpg`/`.png`.
    * Tự động phân tích liên kết YouTube thành URL nhúng (`embed`) và thumbnail chuẩn.
    * Chữ ký số mật mã `HMAC-SHA256` chứng thực tính toàn vẹn của Chứng Nhận Tri Ân Số.
    * Ghi nhật ký kiểm toán (*Audit Logs*) tự động cho mọi thao tác nhạy cảm.
  * **Tầng 3 - Data Storage Layer (PostgreSQL 16):**
    * Cấu trúc chuẩn hóa bậc 3 (3NF), ràng buộc toàn vẹn khóa ngoại `CASCADE` và `SET NULL`.
    * PostgreSQL Full-Text Search `tsvector` đa trọng số kết hợp chỉ mục `GIN` hỗ trợ tìm kiếm tiếng Việt tức thì.
    * Bảng `session` lưu trữ phiên đăng nhập bền vững thông qua `connect-pg-simple`.
  * **Môi trường điều phối ảo hóa:**
    * Docker Compose điều phối 4 dịch vụ cô lập qua mạng cầu nối `warrior_internal_net`.
    * Kiểm tra sức khỏe tự động (*Healthcheck*) đảm bảo phụ thuộc tuần tự (DB $\rightarrow$ Backend $\rightarrow$ Frontend).

---

## 2. Khung Pháp Lý Việt Nam Đã Tích Hợp Sâu Vào Hệ Thống

Hệ thống được thiết kế và triển khai đáp ứng nghiêm ngặt 4 bộ luật và nghị định hiện hành của Nhà nước:

1. **Luật Trẻ Em 2016 (Điều 21, Điều 33, Điều 54):**
   * Bảo vệ quyền bí mật đời sống riêng tư và danh dự của trẻ em.
   * Triển khai **Quyền Rút Hồ Sơ Khẩn Cấp (Emergency Unpublish - Quyền Được Quên)** tại Điều 33: Phụ huynh có toàn quyền ẩn hồ sơ và hình ảnh của con ngay lập tức khỏi kết quả tìm kiếm và trang công khai mà không phải chờ Admin phê duyệt.
   * Lưu trữ văn bản chấp thuận của người giám hộ tại bảng `guardianship_consents`.
2. **Nghị định 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân nhạy cảm - PDPD):**
   * Dữ liệu y tế, chẩn đoán bệnh án, tiền sử điều trị của bệnh nhi được phân quyền bảo mật nhiều lớp.
   * Tách biệt thông tin định danh cá nhân (Họ, Tên đệm, Tên, Giới tính, Quan hệ gia đình) với các chế độ hiển thị ẩn danh (`ANONYMOUS`, `INITIALS`, `FIRST_ONLY`).
3. **Nghị định 93/2021/NĐ-CP (Vận động, tiếp nhận, phân phối nguồn đóng góp tự nguyện):**
   * Áp dụng nguyên tắc **"Không chạm dòng tiền" (Zero-touch Cashflow)**: Nền tảng không tạo ví điện tử trung gian, không thu phí trung gian hoặc hoa hồng.
   * Tạo mã chuẩn quốc gia **VietQR Napas247** chuyển tiền viện phí trực tiếp tới tài khoản ngân hàng chính thức của Bệnh viện hoặc cha mẹ ruột đã được Admin thẩm định (`bank_verified = TRUE`).
   * Cấp Chứng Nhận Tri Ân Số có chữ ký điện tử HMAC-SHA256 và mã QR tra cứu công khai.
4. **Nghị định 147/2024/NĐ-CP & Luật An ninh mạng:**
   * Tiền kiểm duyệt 100% nội dung bình luận, lời chúc tri ân và tin nhắn thoại thu âm trước khi hiển thị công khai trên Bức Tường Tri Ân (`PENDING -> APPROVED`).

---

## 3. Biên Niên Sử Phát Triển Theo Từng Giai Đoạn

### 3.1. Giai đoạn 1 & 2 (17/10/2026): Khởi tạo Khung Dự Án, Docker 3 Tầng & CSDL 3NF
* Xây dựng cấu trúc thư mục 2 phân hệ độc lập: `backend-api/` và `frontend-ssr/`.
* Cấu hình `docker-compose.yml`, thiết lập 4 container: `warrior_db` (PostgreSQL 16), `warrior_backend`, `warrior_frontend`, `warrior_pgadmin`.
* Viết Knex Migration tạo 8 bảng ban đầu: `users`, `categories`, `children`, `guardianship_consents`, `gallery_items`, `tributes`, `audit_logs`, `session`.
* Tạo Knex Seed nạp dữ liệu mẫu ban đầu: 5 tài khoản test, 4 hồ sơ chiến binh nhí đại diện cho 4 trạng thái y tế (`FIGHTER`, `URGENT`, `RECOVERED`, `ANGEL`).
* Thiết lập GitHub Actions CI workflow tự động kiểm tra cú pháp, Docker build và chạy migrations.

---

### 3.2. Giai đoạn 3 & 4 (17 - 18/10/2026): Lõi REST API, Cây Điều Ước & Zero-Touch VietQR
* Triển khai bộ API Auth: Login JWT, Register thành viên, Middleware xác thực quyền sở hữu `ensureFamilyOwnership`.
* Triển khai bộ API Warriors: Tra cứu FTS tiếng Việt có dấu/không dấu, lọc đa tiêu chí, tính năng thắp nến hy vọng nguyên tử (`candle_count = candle_count + 1`).
* **Module Cây Điều Ước (Tree of Wishes):**
  * Tạo bảng `child_wishes`: Quản lý danh sách ước mơ của bé theo nhóm (`TOY`, `BOOK`, `CLOTHES`, `EXPERIENCE`, `OTHER`).
  * Cho phép nhà hảo tâm đăng ký nhận trao quà trực tiếp đến bệnh viện/gia đình (`PENDING -> PROMISED -> FULFILLED`).
* **Module Bảo Trợ Viện Phí VietQR Napas247 & Chứng Nhận Số:**
  * Sinh mã VietQR chuyển khoản viện phí tự động từ cấu hình ngân hàng bệnh viện.
  * Tạo bảng `donations_transactions`: Đối soát sao kê chuyển khoản theo Nghị định 93/2021/NĐ-CP.
  * Tự động sinh Chứng Nhận Tri Ân Số kèm token tra cứu QR và chữ ký số mật mã HMAC-SHA256.

---

### 3.3. Giai đoạn 5 & 6 (18/10/2026): Đa Bệnh Viện, Bản Đồ Hy Vọng & Demo Dazzlers
* **Cơ chế Đa Cơ Sở Y Tế (Multitenancy):**
  * Tạo bảng `organizations`: Quản lý danh mục các bệnh viện tuyến đầu (Bệnh viện Nhi Trung Ương, Bệnh viện K Tân Triều, Bệnh viện Ung Bướu TP.HCM, Quỹ Nụ Cười Em).
  * Liên kết `children.organization_id` và `users.org_id`.
  * Xây dựng Cổng Quản Lý Bệnh Viện (`/organizations/portal`) dành riêng cho vai trò `ORG_ADMIN`.
* **Bản Đồ Hy Vọng Toàn Quốc (Hope Map):**
  * Tích hợp bản đồ trực quan tương tác hiển thị vị trí các cơ sở điều trị, số lượng bệnh nhi và tổng viện phí được bảo trợ.
* **Các tính năng trình diễn đồ án (Dazzlers):**
  * **Cổng Ngân Hàng Mô Phỏng Sandbox 1-Click:** Cho phép Hội đồng Giám khảo thử nghiệm toàn trình quá trình ủng hộ viện phí mà không mất tiền thật, lập tức nhận Chứng Nhận Tri Ân Số.
  * **Trang Tra Cứu Chứng Nhận Số Công Khai (`/verify/cert/:token`):** Xác thực tính hợp lệ của biên lai qua mã QR.

---

### 3.4. Giai đoạn Tái Cấu Trúc UI (18/10/2026): Thanh Công Cụ Toolbar Bên Trái (Left Sidebar)
* Theo yêu cầu của người dùng, toàn bộ các tính năng đặc thù được cấu trúc lại thành một **Thanh công cụ Toolbar bên trái (Left Sidebar - [`sidebar.hbs`](file:///home/binhnguyen/Courageous-Little-Warriors-Memorial-and-Tribute-Hub/frontend-ssr/src/shared/views/partials/sidebar.hbs))**:
  * Chế độ xem máy tính để bàn (Desktop): Có nút thu gọn/mở rộng (*Collapsible* từ 288px sang 80px) lưu trạng thái vào `localStorage`.
  * Chế độ xem di động (Mobile): Drawer trượt mượt mà có backdrop làm mờ.
  * Phân cụm menu logic theo 6 vai trò: Khám Phá Công Khai, Quản Trị Hệ Thống (`ADMIN`), Điều Phối Mạng Lưới (`COORDINATOR`), Cổng Bệnh Viện (`ORG_ADMIN`), Cổng Hộ Gia Đình (`FAMILY`).
  * Tối giản hóa Header Navbar bên trên: Chỉ giữ lại breadcrumbs, badge trạng thái 3-Tier, nút kích hoạt Sandbox và hồ sơ người dùng.

---

### 3.5. Giai đoạn Khắc Phục 7 Thiếu Sót & Quy Tắc Git Mềm (18/10/2026)
* Nhận diện và giải quyết triệt để 7 vấn đề tồn đọng của hệ thống:
  1. Thiếu tài khoản test cho đầy đủ các Role.
  2. Cần lập quy tắc mềm cho việc commit & push Git.
  3. Quản lý trạng thái hồ sơ trẻ em và quyền rút khẩn cấp.
  4. Xác thực chứng từ chuyển khoản và phân bổ ngân sách.
  5. Đối soát đa bệnh viện và cơ chế phân quyền ORG_ADMIN.
  6. Kiểm duyệt nội dung lời chúc và bộ lọc từ ngữ tiêu cực.
  7. Cơ chế lưu trữ tệp tin tải lên (biên lai, ảnh kỷ vật).
* **Thiết lập Quy Tắc Git Mềm (Soft Git Rules):**
  * Phân chia công việc thành các micro-phase tuần tự.
  * Kiểm thử cục bộ thành công trước khi commit.
  * Thông điệp commit chuẩn hóa Conventional Commits (`feat(...)`, `fix(...)`).
  * Thực hiện push lên `origin/main` ngay sau mỗi micro-phase hoàn tất để bảo đảm tính toàn vẹn.

---

### 3.6. Giai đoạn Tối Ưu Hóa 6 Roles & Chuẩn Hóa Danh Tính Đa Thành Tố (19/10/2026)
Thực thi trọn vẹn 5 Micro-Phases theo hướng dẫn của người dùng:

#### Micro-Phase 1: Phân Rã Danh Tính Đa Thành Tố & Xưng Hô Song Ngữ
* **Vấn đề:** Trước đó cột `full_name` bị nhồi nhét hỗn tạp học vị, chức danh, bệnh viện, quan hệ gia đình (vd: *"ThS. Nguyễn Thị Mai (Admin BV K Tân Triều)"*, *"Lê Văn Hải (Bố Bé Mai Chi)"*).
* **Giải pháp:**
  * Tạo Knex Migrations `20261019000001` & `20261019000002`: Bổ sung các cột độc lập vào `users`: `gender`, `title_prefix`, `last_name`, `middle_name`, `first_name`, `family_relation`, `job_title`, `department`, `display_mode`.
  * Xây dựng module [`nameFormatter.js`](file:///home/binhnguyen/Courageous-Little-Warriors-Memorial-and-Tribute-Hub/backend-api/src/shared/utils/nameFormatter.js) tự động xưng hô song ngữ:
    * Tiếng Việt: `Ông` / `Bà` / `Anh` / `Chị`.
    * Tiếng Anh: `Mr.` / `Mrs.` / `Ms.` / `Mx.`.
  * Đăng ký Handlebars helper `formatDisplayName`.
  * Cập nhật form Đăng ký (`register.hbs`) với Live Preview song ngữ thời gian thực.
  * **Commit:** `c099b39`.

#### Micro-Phase 2: Role ADMIN - Dashboard & Quản Lý Người Dùng Tập Trung
* Backend API: Tạo `admin.controller.js` và `admin.routes.js` gắn kết tại `/api/v1/admin`.
  * `GET /admin/dashboard/metrics`: Tổng hợp chỉ số hệ thống, viện phí, bệnh nhi, hàng đợi kiểm duyệt, phân bổ viện.
  * `GET /admin/users`: Truy vấn danh sách người dùng phân trang, lọc đa chiều.
  * `POST /admin/users`: Cấp phát tài khoản đa vai trò trung tâm.
  * `PATCH /admin/users/:id/status` & `POST /admin/users/:id/reset-password`: Khóa/mở khóa tài khoản và reset mật khẩu.
* Frontend SSR:
  * Trang Bảng Điều Hành [`/admin/dashboard`](file:///home/binhnguyen/Courageous-Little-Warriors-Memorial-and-Tribute-Hub/frontend-ssr/src/modules/admin/views/dashboard.hbs).
  * Trang Quản Trị Người Dùng [`/admin/users`](file:///home/binhnguyen/Courageous-Little-Warriors-Memorial-and-Tribute-Hub/frontend-ssr/src/modules/admin/views/users.hbs) kèm Modal cấp tài khoản và live preview.
* **Commit:** `8639d15`.

#### Micro-Phase 3: Role FAMILY - Kho Kỷ Niệm & Ghi Âm Lời Ru Web Audio
* Migration `20261019000003`: Mở rộng `gallery_items` sang `VIDEO`, `AUDIO`, `DRAWING`, `IMAGE`; thêm trường `audio_url` và `duration_seconds` vào `tributes`.
* Backend API:
  * `POST /warriors/:id/gallery`: Tiếp nhận ảnh tải lên (base64) hoặc link YouTube (tự động chuyển thành link nhúng `embed` và thumbnail).
  * `DELETE /warriors/:id/gallery/:itemId`: Xóa kỷ vật.
  * `POST /tributes/:id/tributes`: Tiếp nhận tin nhắn thoại base64, giải mã buffer thành file âm thanh tĩnh `.webm` tại `/uploads/voice_notes/`.
  * `PATCH /auth/profile`: Cập nhật tùy biến danh tính phụ huynh.
* Frontend SSR:
  * Cổng Gia Đình [`/family/portal`](file:///home/binhnguyen/Courageous-Little-Warriors-Memorial-and-Tribute-Hub/frontend-ssr/src/modules/family/views/portal.hbs): Tích hợp Kho Kỷ Niệm Của Con, Bộ thu âm lời ru Web Audio (HTML5 `MediaRecorder`) kèm đồng hồ đếm giây, sóng âm và nghe lại, Thẻ cài đặt danh xưng phụ huynh.
  * Trang Chi Tiết [`/warriors/:slug`](file:///home/binhnguyen/Courageous-Little-Warriors-Memorial-and-Tribute-Hub/frontend-ssr/src/modules/warriors/views/detail.hbs): Trình phát video YouTube nhúng, Audio player phát lời ru, Bộ thu âm lời chúc cho khách thăm.
  * Proxy `/uploads` trong `app.js` cho phép truyền phát audio trực tiếp từ backend sang frontend.
* **Commit:** `91b8b99`.

#### Micro-Phase 4: Roles COORDINATOR & ORG_ADMIN - Kiểm Duyệt Audio & Cán Bộ Y Tế
* Role `COORDINATOR`: Tích hợp Audio Player vào [Hàng Đợi Tiền Kiểm](/tributes/moderation) để nghe thẩm định tin nhắn thoại trước khi phê duyệt.
* Role `ORG_ADMIN`: Cập nhật `getMyOrganizationPortal` bổ sung danh sách đội ngũ nhân sự y tế (`staff`) thuộc bệnh viện kèm học hàm (`BS.`, `ThS.`, `TS.`), chức vụ (`job_title`) và khoa phòng (`department`); hiển thị bảng nhân sự tại Cổng Bệnh Viện [`/organizations/portal`](file:///home/binhnguyen/Courageous-Little-Warriors-Memorial-and-Tribute-Hub/frontend-ssr/src/modules/organizations/views/portal.hbs).
* **Commit:** `e1acb30`.

#### Micro-Phase 5: Đồng Bộ Giao Diện Toàn Cầu & Kiểm Thử Tự Động 6/6 Role
* Đồng bộ `formatDisplayName currentUser` trên Header Navbar ([`navbar.hbs`](file:///home/binhnguyen/Courageous-Little-Warriors-Memorial-and-Tribute-Hub/frontend-ssr/src/shared/views/partials/navbar.hbs)) và Toolbar ([`sidebar.hbs`](file:///home/binhnguyen/Courageous-Little-Warriors-Memorial-and-Tribute-Hub/frontend-ssr/src/shared/views/partials/sidebar.hbs)).
* **Commit:** `15be21a`.

#### Micro-Phase 6: Quản Trị Đa Cơ Sở Động, Phân Quyền Nghiêm Ngặt & Tải Mã QR Gia Đình (Family QR & Dynamic Tenancy)
* **Nguyên tắc cốt lõi:**
  * Triệt để loại bỏ hardcode đơn vị y tế, chuyển sang cơ chế Dynamic Multi-Tenancy.
  * Phân quyền theo nguyên tắc đặc quyền tối thiểu (Least Privilege): Quản trị viên hệ thống (`ADMIN`, `SUPER_ADMIN`) **tuyệt đối không được can thiệp** thêm, sửa, xóa hồ sơ bệnh nhi (`children`) hoặc tạo tài khoản Hộ gia đình (`FAMILY`) nhằm tuân thủ Luật Trẻ Em 2016 và Nghị định 13/2023/NĐ-CP (PDPD).
  * Đơn vị phụ trách y tế (`ORG_ADMIN`) chịu trách nhiệm toàn diện với các thành tố trực thuộc: tiếp nhận bệnh nhi, cấp tài khoản Hộ gia đình, thẩm định mã QR quyên góp viện phí.
* **Các thay đổi đã triển khai:**
  1. **Database Migration:** Tạo `20261019000004_add_family_bank_qr_to_children.js` bổ sung các cột quản lý tài khoản ngân hàng gia đình, ảnh QR và trạng thái thẩm định `family_bank_verified`.
  2. **Backend API:**
     * `ensureFamilyOwnership.js`: Chặn `ADMIN`/`SUPER_ADMIN` sửa/xóa bệnh nhi, trả về HTTP 403 trích dẫn luật định.
     * `warrior.controller.js` & `warrior.routes.js`: Chặn System Admin tạo bé; bổ sung endpoint `POST /api/v1/warriors/:id/family-bank` và `PATCH /api/v1/warriors/:id/family-bank/verify`; tự động sinh `familyVietqrUrl` chuẩn Napas247 khi đã duyệt.
     * `organization.controller.js` & `organization.routes.js`: Bổ sung `POST /api/v1/organizations` (tạo viện + `ORG_ADMIN` trong atomic transaction), `PATCH /api/v1/organizations/:id/status` (khóa/mở cơ sở), `POST /api/v1/organizations/family-user` (viện cấp tài khoản gia đình).
     * `admin.controller.js`: Chặn System Admin cấp quyền `FAMILY` trực tiếp.
  3. **Frontend SSR:**
     * `/admin/organizations`: Trang quản lý Bệnh viện động cho System Admin kèm modal thêm viện + cấp `ORG_ADMIN`.
     * `/organizations/portal`: Bổ sung modal tiếp nhận bé trực thuộc viện, modal cấp tài khoản Hộ gia đình, danh mục và modal thẩm định/duyệt/từ chối QR viện phí.
     * `/family/portal`: Cho phép phụ huynh gửi số tài khoản và tải ảnh mã QR viện phí với trạng thái thẩm định rõ ràng.
     * `/warriors/:slug`: Hiển thị mã QR gia đình song song với mã Bệnh viện khi đã được viện thẩm định theo Nghị định 93/2021/NĐ-CP.
  4. **Kiểm thử tự động:** Tạo script kiểm thử `tests/test_dynamic_tenancy_and_family_qr.js` xác thực 7 bước luồng nghiệp vụ (21/21 assertions PASSED 100%).

---

## 4. Bảng Ma Trận Nghiệm Thu 6/6 Roles

Hệ thống đã trải qua quy trình kiểm thử tự động toàn diện qua Docker Container:

| STT | Vai Trò (Role) | Tài Khoản Kiểm Thử | Tên Hiển Thị Chuẩn Hóa | Tính Năng Đo Kiểm | Kết Quả Thực Tế |
| :-: | :--- | :--- | :--- | :--- | :-: |
| 1 | **SUPER_ADMIN / ADMIN** | `admin@warrior.org` | Nguyễn Văn Trị (Quản Trị Viên Vận Hành) | Dashboard điều hành, Thống kê 11 users, Phân quyền, Khóa/Mở, Reset mật khẩu | **100% PASS** |
| 2 | **COORDINATOR** | `coordinator@warrior.org` | CN. Trần Thị Thu Hà (Điều Phối Viên Mạng Lưới) | Hàng đợi tiền kiểm lời chúc, Thẩm định audio tin nhắn thoại, Cấp tài khoản gia đình | **100% PASS** |
| 3 | **ORG_ADMIN** | `orgadmin.k@warriorhub.vn` | ThS. Nguyễn Thị Mai (Quản Trị Viên Đơn Vị Y Tế) | Cổng Bệnh viện K Tân Triều, Hồ sơ bệnh nhi, Đội ngũ bác sĩ y tế khoa phòng | **100% PASS** |
| 4 | **FAMILY** | `family.minhan@gmail.com` | KTS. Lê Văn Hải (Bố bé Mai Chi) | Tùy biến xưng hô Ông/Bà, Kho ảnh/video YouTube, Thu âm lời ru Web Audio, Rút khẩn cấp | **100% PASS** |
| 5 | **MEMBER / VOLUNTEER** | `supporter@gmail.com` | Phạm Minh Hùng | Đăng nhập tài khoản, Xem cây điều ước, Đăng ký hỗ trợ | **100% PASS** |
| 6 | **PUBLIC GUEST** | Khách vãng lai | N/A | Xem hồ sơ, Thắp nến tri ân, Sandbox 1-Click chuyển viện phí, Quét QR Chứng nhận số | **100% PASS** |

---

## 5. Lịch Sử Commit Trên Git Remote (`origin/main`)

Toàn bộ chuỗi commit nguyên tử đã được đẩy thành công lên nhánh chính:

```text
15be21a (HEAD -> main, origin/main) feat(ui): apply unified multi-attribute name display across header and sidebar
e1acb30 feat(moderation): add voice tribute audio player to moderation queue and enhance hospital reports
91b8b99 feat(family): implement memorial media vault with photo, video, and HTML5 web audio voice recording
8639d15 feat(admin): implement unified admin dashboard and central user management with role provisioning
c099b39 feat(identity): normalize multi-attribute identity with gender, titles, family relations, job roles and bilingual salutations
```
