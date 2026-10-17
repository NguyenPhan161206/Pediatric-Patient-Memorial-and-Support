# 📖 Tài Liệu Tham Chiếu Backend REST API
### Dự án: Courageous Little Warriors Memorial & Tribute Hub
**Base URL Nội bộ Docker:** `http://backend_api:5000/api/v1`  
**Base URL Ngoại vi (Host):** `http://localhost:5000/api/v1`  
**Định dạng Dữ liệu:** `application/json`  
**Cơ chế Xác thực:** `Authorization: Bearer <JWT_TOKEN>`  

---

## 1. Phân Hệ Xác Thực & Phân Quyền (Auth & RBAC)

### 1.1. Đăng nhập hệ thống
* **Endpoint:** `POST /auth/login`
* **Quyền truy cập:** Công khai (Public)
* **Body Request:**
```json
{
  "email": "admin@warrior.org",
  "password": "Password@2026"
}
```
* **Response Thành công (`200 OK`):**
```json
{
  "status": "success",
  "message": "Đăng nhập thành công.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "93316ca3-52cd-4967-9660-bf083acbde68",
      "email": "admin@warrior.org",
      "fullName": "Nguyễn Văn Quản Trị",
      "phoneNumber": "0901234567",
      "role": "ADMIN"
    }
  }
}
```

---

### 1.2. Đăng ký tài khoản thành viên
* **Endpoint:** `POST /auth/register`
* **Quyền truy cập:** Công khai (Mặc định tạo role `MEMBER`)
* **Body Request:**
```json
{
  "email": "supporter_new@gmail.com",
  "password": "Password@2026",
  "full_name": "Trần Văn An",
  "phone_number": "0988776655"
}
```

---

### 1.3. Lấy thông tin cá nhân
* **Endpoint:** `GET /auth/me`
* **Quyền truy cập:** Đã đăng nhập (`Bearer Token`)
* **Ghi chú:** Nếu user có role `FAMILY`, hệ thống tự động trả về danh sách các bé con mình quản lý.

---

### 1.4. Cấp tài khoản đóng cho Gia đình (Admin-Provisioned)
* **Endpoint:** `POST /auth/provision-family`
* **Quyền truy cập:** `ADMIN`, `COORDINATOR`
* **Body Request:**
```json
{
  "email": "family.child@gmail.com",
  "password": "Password@2026",
  "full_name": "Nguyễn Văn Phụ Huynh",
  "phone_number": "0911223344",
  "child_id": "28a6d5d9-59d4-4663-999f-004ec02eca54"
}
```

---

## 2. Phân Hệ Hồ Sơ Chiến Binh & Tìm Kiếm FTS (Warriors)

### 2.1. Lấy danh sách hồ sơ (Phân trang, Bộ lọc & FTS)
* **Endpoint:** `GET /warriors`
* **Quyền truy cập:** Công khai (Tự động lọc `deleted_at IS NULL AND is_published = TRUE`)
* **Query Parameters:**
  * `page` (number, default: 1): Số trang hiện tại.
  * `limit` (number, default: 6): Số bản ghi trên mỗi trang.
  * `status` (string): `FIGHTER`, `URGENT`, `RECOVERED`, `ANGEL`.
  * `category` (string|number): Id hoặc slug của danh mục bệnh lý.
  * `hometown` (string): Lọc theo tỉnh thành quê quán.
  * `q` (string): Từ khóa tìm kiếm toàn văn tiếng Việt qua PostgreSQL tsvector.
* **Ví dụ:** `GET /warriors?page=1&limit=6&q=cảnh+sát&status=FIGHTER`

---

### 2.2. Lấy chi tiết hồ sơ bé theo slug
* **Endpoint:** `GET /warriors/:slug`
* **Quyền truy cập:** Công khai
* **Dữ liệu trả về:** Thông tin chi tiết bé, danh mục bệnh, bộ sưu tập tranh vẽ (`gallery`), danh sách lời chúc đã duyệt (`tributes`), và link mã `vietqrUrl`.

---

### 2.3. Rút / Ẩn hồ sơ khẩn cấp (Emergency Unpublish - Quyền được quên)
* **Endpoint:** `PATCH /warriors/:id/unpublish`
* **Quyền truy cập:** `ADMIN` hoặc `FAMILY` (sở hữu bé)
* **Body Request:**
```json
{
  "reason": "Gia đình yêu cầu bảo mật thông tin riêng tư theo Luật Trẻ em 2016"
}
```

---

## 3. Phân Hệ Thắp Nến & Lời Chúc (Tributes & Candle)

### 3.1. Thắp một ngọn nến hy vọng (Digital Candle)
* **Endpoint:** `POST /tributes/:id/candle`
* **Quyền truy cập:** Công khai
* **Xử lý:** Tăng biến đếm nguyên tử `candle_count = candle_count + 1`.

---

### 3.2. Gửi lời tri ân / động viên
* **Endpoint:** `POST /tributes/:id/tributes`
* **Quyền truy cập:** Công khai
* **Body Request:**
```json
{
  "sender_name": "Nguyễn Hoàng",
  "sender_email": "hoang@gmail.com",
  "content": "Chúc con sớm khỏe mạnh để trở về với trường lớp và bạn bè nhé!"
}
```
* **Ghi chú:** Lời nhắn được lưu với trạng thái ban đầu `PENDING`.

---

### 3.3. Duyệt lời chúc công khai
* **Endpoint:** `PATCH /tributes/:id/approve`
* **Quyền truy cập:** `ADMIN`, `COORDINATOR`, `FAMILY` (duyệt lời chúc gửi cho con mình)

---

## 4. Phân Hệ Bảo Trợ & VietQR Napas247 (Sponsorships)

### 4.1. Lấy thông tin mã VietQR
* **Endpoint:** `GET /sponsorships/:childId/vietqr`
* **Quyền truy cập:** Công khai
* **Quy tắc an toàn:** Chỉ trả về mã VietQR khi `bank_verified === true`.

---

### 4.2. Thẩm định tài khoản ngân hàng (KYC Verification)
* **Endpoint:** `PATCH /sponsorships/:childId/verify`
* **Quyền truy cập:** `ADMIN`
* **Body Request:**
```json
{
  "verified": true,
  "note": "Đã đối soát CCCD và giấy viện phí hợp lệ theo Nghị định 93/2021"
}
```
