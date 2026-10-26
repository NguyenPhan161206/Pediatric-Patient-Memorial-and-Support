# 📖 Tài Liệu Tham Chiếu Backend REST API
### Dự Án: Cổng Ký Ức, Tri Ân & Vinh Danh Các Chiến Binh Nhí (Courageous Little Warriors Memorial & Tribute Hub)
> **Mã môn học:** BIT208V1 - Đồ Án Chuyên Ngành Công Nghệ Thông Tin  
> **Kiến trúc:** 3-Tier Decoupled SSR Architecture (Frontend SSR Handlebars $\leftrightarrow$ Backend REST API $\leftrightarrow$ PostgreSQL 16)  
> **Base URL Nội Bộ (Docker Network):** `http://backend_api:5000/api/v1`  
> **Base URL Ngoại Vi (Host/Client):** `http://localhost:5000/api/v1`  
> **Định dạng dữ liệu:** `application/json` (Giới hạn payload: `10MB` cho ảnh/audio base64)  
> **Chuẩn xác thực:** JWT Bearer Token (`Authorization: Bearer <TOKEN>`)  
> **Ngày cập nhật:** 19/10/2026 (Phiên bản v2.0 - Hoàn thiện 6 Roles, Media Vault & Web Audio)

---

## 📌 Mục Lục

1. [Quy Chuẩn Chung Về Dữ Liệu & Mã Lỗi](#1-quy-chuẩn-chung-về-dữ-liệu--mã-lỗi)
2. [Module 1: Xác Thực & Quản Lý Hồ Sơ Danh Tính (/auth)](#2-module-1-xác-thực--quản-lý-hồ-sơ-danh-tính-auth)
3. [Module 2: Quản Trị Hệ Thống & Cấp Phát Tài Khoản (/admin)](#3-module-2-quản-trị-hệ-thống--cấp-phát-tài-khoản-admin)
4. [Module 3: Hồ Sơ Chiến Binh & Kho Kỷ Niệm Đa Phương Tiện (/warriors)](#4-module-3-hồ-sơ-chiến-binh--kho-kỷ-niệm-đa-phương-tiện-warriors)
5. [Module 4: Thắp Nến, Lời Chúc & Tin Nhắn Thoại Web Audio (/tributes)](#5-module-4-thắp-nến-lời-chúc--tin-nhắn-thoại-web-audio-tributes)
6. [Module 5: Cây Điều Ước Trực Tuyến (/wishes)](#6-module-5-cây-điều-ước-trực-tuyến-wishes)
7. [Module 6: Cơ Sở Y Tế & Quản Trị Bệnh Viện (/organizations)](#7-module-6-cơ-sở-y-tế--quản-trị-bệnh-viện-organizations)
8. [Module 7: Tiếp Sức Viện Phí VietQR & Chứng Nhận Số (/donations)](#8-module-7-tiếp-sức-viện-phí-vietqr--chứng-nhận-số-donations)

---

## 1. Quy Chuẩn Chung Về Dữ Liệu & Mã Lỗi

Tất cả các phản hồi từ Backend REST API đều tuân thủ định dạng JSend Envelope:

### Phản hồi thành công (`status: "success"`):
```json
{
  "status": "success",
  "message": "Thông điệp phản hồi thân thiện với người dùng",
  "data": { ... }
}
```

### Phản hồi lỗi nghiệp vụ (`status: "fail"` - HTTP 400, 401, 403, 404, 409):
```json
{
  "status": "fail",
  "message": "Lý do từ chối yêu cầu (VD: Thiếu trường bắt buộc, không có quyền...)"
}
```

### Phản hồi lỗi máy chủ (`status: "error"` - HTTP 500, 503):
```json
{
  "status": "error",
  "message": "Mô tả lỗi máy chủ hoặc kết nối cơ sở dữ liệu"
}
```

---

## 2. Module 1: Xác Thực & Quản Lý Hồ Sơ Danh Tính (`/auth`)

### 2.1. Đăng nhập hệ thống
* **Endpoint:** `POST /api/v1/auth/login`
* **Quyền truy cập:** Công khai (Public)
* **Body:**
```json
{
  "email": "admin@warrior.org",
  "password": "Password@2026"
}
```
* **Response (`200 OK`):**
```json
{
  "status": "success",
  "message": "Đăng nhập thành công.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "b6c6a9f3-3a6f-42ab-875b-2d6363435475",
      "email": "admin@warrior.org",
      "fullName": "Nguyễn Văn Trị",
      "lastName": "Nguyễn",
      "middleName": "Văn",
      "firstName": "Trị",
      "gender": "MALE",
      "titlePrefix": null,
      "jobTitle": "Quản Trị Viên Vận Hành",
      "department": "Ban Quản Trị Hệ Thống",
      "displayName": "Nguyễn Văn Trị (Quản Trị Viên Vận Hành)",
      "role": "ADMIN"
    }
  }
}
```

---

### 2.2. Đăng ký tài khoản thành viên (Đồng bộ đa thành tố danh tính)
* **Endpoint:** `POST /api/v1/auth/register`
* **Quyền truy cập:** Công khai (Tự động gán role `MEMBER`)
* **Body:**
```json
{
  "email": "supporter_new@gmail.com",
  "password": "Password@2026",
  "last_name": "Trần",
  "middle_name": "Văn",
  "first_name": "An",
  "gender": "MALE",
  "title_prefix": "KTS.",
  "phone_number": "0988776655",
  "display_mode": "FULL_NAME"
}
```
* **Response (`201 Created`):** Trả về Token và thực thể User đã phân tách họ tên, kèm `displayName` đã định dạng theo tiền tố xưng hô.

---

### 2.3. Lấy thông tin tài khoản hiện tại
* **Endpoint:** `GET /api/v1/auth/me`
* **Quyền truy cập:** Người dùng đã đăng nhập (`Authorization: Bearer <TOKEN>`)
* **Response (`200 OK`):**
  * Trả về thông tin chi tiết người dùng, tổ chức trực thuộc (`organization`).
  * Nếu role là `FAMILY`: Tự động trả về danh sách các bé con mình quản lý (`myChildren`).
  * Nếu role là `ORG_ADMIN`: Tự động trả về danh sách bệnh nhi thuộc bệnh viện (`orgChildren`).

---

### 2.4. Cập nhật hồ sơ danh tính cá nhân & Tùy chọn hiển thị
* **Endpoint:** `PATCH /api/v1/auth/profile`
* **Quyền truy cập:** Người dùng đã đăng nhập (`MEMBER`, `FAMILY`, `ORG_ADMIN`, `COORDINATOR`, `ADMIN`)
* **Body:**
```json
{
  "last_name": "Lê",
  "middle_name": "Văn",
  "first_name": "Hải",
  "gender": "MALE",
  "title_prefix": "KTS.",
  "family_relation": "Bố bé Mai Chi",
  "display_mode": "FULL_NAME",
  "phone_number": "0912345678"
}
```
* **Response (`200 OK`):**
```json
{
  "status": "success",
  "message": "Cập nhật thông tin danh tính thành công.",
  "data": {
    "user": {
      "id": "...",
      "displayName": "KTS. Lê Văn Hải (Bố bé Mai Chi)",
      "gender": "MALE",
      "display_mode": "FULL_NAME"
    }
  }
}
```

---

### 2.5. Cấp tài khoản đóng cho Gia đình (Admin-Provisioned Account)
* **Endpoint:** `POST /api/v1/auth/provision-family`
* **Quyền truy cập:** `ADMIN`, `SUPER_ADMIN`, `COORDINATOR`
* **Quy tắc:** Chỉ được cấp sau khi đã đối soát Giấy khai sinh / CCCD của người giám hộ theo Điều 21 & Điều 54 Luật Trẻ em 2016.
* **Body:**
```json
{
  "email": "family.child@gmail.com",
  "password": "Password@2026",
  "last_name": "Nguyễn",
  "first_name": "Hải",
  "gender": "MALE",
  "family_relation": "Bố",
  "child_id": "d0b5f5be-bdbe-46f3-b63f-fa34f1052228"
}
```

---

## 3. Module 2: Quản Trị Hệ Thống & Cấp Phát Tài Khoản (`/admin`)

> **Yêu cầu bảo mật:** Tất cả endpoints trong Module 2 yêu cầu Token có role `ADMIN` hoặc `SUPER_ADMIN`.

### 3.1. Thống kê chỉ số điều hành đa chiều (Dashboard Metrics)
* **Endpoint:** `GET /api/v1/admin/dashboard/metrics`
* **Response (`200 OK`):**
```json
{
  "status": "success",
  "data": {
    "users": {
      "total": 11,
      "byRole": { "ADMIN": 1, "SUPER_ADMIN": 1, "COORDINATOR": 1, "ORG_ADMIN": 3, "FAMILY": 4, "MEMBER": 1 },
      "byGender": { "MALE": 6, "FEMALE": 4, "OTHER": 0, "UNSPECIFIED": 1 }
    },
    "children": {
      "total": 4,
      "byStatus": { "FIGHTER": 1, "URGENT": 1, "RECOVERED": 1, "ANGEL": 1 }
    },
    "finances": {
      "totalAmount": 15500000,
      "totalTransactions": 6
    },
    "pendingQueues": {
      "tributes": 4,
      "donations": 1,
      "wishes": 3
    },
    "hospitalDistribution": [
      { "name": "Bệnh viện Nhi Trung Ương", "code": "BV_NHI_TW", "patient_count": 2, "total_verified_amount": 10500000 }
    ],
    "recentAuditLogs": [ ... ]
  }
}
```

---

### 3.2. Truy vấn danh sách người dùng phân trang & Lọc đa tiêu chí
* **Endpoint:** `GET /api/v1/admin/users`
* **Query Parameters:**
  * `page` (number, mặc định: `1`): Trang hiện tại.
  * `limit` (number, mặc định: `15`): Số bản ghi trên trang.
  * `role` (string): Lọc theo `ADMIN`, `COORDINATOR`, `ORG_ADMIN`, `FAMILY`, `MEMBER`.
  * `org_id` (UUID): Lọc theo bệnh viện trực thuộc.
  * `gender` (string): `MALE`, `FEMALE`, `OTHER`, `UNSPECIFIED`.
  * `is_active` (boolean): `true` (đang hoạt động) hoặc `false` (bị khóa).
  * `q` (string): Từ khóa tìm kiếm họ tên, email hoặc số điện thoại.
* **Response (`200 OK`):** Mảng thực thể người dùng kèm `displayName` đã định dạng và `legalFullName`.

---

### 3.3. Cấp phát tài khoản đa vai trò trung tâm
* **Endpoint:** `POST /api/v1/admin/users`
* **Body:**
```json
{
  "email": "doctor.mai@bvk.vn",
  "password": "Password@2026",
  "role": "ORG_ADMIN",
  "last_name": "Nguyễn",
  "middle_name": "Thị",
  "first_name": "Mai",
  "gender": "FEMALE",
  "title_prefix": "ThS.BS.",
  "job_title": "Trưởng Khoa Nhi Ung Bướu",
  "department": "Khoa Huyết học & Ung bướu",
  "org_id": "70d24c0d-2fe8-44d4-9d11-53697eb3d38b",
  "display_mode": "FULL_NAME"
}
```

---

### 3.4. Khóa hoặc Mở khóa tài khoản người dùng
* **Endpoint:** `PATCH /api/v1/admin/users/:id/status`
* **Body:**
```json
{
  "is_active": false,
  "reason": "Tạm khóa do nghi ngờ thông tin sai lệch theo yêu cầu xác minh"
}
```

---

### 3.5. Reset mật khẩu tài khoản về mặc định
* **Endpoint:** `POST /api/v1/admin/users/:id/reset-password`
* **Quy tắc:** Đặt lại mật khẩu về `Password@2026` và ghi nhận lịch sử kiểm toán bảo mật.

---

## 4. Module 3: Hồ Sơ Chiến Binh & Kho Kỷ Niệm Đa Phương Tiện (`/warriors`)

### 4.1. Lấy danh sách hồ sơ chiến binh nhí (FTS & Phân trang)
* **Endpoint:** `GET /api/v1/warriors`
* **Quyền truy cập:** Công khai
* **Query Parameters:**
  * `page` (number, mặc định: 1), `limit` (number, mặc định: 6).
  * `status`: `FIGHTER`, `URGENT`, `RECOVERED`, `ANGEL`.
  * `category`: ID hoặc slug nhóm bệnh.
  * `hometown`: Tỉnh thành quê quán.
  * `q`: Tìm kiếm toàn văn tiếng Việt có dấu và không dấu qua PostgreSQL Full-Text Search `search_vector`.
* **Quy tắc an toàn:** Tự động lọc `c.is_published = TRUE AND c.deleted_at IS NULL`.

---

### 4.2. Lấy chi tiết hồ sơ bé theo Slug hoặc UUID
* **Endpoint:** `GET /api/v1/warriors/:slugOrId`
* **Quyền truy cập:** Công khai
* **Tính năng hỗ trợ:** Tra cứu linh hoạt bằng cả `slug` (VD: `nguyen-minh-an-bo`) hoặc UUID (VD: `d0b5f5be-bdbe-46f3-b63f-fa34f1052228`).
* **Response (`200 OK`):**
  * `warrior`: Thông tin chi tiết, viện phí, số nến.
  * `gallery`: Mảng kỷ vật đa phương tiện (ảnh, tranh vẽ, video YouTube nhúng, audio).
  * `tributes`: Mảng lời chúc đã duyệt, kèm link audio nếu có.
  * `vietqrUrl`: Link thanh toán VietQR Napas247 động sinh tự động.

---

### 4.3. Thêm kỷ vật / Đa phương tiện vào Kho Kỷ Niệm (Media Vault)
* **Endpoint:** `POST /api/v1/warriors/:id/gallery`
* **Quyền truy cập:** Phụ huynh sở hữu bé (`FAMILY`), `ADMIN`, `COORDINATOR`
* **Body (Hỗ trợ 2 phương thức):**
  1. **Phương thức 1: Nhúng video YouTube:**
  ```json
  {
    "media_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "media_type": "VIDEO",
    "caption": "Khoảnh khắc nụ cười ngày sinh nhật tròn 5 tuổi của con"
  }
  ```
  *(Hệ thống tự động chuyển đổi thành `https://www.youtube.com/embed/dQw4w9WgXcQ` và lấy thumbnail).*

  2. **Phương thức 2: Tải ảnh / âm thanh trực tiếp (Base64):**
  ```json
  {
    "base64Data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    "media_type": "IMAGE",
    "caption": "Bức tranh ngôi nhà hạnh phúc do con tự vẽ tặng bác sĩ"
  }
  ```
* **Response (`201 Created`):** Trả về kỷ vật mới được thêm.

---

### 4.4. Xóa kỷ vật khỏi Kho Kỷ Niệm
* **Endpoint:** `DELETE /api/v1/warriors/:id/gallery/:itemId`
* **Quyền truy cập:** Phụ huynh sở hữu bé (`FAMILY`), `ADMIN`, `COORDINATOR`

---

### 4.5. Quyền Rút / Ẩn Hồ Sơ Khẩn Cấp (Emergency Unpublish - Quyền Được Quên)
* **Endpoint:** `PATCH /api/v1/warriors/:id/unpublish`
* **Quyền truy cập:** Phụ huynh sở hữu bé (`FAMILY`) hoặc `ADMIN`
* **Căn cứ pháp lý:** Căn cứ *Điều 33 Luật Trẻ em 2016* và *Nghị định 13/2023/NĐ-CP*, phụ huynh có quyền rút hồ sơ ngay lập tức mà không cần chờ Admin phê duyệt.
* **Body:**
```json
{
  "reason": "Gia đình yêu cầu bảo mật riêng tư sau khi con hoàn thành phác đồ điều trị"
}
```

---

## 5. Module 4: Thắp Nến, Lời Chúc & Tin Nhắn Thoại Web Audio (`/tributes`)

### 5.1. Thắp một ngọn nến tri ân (Digital Candle)
* **Endpoint:** `POST /api/v1/tributes/:id/candle`
* **Quyền truy cập:** Công khai
* **Cơ chế:** Tăng nguyên tử trong CSDL (`candle_count = candle_count + 1`), trả về số nến mới nhất để cập nhật UI không cần tải lại trang.

---

### 5.2. Gửi lời chúc & Tin nhắn thoại (Web Audio Lullaby)
* **Endpoint:** `POST /api/v1/tributes/:id/tributes`
* **Quyền truy cập:** Công khai
* **Body (Hỗ trợ lời chúc dạng chữ hoặc kèm tệp ghi âm Web Audio):**
```json
{
  "sender_name": "Bố Hải (Lê Văn Hải)",
  "sender_email": "family.minhan@gmail.com",
  "content": "Bố gửi con lời ru và khúc hát con yêu thích nhất",
  "base64Audio": "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQR...",
  "duration_seconds": 45
}
```
* **Xử lý:** Backend tự động giải mã chuỗi Base64, lưu file âm thanh tĩnh định dạng `.webm` vào thư mục `uploads/voice_notes/` và tạo bản ghi trạng thái `PENDING`.

---

### 5.3. Hàng đợi kiểm duyệt lời chúc & Thẩm định âm thanh (Pre-Moderation)
* **Endpoint:** `GET /api/v1/tributes/pending`
* **Quyền truy cập:** `ADMIN`, `COORDINATOR`, `FAMILY` (gia đình chỉ duyệt lời chúc gửi cho con mình)
* **Căn cứ pháp lý:** Đáp ứng quy định tiền kiểm 100% nội dung gửi tới trẻ em theo *Nghị định 147/2024/NĐ-CP*.
* **Dữ liệu trả về:** Danh sách lời chúc kèm trường `audio_url` và `duration_seconds` phục vụ phát thử trên Audio Player tiền kiểm.

---

### 5.4. Phê duyệt hoặc Từ chối lời chúc
* **Endpoint Phê duyệt:** `PATCH /api/v1/tributes/:id/approve` (Chuyển trạng thái sang `APPROVED`)
* **Endpoint Từ chối:** `PATCH /api/v1/tributes/:id/reject` (Chuyển trạng thái sang `REJECTED`)
* **Quyền truy cập:** `ADMIN`, `COORDINATOR`, `FAMILY`

---

## 6. Module 5: Cây Điều Ước Trực Tuyến (`/wishes`)

### 6.1. Lấy danh sách điều ước trên Cây Điều Ước Toàn Quốc
* **Endpoint:** `GET /api/v1/wishes`
* **Query Parameters:** `category` (`TOY`, `BOOK`, `CLOTHES`, `EXPERIENCE`, `OTHER`), `status` (`PENDING`, `PROMISED`, `FULFILLED`).

---

### 6.2. Lấy danh sách điều ước của một bé
* **Endpoint:** `GET /api/v1/wishes/warrior/:slugOrId`
* **Quyền truy cập:** Công khai

---

### 6.3. Đăng ký điều ước mới cho con
* **Endpoint:** `POST /api/v1/wishes`
* **Quyền truy cập:** `FAMILY` (phụ huynh của bé), `ADMIN`, `COORDINATOR`
* **Body:**
```json
{
  "child_id": "d0b5f5be-bdbe-46f3-b63f-fa34f1052228",
  "title": "Hộp bút màu vẽ 36 màu",
  "category": "TOY",
  "estimated_cost": 150000,
  "description": "Con ước có hộp màu để vẽ tranh tặng các cô chú bác sĩ điều trị"
}
```

---

### 6.4. Nhà hảo tâm nhận trao tặng điều ước (Sponsor Wish)
* **Endpoint:** `POST /api/v1/wishes/:id/sponsor`
* **Quyền truy cập:** Công khai
* **Body:**
```json
{
  "sponsor_name": "CLB Thiện Nguyện Ánh Sao",
  "sponsor_phone": "0988665544",
  "sponsor_message": "Cô chú gửi tặng con hộp màu, chúc con luôn vui vẻ và mạnh mẽ nhé!"
}
```
* **Xử lý:** Cập nhật trạng thái điều ước sang `PROMISED` và thông báo tới gia đình bé.

---

### 6.5. Xác nhận điều ước đã được trao đến tay bé
* **Endpoint:** `PATCH /api/v1/wishes/:id/fulfill`
* **Quyền truy cập:** `FAMILY`, `COORDINATOR`, `ADMIN` (Chuyển trạng thái sang `FULFILLED`).

---

## 7. Module 6: Cơ Sở Y Tế & Quản Trị Bệnh Viện (`/organizations`)

### 7.1. Lấy danh sách cơ sở y tế (Bản Đồ Hy Vọng)
* **Endpoint:** `GET /api/v1/organizations`
* **Quyền truy cập:** Công khai
* **Dữ liệu trả về:** Tên bệnh viện, địa chỉ, tọa độ định vị GPS (`lat`, `lng`), hotline CTXH, tài khoản viện phí và tổng số bệnh nhi đang tiếp nhận điều trị.

---

### 7.2. Thống kê Cổng Bệnh Viện & Đội ngũ nhân sự y tế (Hospital Portal)
* **Endpoint:** `GET /api/v1/organizations/portal/stats`
* **Quyền truy cập:** `ORG_ADMIN`, `ADMIN`, `SUPER_ADMIN`
* **Query Parameter:** `org_id` (Dành cho Admin khi chuyển đổi giữa các viện).
* **Response (`200 OK`):**
  * `organization`: Chi tiết cơ sở y tế, phòng CTXH.
  * `stats`: Tổng bệnh nhi điều trị, tổng viện phí đã tiếp sức, số biên lai chờ đối soát.
  * `warriors`: Danh sách bệnh nhi thuộc viện.
  * `recentDonations`: 10 giao dịch ủng hộ gần nhất.
  * `staff`: Danh sách cán bộ y tế khoa phòng (`displayName`, `title_prefix`, `job_title`, `department`, `role`, `email`, `phone_number`).

---

### 7.3. Cập nhật thông tin phòng CTXH & Tài khoản ngân hàng viện phí
* **Endpoint:** `PUT /api/v1/organizations/:id`
* **Quyền truy cập:** `ORG_ADMIN` (thuộc viện), `SUPER_ADMIN`
* **Body:**
```json
{
  "contact_person": "ThS.BS. Nguyễn Thị Mai",
  "phone": "02438255532",
  "email": "ctxh@bvk.org.vn",
  "address": "Số 30 đường Cầu Bươu, Thanh Trì, Hà Nội",
  "bank_name": "Ngân hàng Ngoại Thương Việt Nam (Vietcombank)",
  "bank_code": "VCB",
  "bank_account_number": "0011004455667",
  "bank_account_name": "BENH VIEN K - QUY NGAY MAI TUOI SANG"
}
```

---

## 8. Module 7: Tiếp Sức Viện Phí VietQR & Chứng Nhận Số (`/donations`)

### 8.1. Nộp minh chứng chuyển khoản thật (Submit Proof)
* **Endpoint:** `POST /api/v1/donations/submit-proof`
* **Quyền truy cập:** Công khai (Nhà hảo tâm sau khi quét VietQR chuyển viện phí)
* **Định dạng dữ liệu:** `multipart/form-data` hoặc JSON (`proof_image_url`).
* **Fields:**
  * `child_id` (UUID, bắt buộc).
  * `donor_name` (string, bắt buộc).
  * `amount` (number, bắt buộc, tối thiểu 10.000 VNĐ).
  * `donor_phone`, `donor_email`, `transfer_message`.
  * `is_anonymous` (boolean, tùy chọn ẩn danh trên Bức Tường).
  * `proof_image` (file ảnh JPG/PNG/WEBP $\le$ 5MB).

---

### 8.2. Cổng Ngân Hàng Mô Phỏng Sandbox 1-Click (Demo Dazzler)
* **Endpoint:** `POST /api/v1/donations/mock-sandbox-pay`
* **Quyền truy cập:** Công khai (Phục vụ Hội đồng Giám khảo thử nghiệm toàn trình không mất tiền thật)
* **Body:**
```json
{
  "child_id": "nguyen-minh-an-bo",
  "donor_name": "Hội Đồng Giám Khảo BIT208V1",
  "amount": 500000,
  "message": "Chúc bé luôn kiên cường và sớm bình phục!"
}
```
* **Xử lý:**
  1. Khởi tạo giao dịch trạng thái `VERIFIED`.
  2. Tự động sinh mã chứng nhận số duy nhất (`CLW-2026-XXXX`).
  3. Tạo chữ ký số mật mã `HMAC-SHA256` chống làm giả.
  4. Trả về token QR để xem ngay Chứng Nhận Tri Ân Số trên trang công khai.

---

### 8.3. Lấy Bức Tường Vinh Danh Toàn Quốc (National Wall of Honor)
* **Endpoint:** `GET /api/v1/donations/wall`
* **Quyền truy cập:** Công khai
* **Query Parameters:** `organization_id` (lọc theo bệnh viện), `limit` (mặc định: 20).
* **Response (`200 OK`):** Tổng số tiền đã tiếp sức, số lượt ủng hộ đã đối soát, số bệnh nhi nhận bảo trợ, phân bổ theo bệnh viện và danh sách giao dịch vinh danh.

---

### 8.4. Thẩm định biên lai & Cấp Chứng Nhận Số (Verification)
* **Endpoint:** `PATCH /api/v1/donations/:id/verify`
* **Quyền truy cập:** `ADMIN`, `SUPER_ADMIN`, `ORG_ADMIN`, `FAMILY`
* **Căn cứ pháp lý:** Căn cứ *Nghị định 93/2021/NĐ-CP*, giao dịch sau khi đối soát sao kê ngân hàng sẽ được đóng dấu xác nhận và cấp Chứng Nhận Số kèm mã QR.

---

### 8.5. Tra cứu tính hợp lệ của Chứng Nhận Số qua Mã QR
* **Endpoint:** `GET /api/v1/donations/verify/:qrToken`
* **Quyền truy cập:** Công khai
* **Xử lý:** Kiểm tra chữ ký mật mã `HMAC-SHA256` của token; trả về thông tin nhà hảo tâm, số tiền, ngày giờ đối soát và cơ sở thụ hưởng hợp pháp.

---

## 9. Bảng Tổng Hợp Mã Lỗi HTTP Phổ Biến

| Mã HTTP | Tên chuẩn | Trường hợp kích hoạt trong hệ thống |
| :---: | :--- | :--- |
| `200 OK` | Thành công | Truy vấn dữ liệu hoặc cập nhật bản ghi thành công. |
| `201 Created` | Đã tạo mới | Tạo tài khoản, thêm kỷ vật, tạo điều ước, gửi lời chúc. |
| `400 Bad Request` | Yêu cầu không hợp lệ | Thiếu trường bắt buộc, định dạng email sai, số tiền < 10.000 VNĐ. |
| `401 Unauthorized` | Chưa xác thực | Không truyền JWT token hoặc token hết hạn/không hợp lệ. |
| `403 Forbidden` | Không có quyền | Cố tình can thiệp chéo hồ sơ gia đình khác, truy cập trái quyền hạn role. |
| `404 Not Found` | Không tìm thấy | ID hồ sơ bé, điều ước, kỷ vật hoặc bệnh viện không tồn tại. |
| `409 Conflict` | Xung đột dữ liệu | Email đăng ký đã tồn tại trên hệ thống. |
| `500 Server Error` | Lỗi máy chủ | Lỗi cơ sở dữ liệu hoặc logic xử lý nội bộ. |
