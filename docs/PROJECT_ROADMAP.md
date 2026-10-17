# Bản Đồ Công Việc & Lộ Trình Toàn Diện Dự Án (Project Roadmap)

> **Dự án:** Cổng Lưu Trữ, Tri Ân & Vinh Danh Các Chiến Binh Nhí (*Courageous Little Warriors Memorial and Tribute Hub*)  
> **Môn học:** BIT208V1 - Dự Án Công Nghệ Thông Tin  
> **Kiến trúc:** 3-Tier Decoupled SSR (Node.js/Express, PostgreSQL, TailwindCSS/Handlebars, Docker)

---

## 📌 Mục Lục Tổng Quan Các Giai Đoạn

- [Giai đoạn 1: Khởi tạo Khung Dự Án & Docker 3 Tầng](#giai-đoạn-1-khởi-tạo-khung-dự-án--docker-3-tầng-đã-hoàn-thành) `[ĐÃ XONG]`
- [Giai đoạn 2: Cơ Sở Dữ Liệu 3NF, Trigger FTS & Dữ Liệu Mẫu](#giai-đoạn-2-cơ-sở-dữ-liệu-3nf-trigger-fts--dữ-liệu-mẫu-đã-hoàn-thành) `[ĐÃ XONG]`
- [Giai đoạn 3: Xây Dựng Lõi Backend REST API & Kịch Bản CI/CD](#giai-đoạn-3-xây-dựng-lõi-backend-rest-api--kịch-bản-cicd-đã-hoàn-thành) `[ĐÃ XONG]`
- [Giai đoạn 4: Hoàn Thiện Giao Diện Người Dùng Frontend SSR](#giai-đoạn-4-hoàn-thiện-giao-diện-người-dùng-frontend-ssr-đã-hoàn-thành) `[ĐÃ XONG]`
- [Giai đoạn 5: Kiểm Thử Đầu Cuối (E2E) & Đo Tải Hiệu Năng](#giai-đoạn-5-kiểm-thử-đầu-cuối-e2e--đo-tải-hiệu-năng-kế-tiếp) `[KẾ TIẾP]`
- [Giai đoạn 6: Tối Ưu Hóa Trải Nghiệm, SEO & An Toàn Bảo Mật](#giai-đoạn-6-tối-ưu-hóa-trải-nghiệm-seo--an-toàn-bảo-mật) `[DỰ KIẾN]`
- [Giai đoạn 7: Đóng Gói Báo Cáo Học Thuật & Kịch Bản Bảo Vệ Đồ Án](#giai-đoạn-7-đóng-gói-báo-cáo-học-thuật--kịch-bản-bảo-vệ-đồ-án-về-đích) `[VỀ ĐÍCH]`

---

## 🚀 Chi Tiết Từng Giai Đoạn & Đầu Việc Tượng Trưng

### Giai đoạn 1: Khởi tạo Khung Dự Án & Docker 3 Tầng `[ĐÃ HOÀN THÀNH]`
- [x] **1.1.** Khởi tạo cấu trúc mã nguồn tách biệt 3 tầng (`backend-api`, `frontend-ssr`, `postgres_db`).
- [x] **1.2.** Viết `docker-compose.yml` tích hợp container Docker, cơ chế Healthcheck và cô lập mạng nội bộ.
- [x] **1.3.** Tích hợp công cụ trực quan quản trị cơ sở dữ liệu pgAdmin 4.
- [x] **1.4.** Viết bộ hồ sơ đặc tả yêu cầu nghiệp vụ (SRS) và kiến trúc hệ thống (SAD).

### Giai đoạn 2: Cơ Sở Dữ Liệu 3NF, Trigger FTS & Dữ Liệu Mẫu `[ĐÃ HOÀN THÀNH]`
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
- [x] **4.2.** Màn hình Đăng nhập & Đăng ký tài khoản (phong cách shadcn/ui Slate/Zinc kèm nút điền mẫu).
- [x] **4.3.** Màn hình Danh mục Chiến binh: Thanh tìm kiếm tiếng Việt FTS, bộ lọc bệnh lý, lưới Card các bé, phân trang.
- [x] **4.4.** Màn hình Chi tiết Bé: Tương tác click Thắp nến trực tiếp, hiển thị ảnh mã VietQR Napas247, góc tranh vẽ và tường lời chúc.
- [x] **4.5.** Cổng Phụ huynh & Gia đình: Cập nhật nhật ký điều trị và nút đỏ Rút hồ sơ khẩn cấp (Emergency Unpublish).
- [x] **4.6.** Bảng Quản trị Tiền kiểm duyệt Lời chúc: Phê duyệt hoặc từ chối tin nhắn gửi tới trẻ em.

### Giai đoạn 5: Kiểm Thử Đầu Cuối (E2E) & Đo Tải Hiệu Năng `[KẾ TIẾP]`
- [ ] **5.1.** Viết kịch bản kiểm thử luồng tích hợp đầu cuối (Tạo bé -> Thắp nến -> Quét QR -> Gửi lời chúc -> Duyệt -> Rút hồ sơ).
- [ ] **5.2.** Đo tải hiệu năng hệ thống bằng công cụ k6/Autocannon (kiểm chứng tải 50-100 req/s, phản hồi < 300ms theo chuẩn NFR).
- [ ] **5.3.** Đo kiểm độ ổn định khi nhiều người cùng thắp nến đồng thời (Race Condition & Atomic Counter).
- [ ] **5.4.** Đóng gói báo cáo kết quả kiểm thử tải có biểu đồ minh họa.

### Giai đoạn 6: Tối Ưu Hóa Trải Nghiệm, SEO & An Toàn Bảo Mật `[DỰ KIẾN]`
- [ ] **6.1.** Tích hợp thẻ chia sẻ mạng xã hội OpenGraph / Facebook / Zalo dynamic cho từng câu chuyện của bé.
- [ ] **6.2.** Tối ưu bộ nhớ đệm (Caching) cho danh sách chiến binh nhí và danh mục bệnh lý.
- [ ] **6.3.** Kiểm tra bảo mật ứng dụng web: Rà soát chống SQL Injection, XSS, CSRF, cấu hình Helmet và Rate-limiting.
- [ ] **6.4.** Tinh chỉnh giao diện hiển thị tối ưu trên thiết bị di động (Mobile Responsive UI).

### Giai đoạn 7: Đóng Gói Báo Cáo Học Thuật & Kịch Bản Bảo Vệ Đồ Án `[VỀ ĐÍCH]`
- [ ] **7.1.** Hoàn thiện tài liệu báo cáo kỹ thuật tổng kết toàn diện dự án theo chuẩn môn học BIT208V1.
- [ ] **7.2.** Xây dựng kịch bản Demo trực tiếp (Live Demonstration Walkthrough) 5 phút mượt mà trước hội đồng.
- [ ] **7.3.** Soạn bộ câu hỏi phản biện tiềm năng của Giảng viên & câu trả lời chuẩn mực (Kiến trúc 3-Tier, Luật Trẻ em, VietQR Zero-touch, Bảo mật).
- [ ] **7.4.** Đóng gói mã nguồn bản phát hành cuối cùng (Release Tag v1.0.0) và bàn giao nghiệm thu.
