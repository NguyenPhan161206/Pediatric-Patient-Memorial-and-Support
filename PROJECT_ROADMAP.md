# Bản Đồ Công Việc & Lộ Trình Toàn Diện Dự Án (Project Roadmap)

> **Dự án:** Cổng Lưu Trữ, Tri Ân & Vinh Danh Các Chiến Binh Nhí (*Courageous Little Warriors Memorial and Tribute Hub*)  
> **Môn học:** BIT208V1 - Dự Án Công Nghệ Thông Tin  
> **Định hướng chiến lược:** Tối ưu hóa điểm số đánh giá (A / 9.0+) cho đồ án tốt nghiệp với Kiến trúc Liên viện Đa đơn vị (**Multi-Tenancy**), Phân quyền 6 cấp (**6-Tier RBAC**) và Bộ tứ tính năng đột phá (**Showcase Dazzlers**).

---

## 📌 Mục Lục Tổng Quan Các Giai Đoạn

- [Giai đoạn 1: Khởi tạo Khung Dự Án & Docker 3 Tầng](#giai-đoạn-1-khởi-tạo-khung-dự-án--docker-3-tầng) `[ĐÃ HOÀN THÀNH]`
- [Giai đoạn 2: Cơ Sở Dữ Liệu 3NF, Trigger FTS & Dữ Liệu Mẫu Ban Đầu](#giai-đoạn-2-cơ-sở-dữ-liệu-3nf-trigger-fts--dữ-liệu-mẫu-ban-đầu) `[ĐÃ HOÀN THÀNH]`
- [Giai đoạn 3: Xây Dựng Lõi Backend REST API & Kịch Bản CI/CD](#giai-đoạn-3-xây-dựng-lõi-backend-rest-api--kịch-bản-cicd) `[ĐÃ HOÀN THÀNH]`
- [Giai đoạn 4: Hoàn Thiện Giao Diện Người Dùng Frontend SSR](#giai-đoạn-4-hoàn-thiện-giao-diện-người-dùng-frontend-ssr) `[ĐÃ HOÀN THÀNH]`
- [Giai đoạn 5: Nâng Cấp Không Gian Đa Đơn Vị (Multi-Tenancy) & Phân Quyền 6 Cấp `ORG_ADMIN`](#giai-đoạn-5-nâng-cấp-không-gian-đa-đơn-vị-multi-tenancy--phân-quyền-6-cấp-org_admin) `[GIAI ĐOẠN TIẾP THEO - SẮP THỰC HIỆN]`
- [Giai đoạn 6: Bộ Tứ Tính Năng Mũi Nhọn "Ăn Điểm Tuyệt Đối" (The 4 Showcase Dazzlers)](#giai-đoạn-6-bộ-tứ-tính-năng-mũi-nhọn-ăn-điểm-tuyệt-đối-the-4-showcase-dazzlers) `[KẾ TIẾP]`
- [Giai đoạn 7: Kiểm Thử Đầu Cuối (E2E), Tối Ưu Hiệu Năng & An Toàn Bảo Mật](#giai-đoạn-7-kiểm-thử-đầu-cuối-e2e-tối-ưu-hiệu-năng--an-toàn-bảo-mật) `[DỰ KIẾN]`
- [Giai đoạn 8: Đóng Gói Báo Cáo Học Thuật, Slide & Kịch Bản Demo 5 Phút](#giai-đoạn-8-đóng-gói-báo-cáo-học-thuật-slide--kịch-bản-demo-5-phút) `[VỀ ĐÍCH]`

---

## 🚀 Chi Tiết Từng Giai Đoạn & Đầu Việc Thực Hiện

### Giai đoạn 1: Khởi tạo Khung Dự Án & Docker 3 Tầng `[ĐÃ HOÀN THÀNH]`
- [x] **1.1.** Khởi tạo cấu trúc mã nguồn tách biệt 3 tầng (`backend-api`, `frontend-ssr`, `postgres_db`).
- [x] **1.2.** Viết `docker-compose.yml` tích hợp container Docker, cơ chế Healthcheck và cô lập mạng nội bộ.
- [x] **1.3.** Tích hợp công cụ trực quan quản trị cơ sở dữ liệu pgAdmin 4 Desktop/Web.
- [x] **1.4.** Viết bộ hồ sơ đặc tả yêu cầu nghiệp vụ (`01_PROJECT_SPECIFICATION.md`, `02_SOFTWARE_REQUIREMENTS_SPECIFICATION.md`, `03_SYSTEM_ARCHITECTURE.md`).

### Giai đoạn 2: Cơ Sở Dữ Liệu 3NF, Trigger FTS & Dữ Liệu Mẫu Ban Đầu `[ĐÃ HOÀN THÀNH]`
- [x] **2.1.** Thiết kế lược đồ CSDL chuẩn hóa 3NF gồm 8 bảng quan hệ qua Knex Migrations.
- [x] **2.2.** Tạo Function & Trigger tự động lập chỉ mục tìm kiếm tiếng Việt Full-Text Search (`tsvector` & GIN index).
- [x] **2.3.** Tạo cơ chế xóa mềm (Soft-delete) bảo vệ quyền được quên theo Luật Trẻ em 2016.
- [x] **2.4.** Nạp bộ dữ liệu mẫu (Knex Seeds) gồm 5 nhóm tài khoản phân quyền RBAC và 4 hồ sơ chiến binh nhí đại diện.

### Giai đoạn 3: Xây Dựng Lõi Backend REST API & Kịch Bản CI/CD `[ĐÃ HOÀN THÀNH]`
- [x] **3.1.** Phân hệ Xác thực & Phân quyền: Đăng nhập JWT, cấp tài khoản gia đình đóng (`/auth`).
- [x] **3.2.** Phân hệ Hồ sơ Chiến binh: Tìm kiếm FTS không dấu, lọc đa chiều, phân trang, rút hồ sơ khẩn cấp (`/warriors`).
- [x] **3.3.** Phân hệ Tưởng niệm & Tri ân: Thắp nến nguyên tử, gửi lời chúc, duyệt lời chúc (`/tributes`).
- [x] **3.4.** Phân hệ Bảo trợ VietQR: Sinh mã VietQR Napas247 zero-touch, thẩm định ngân hàng theo NĐ 93/2021 (`/sponsorships`).
- [x] **3.5.** Thiết lập GitHub Actions CI/CD tự động kiểm tra cú pháp và build kiểm thử khi push mã nguồn.

### Giai đoạn 4: Hoàn Thiện Giao Diện Người Dùng Frontend SSR `[ĐÃ HOÀN THÀNH]`
- [x] **4.1.** Cấu hình Session 7 ngày và Dynamic Header nhận diện vai trò người dùng (`ADMIN`, `FAMILY`, `COORDINATOR`, `MEMBER`).
- [x] **4.2.** Màn hình Đăng nhập & Đăng ký tài khoản (phong cách shadcn/ui Slate/Zinc kèm nút điền mẫu tự động).
- [x] **4.3.** Màn hình Danh mục Chiến binh: Thanh tìm kiếm tiếng Việt FTS, bộ lọc bệnh lý, lưới Card các bé, phân trang.
- [x] **4.4.** Màn hình Chi tiết Bé: Tương tác click Thắp nến trực tiếp, hiển thị ảnh mã VietQR Napas247, góc tranh vẽ và tường lời chúc.
- [x] **4.5.** Cổng Phụ huynh & Gia đình: Cập nhật nhật ký điều trị và nút đỏ Rút hồ sơ khẩn cấp (Emergency Unpublish).
- [x] **4.6.** Bảng Quản trị Tiền kiểm duyệt Lời chúc: Phê duyệt hoặc từ chối tin nhắn gửi tới trẻ em.

---

### Giai đoạn 5: Nâng Cấp Không Gian Đa Đơn Vị (Multi-Tenancy) & Phân Quyền 6 Cấp `ORG_ADMIN` `[GIAI ĐOẠN TIẾP THEO - SẮP THỰC HIỆN]`
*Mục tiêu: Đưa hệ thống lên chuẩn Enterprise liên viện, giải quyết triệt để tính độc lập dữ liệu giữa Bệnh viện Nhi TW, Bệnh viện K Tân Triều và các Quỹ bảo trợ.*
- [ ] **5.1.** Tạo Knex Migration `20261018000001_create_organizations_and_extend_rbac.js`:
  - Tạo bảng `organizations` (`id`, `name`, `code`, `logo_url`, `bank_account_number`, `bank_code`, `contact_person`, `phone`, `address`, `lat`, `lng`).
  - Alter bảng `users`: Bổ sung cột `org_id` (khóa ngoại trỏ về `organizations`), mở rộng ENUM vai trò bổ sung giá trị `ORG_ADMIN`.
  - Alter bảng `children`: Bổ sung cột `organization_id` (khóa ngoại trỏ về `organizations`).
- [ ] **5.2.** Tạo Knex Seed `02_seed_organizations_and_org_admins.js`:
  - Nạp 3 tổ chức mẫu: *Bệnh viện Nhi Trung Ương* (Hà Nội), *Bệnh viện K Tân Triều* (Hà Nội), *Quỹ Nụ Cười Em* (TP.HCM).
  - Nạp tài khoản `ORG_ADMIN` chuyên biệt cho từng viện (ví dụ: `orgadmin.nhitrunguong@warriorhub.vn`, `orgadmin.ktan-trieu@warriorhub.vn`).
  - Gán các bé mẫu hiện có về từng đơn vị bệnh viện tương ứng.
- [ ] **5.3.** Nâng cấp Middleware Backend RBAC (`auth.middleware.js`):
  - Hỗ trợ phân quyền đa tầng: `SUPER_ADMIN` có quyền toàn cục; `ORG_ADMIN` bị chặn tự động ở tầng truy vấn nếu cố tình thao tác trên bệnh nhi hoặc điều phối viên của viện khác (ngăn chặn IDOR).
- [ ] **5.4.** Xây dựng API và Cổng Thông Tin Bệnh Viện:
  - Endpoint `GET /api/v1/organizations`: Lấy danh sách bệnh viện kèm tọa độ bản đồ.
  - Bộ lọc Bệnh viện điều trị trên giao diện Danh mục Chiến binh ngoài trang chủ.

---

### Giai đoạn 6: Bộ Tứ Tính Năng Mũi Nhọn "Ăn Điểm Tuyệt Đối" (The 4 Showcase Dazzlers) `[KẾ TIẾP]`
*Mục tiêu: Tạo ra các điểm chạm tương tác sinh động và giải quyết trọn vẹn bài toán minh bạch thiện nguyện theo NĐ 93/2021/NĐ-CP.*
- [ ] **6.1. Bức Tường Vinh Danh & Xét Duyệt Biên Lai (Proof Verification Flow):**
  - Tạo bảng `donations_recognition`: Lưu thông tin ủng hộ, mã tham chiếu ngân hàng, ảnh chụp màn hình chuyển khoản, trạng thái `PENDING`/`VERIFIED`/`REJECTED`.
  - Màn hình cho Nhà hảo tâm: Upload biên lai chuyển khoản Napas247 VietQR.
  - Màn hình cho `ORG_ADMIN` & `FAMILY`: Danh sách biên lai chờ duyệt kèm ảnh phóng to, 1-click [Duyệt & Vinh Danh].
- [ ] **6.2. Chứng Nhận Tri Ân Số (Digital Certificate of Appreciation with QR):**
  - Tự động sinh Thẻ Chứng Nhận Tri Ân Số dạng Vector SVG/HTML Canvas trang trọng, có logo Bệnh viện, con dấu số và mã QR xác thực.
  - Trang tra cứu công khai `GET /verify/:certificateQrCode`: Quét mã bằng điện thoại xác minh chứng nhận thật/giả.
- [ ] **6.3. Cây Điều Ước Trực Tuyến (Online Wishlist / Child Wishes):**
  - Tạo bảng `child_wishes`: Quản lý danh mục điều ước hiện vật của bé (Hộp màu, đồ chơi Lego, truyện tranh...).
  - Giao diện Cây Điều Ước tương tác trên trang chi tiết bé.
  - Luồng Nhà hảo tâm nhận tặng: Bấm nút nhận tặng $\rightarrow$ Hiển thị mã tiếp nhận và địa chỉ Phòng CTXH BV $\rightarrow$ Huy hiệu "Đã được trao tặng".
- [ ] **6.4. Bản Đồ Hy Vọng Tương Tác (Interactive Map of Hope - Leaflet.js):**
  - Tích hợp Leaflet.js & OpenStreetMap trên Trang chủ.
  - Ghim các điểm sáng bệnh viện/quỹ trên toàn quốc kèm popup số lượng chiến binh nhí đang nhận điều trị.

---

### Giai đoạn 7: Kiểm Thử Đầu Cuối (E2E), Tối Ưu Hiệu Năng & An Toàn Bảo Mật `[DỰ KIẾN]`
- [ ] **7.1.** Viết kịch bản kiểm thử luồng tích hợp đầu cuối giữa 6 vai trò (`SUPER_ADMIN`, `ORG_ADMIN`, `COORDINATOR`, `FAMILY`, `DONOR`, `GUEST`).
- [ ] **7.2.** Đo tải hiệu năng hệ thống bằng k6/Autocannon (kiểm chứng tải 50-100 req/s, phản hồi < 300ms theo chuẩn NFR).
- [ ] **7.3.** Kiểm tra bảo mật ứng dụng: Chống SQL Injection, XSS, CSRF, cấu hình Helmet và Rate-limiting.
- [ ] **7.4.** Tinh chỉnh giao diện hiển thị tối ưu trên thiết bị di động (Mobile Responsive UI).

---

### Giai đoạn 8: Đóng Gói Báo Cáo Học Thuật, Slide & Kịch Bản Demo 5 Phút `[VỀ ĐÍCH]`
- [ ] **8.1.** Hoàn thiện tài liệu báo cáo kỹ thuật tổng kết toàn diện dự án theo chuẩn môn học BIT208V1.
- [ ] **8.2.** Đóng gói chương Báo cáo: "Kiến trúc sẵn sàng mở rộng cho Ứng dụng Di động Android Kotlin và Webhook Tự động".
- [ ] **8.3.** Xây dựng kịch bản Demo trực tiếp 5 phút (3 trình duyệt phân vai) mượt mà trước hội đồng.
- [ ] **8.4.** Soạn bộ câu hỏi phản biện tiềm năng của Giảng viên & câu trả lời chuẩn mực (Kiến trúc 3-Tier Multi-tenant, Luật Trẻ em 2016, NĐ 93/2021/NĐ-CP, NĐ 13/2023/NĐ-CP).
- [ ] **8.5.** Đóng gói mã nguồn bản phát hành cuối cùng (Release Tag v1.0.0) và bàn giao nghiệm thu.
