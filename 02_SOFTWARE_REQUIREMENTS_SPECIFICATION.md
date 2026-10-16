# PHẦN 2: ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS - SOFTWARE REQUIREMENTS SPECIFICATION)

---

## 2.1. Yêu cầu Chức năng (Functional Requirements - FR)

### Module 1: Quản trị Tài khoản, Xác thực & Phân quyền (Auth & 5-Tier RBAC)

* **FR-1.1 (Đăng ký tài khoản Thành viên)**: 
  * Cho phép người dùng đại chúng đăng ký tài khoản `MEMBER` qua email, họ tên, số điện thoại, mật khẩu.
  * Mật khẩu được băm an toàn qua thư viện `bcrypt` với `saltRounds = 10`. Form đăng ký công khai **tuyệt đối không cho phép tự chọn** vai trò `COORDINATOR`, `FAMILY` hoặc `ADMIN`.
* **FR-1.2 (Đăng nhập & Quản lý Phiên làm việc Bền vững)**: 
  * Hỗ trợ xác thực qua email và mật khẩu.
  * Duy trì phiên làm việc bằng cơ chế **Centralized Session** lưu trữ trực tiếp trong PostgreSQL thông qua `connect-pg-simple`, bảo đảm cookie phiên an toàn (`httpOnly: true`, `sameSite: 'lax'`, `secure: false` ở dev / `true` ở prod).
* **FR-1.3 (Hệ thống Phân quyền Truy cập 5 Cấp - 5-Tier RBAC)**:
  * `Guest` (Khách vãng lai): Xem danh sách, đọc chi tiết câu chuyện, tìm kiếm FTS, thắp nến, gửi lời nhắn tri ân (chờ duyệt).
  * `Member` (Thành viên cộng đồng): Lưu bookmark hồ sơ quan tâm, quản lý lời nhắn cá nhân, đăng ký bảo trợ hiện vật.
  * `Coordinator` (Tình nguyện viên / Điều phối viên): Được Admin phê duyệt/cấp quyền; hỗ trợ phỏng vấn, tạo hồ sơ ban đầu, chụp ảnh, cập nhật tin tức điều trị tại bệnh viện.
  * `Family` (Hộ Gia Đình / Cha Mẹ Bệnh Nhi):
    * **Tài khoản đóng (Admin-Provisioned)**: Chỉ do Super Admin hoặc Coordinator khởi tạo sau khi đối soát ngoài đời thực tại bệnh viện qua CCCD và Giấy khai sinh của bé.
    * **Quyền hạn độc quyền sở hữu**: Toàn quyền cập nhật hồ sơ, nhật ký điều trị, tải tranh vẽ của con mình (`child_id` liên kết).
    * **Quyền Tối thượng Rút hồ sơ (Emergency Unpublish / Right to Withdraw Consent)**: Theo Luật Trẻ em 2016 và Nghị định 13/2023/NĐ-CP, gia đình có quyền bấm nút **"Dừng công khai / Ẩn hồ sơ con"** bất cứ lúc nào. Hệ thống lập tức ẩn hồ sơ khỏi trang chủ và tìm kiếm mà **không cần chờ Admin duyệt**.
  * `Super Admin` (Quản trị viên Hệ thống): Toàn quyền quản trị tài khoản, cấp phát tài khoản `FAMILY`, kiểm duyệt nội dung/lời nhắn, thẩm định thông tin ngân hàng bảo trợ, xem toàn bộ Audit Logs hệ thống.
* **FR-1.4 (Quy trình Cấp tài khoản Gia đình An toàn - Provisioning Workflow)**:
  * Admin/Coordinator nhập thông tin cha mẹ khi tạo hồ sơ bé -> Hệ thống tự động sinh tài khoản `FAMILY`, liên kết `family_user_id` vào hồ sơ bé và gửi thông tin đăng nhập/link kích hoạt an toàn.

---

### Module 2: Hồ sơ Ký ức & Danh mục Tri ân (Profile & Catalog)

* **FR-2.1 (Phân loại hồ sơ trạng thái)**: 
  * `FIGHTER`: Chiến binh kiên cường (đang trong phác đồ điều trị).
  * `ANGEL`: Thiên thần nhỏ đã khuất (không gian tưởng niệm trang trọng).
  * `URGENT`: Hoàn cảnh cần bảo trợ khẩn cấp (kêu gọi viện phí/máu hiếm).
  * `RECOVERED`: Chiến thắng bệnh tật (truyền cảm hứng và hy vọng).
* **FR-2.2 (Trang danh sách & Server-side Pagination)**: 
  * Hiển thị danh sách card hồ sơ thiết kế Responsive (Grid/Flexbox).
  * Triển khai **Server-side Pagination** bằng truy vấn `LIMIT` và `OFFSET` trong PostgreSQL; bảo lưu toàn bộ query string (`keyword`, `category`, `status`, `page`) khi chuyển trang.
* **FR-2.3 (Bộ lọc đa chiều)**: Hỗ trợ lọc đồng thời theo Tỉnh/Thành quê quán, nhóm bệnh lý (Ung thư máu, U não, Thận...), độ tuổi và trạng thái bảo trợ.
* **FR-2.4 (Quyền được quên & Rút lại sự đồng ý - Soft Delete)**:
  * Khi cha mẹ bấm "Ẩn hồ sơ" hoặc khi hồ sơ cần gỡ bỏ theo yêu cầu pháp lý, hệ thống thực hiện Soft-delete (`deleted_at = NOW()` và `is_published = FALSE`).
  * Hồ sơ ngay lập tức biến mất khỏi trang public và Full-Text Search, nhưng giữ nguyên toàn vẹn dữ liệu quan hệ trong CSDL để phục vụ kiểm toán và không gây lỗi foreign key.
* **FR-2.5 (Thẻ Chia sẻ Mạng Xã hội Động - OpenGraph Meta Tags)**:
  * Tầng Frontend SSR tự động render các thẻ `<meta property="og:title">`, `<meta property="og:image">`, `<meta property="og:description">` theo dữ liệu riêng của từng bé, giúp hiển thị card preview đẹp mắt khi chia sẻ lên Zalo/Facebook.

---

### Module 3: Quản lý Nội dung Ký ức & Đa phương tiện (CMS & Media Upload)

* **FR-3.1 (Biên tập bài viết giàu nội dung)**: 
  * Tích hợp **WYSIWYG Editor** (TinyMCE/CKEditor) cho phép Coordinator và Family nhập nhật ký điều trị, thông điệp ước mơ, định dạng dòng thời gian, chèn trích dẫn và liên kết video.
* **FR-3.2 (Pipeline tải tệp đa phương tiện - File Upload)**:
  * Sử dụng `multer` xử lý **Multipart Form** tải ảnh đại diện, ảnh sinh hoạt, kỷ vật, tranh vẽ của các bé.
  * Whitelist MIME-types an toàn: `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`.
  * Giới hạn kích thước tối đa 5MB/file; mã hóa tên file bằng UUID/timestamp chống trùng lặp và tấn công ghi đè file.
* **FR-3.3 (Đính kèm Minh chứng Giám hộ & Cam kết Pháp lý - Guardianship Verification)**:
  * Khi tạo hồ sơ bé, bắt buộc phải tải lên tệp minh chứng tư cách người giám hộ (Ảnh Giấy khai sinh hoặc Quyết định cử người giám hộ).
  * Checkbox cam kết pháp lý bắt buộc: *"Tôi xác nhận đã có sự đồng ý của cha mẹ và trẻ em (nếu từ 7 tuổi trở lên) theo đúng Luật Trẻ em 2016 và Nghị định 13/2023/NĐ-CP"*.
  * Hệ thống lưu trữ: User ID thực hiện, Địa chỉ IP, và Timestamp đồng ý vào bảng `guardianship_consents`.

---

### Module 4: Tìm kiếm Toàn văn (Full-Text Search Engine)

* **FR-4.1 (PostgreSQL FTS)**: 
  * Sử dụng cột `search_vector` (`tsvector`) và chỉ mục `GIN` để tìm kiếm dữ liệu song ngữ Việt/Anh trên các trường: Tên bé, Biệt danh, Quê quán, Ước mơ, Nội dung câu chuyện.
* **FR-4.2 (Tìm kiếm ngữ nghĩa & Toán tử logic)**: 
  * Hỗ trợ truy vấn cụm từ kết hợp toán tử logic (`&`, `|`, `!`), tìm kiếm theo tiền tố ký tự (Prefix Matching).
  * **Quy tắc lọc an toàn**: Câu truy vấn FTS luôn tự động kèm điều kiện `WHERE deleted_at IS NULL AND is_published = TRUE` để không làm lộ các hồ sơ đã ẩn.

---

### Module 5: Tương tác Tưởng niệm & Quy trình Kiểm duyệt (Tribute & Moderation)

* **FR-5.1 (Thắp nến hy vọng - Digital Candle)**: 
  * Cho phép người dùng bấm "Thắp một ngọn nến / Gửi một bông hoa"; bộ đếm tăng tức thời và lưu trữ giao dịch.
  * Tích hợp cơ chế Rate-limit theo Session/IP (tối đa 1 lượt thắp nến / 5 phút trên một hồ sơ từ cùng một client) để chống spam bot.
* **FR-5.2 (Gửi lời tri ân / Lời động viên)**: Người dùng nhập nội dung chia sẻ, đính kèm tên và email.
* **FR-5.3 (Workflow Tiền kiểm Nghiêm ngặt - Moderation State Machine)**:

$$\text{Lời nhắn gửi lên} \longrightarrow \text{Trạng thái PENDING} \longrightarrow \text{Admin/Family Duyệt (APPROVED)} \longrightarrow \text{Hiển thị Public}$$

*(Tuyệt đối ngăn chặn lời nhắn chưa duyệt xuất hiện trên giao diện công khai theo quy định của Nghị định 147/2024/NĐ-CP về an toàn thông tin mạng)*.

---

### Module 6: Quản trị Hệ thống, Giám sát & Nhật ký (Dashboard, Health & Audit Logs)

* **FR-6.1 (Báo cáo tổng hợp)**: Biểu đồ/thống kê số lượng hồ sơ theo trạng thái, số lượt thắp nến trong tháng, số lời nhắn chờ kiểm duyệt, số hồ sơ đã xác thực tài khoản ngân hàng.
* **FR-6.2 (Nhật ký Kiểm toán Toàn vẹn - Audit Logs)**: 
  * Ghi log tự động mọi hành động can thiệp dữ liệu nhạy cảm: Ai duyệt hồ sơ, ai đổi trạng thái xuất bản, ai duyệt lời chúc, ai duyệt thông tin tài khoản ngân hàng, thời gian và địa chỉ IP.
* **FR-6.3 (Điểm Kiểm tra Sức khỏe Hệ thống - Health Check API)**:
  * Cung cấp endpoint `GET /api/v1/health` trả về trạng thái sống còn của ứng dụng và tình trạng kết nối tới Database PostgreSQL (phục vụ giám sát tự động của Docker Compose).

---

### Module 7: Bảo trợ Trực tiếp & Sinh Mã VietQR Minh Bạch (Theo Nghị định 93/2021/NĐ-CP)

* **FR-7.1 (Khai báo Tài khoản Thụ hưởng Hợp pháp)**:
  * Cho phép khai báo thông tin nhận bảo trợ theo 2 phân loại hợp pháp:
    * `HOSPITAL`: Tài khoản Bệnh viện / Phòng Công tác Xã hội (kèm Mã số bệnh nhân viện phí của bé).
    * `FAMILY_GUARDIAN`: Tài khoản chính chủ của Cha/Mẹ ruột (tên chủ tài khoản phải khớp 100% với CCCD/Giấy khai sinh đã thẩm định).
* **FR-7.2 (Tự động Sinh Mã VietQR Napas247 Chuẩn Quốc Gia)**:
  * Hệ thống tự động dựng liên kết mã QR chuyển khoản động chuẩn định dạng Napas247:
    `https://img.vietqr.io/image/<BANK_CODE>-<ACCOUNT_NO>-compact2.png?amount=0&addInfo=ChienBinhNhi <SLUG>&accountName=<NAME>`
  * Giúp nhà hảo tâm quét mã tiện lợi trên mọi ứng dụng ngân hàng di động, tự động điền đúng tên người thụ hưởng và cú pháp hỗ trợ.
* **FR-7.3 (Quy trình Thẩm định Tài khoản - Bank KYC Workflow)**:
  * Hồ sơ khi tạo mới có cờ `bank_verified = FALSE` (Mã QR và Số tài khoản bị ẩn hoàn toàn).
  * Chỉ khi Super Admin kiểm tra chứng từ viện phí hoặc CCCD trùng khớp, kích hoạt `bank_verified = TRUE`, mã QR và huy hiệu *"Tài khoản đã Thẩm định Chính chủ"* mới được xuất hiện công khai.
* **FR-7.4 (Tuyên ngôn Miễn trừ Pháp lý - Zero-touch Cashflow Disclaimer)**:
  * Dưới khung hiển thị mã VietQR luôn có thông báo pháp lý bắt buộc:
    *"Hệ thống hoạt động phi lợi nhuận theo Nghị định 93/2021/NĐ-CP, kết nối trực tiếp nhà hảo tâm và người thụ hưởng. Nền tảng không thu phí và không tham gia nhận/giữ tiền từ thiện trung gian."*

---

## 2.2. Yêu cầu Phi chức năng (Non-Functional Requirements - NFR)

* **NFR-1 (Bảo mật Toàn diện - Security)**:
  * Chống **SQL Injection**: 100% thao tác CSDL dùng Parameterized Queries thông qua Knex.js Query Builder.
  * Chống **XSS (Cross-Site Scripting)**: Lọc sạch toàn bộ mã HTML sinh ra từ WYSIWYG Editor bằng thư viện `sanitize-html`/`DOMPurify` ở tầng Backend trước khi lưu CSDL.
  * Chống **CSRF (Cross-Site Request Forgery)**: Mọi form POST/PUT từ Frontend SSR phải có CSRF Token hợp lệ.
  * Thiết lập HTTP Security Headers bằng thư viện `helmet` (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
  * Quản lý Phiên làm việc Tập trung: Lưu trữ session trong PostgreSQL (`connect-pg-simple`), không phụ thuộc bộ nhớ tạm RAM của server.
  * Chống Tấn công Dò quét (Anti-Brute Force): Sử dụng `express-rate-limit` giới hạn tối đa 5 lần đăng nhập sai liên tiếp trong 15 phút trên mỗi địa chỉ IP.

* **NFR-2 (Hiệu năng & Khả năng Chịu tải - Performance)**:
  * Thời gian phản hồi trang SSR (First Byte to Complete HTML) < 300ms trong điều kiện mạng thông thường.
  * Cấu hình Connection Pool cho PostgreSQL trong Knex (min: 2, max: 10 connections).
  * Đo tải hiệu năng hệ thống chịu được tối thiểu 50-100 requests/giây đồng thời bằng k6/Autocannon mà tỷ lệ lỗi < 1%.

* **NFR-3 (Triển khai, Vận hành & Phục hồi - Deployment & Reliability)**:
  * Hệ thống đóng gói và khởi chạy chỉ bằng một câu lệnh: `docker compose up --build`.
  * Cơ chế Giám sát Sức khỏe: Các container Backend và Frontend tích hợp `healthcheck` điều kiện để đảm bảo khởi động theo đúng trình tự sẵn sàng của CSDL PostgreSQL.
  * Tách biệt toàn bộ biến nhạy cảm (DB password, session secret, internal API token) ra file `.env`.
