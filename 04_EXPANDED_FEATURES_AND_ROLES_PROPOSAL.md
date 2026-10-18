# Đề Xuất Nâng Cấp Hệ Thống: Không Gian Làm Việc Đa Đơn Vị (Multi-Tenant Workspace), Phân Quyền 6 Cấp & Danh Mục Tính Năng Đột Phá

> **Mã tài liệu:** `04_EXPANDED_FEATURES_AND_ROLES_PROPOSAL.md`  
> **Dự án:** Cổng Lưu Trữ, Tri Ân & Vinh Danh Các Chiến Binh Nhí (*Courageous Little Warriors Memorial & Tribute Hub*)  
> **Môn học:** BIT208V1 - Dự Án Công Nghệ Thông Tin  
> **Định hướng chiến lược:** Chuyển đổi từ mô hình Đơn đơn vị (Single-Tenant) thành **Nền Tảng Liên Viện Cấp Quốc Gia (National Federated Multi-Tenant Platform)** kết nối các Bệnh viện Nhi, Quỹ Thiện nguyện và Nhà hảo tâm.

---

## 📌 Mục Lục Nội Dung

1. [Bối Cảnh & Sự Cần Thiết Của Vai Trò Admin Đơn Vị (`ORG_ADMIN`)](#1-bối-cảnh--sự-cần-thiết-của-vai-trò-admin-đơn-vị-org_admin)
2. [Hệ Thống Phân Quyền 6 Cấp Chuẩn Hóa (6-Tier Hierarchical RBAC)](#2-hệ-thống-phân-quyền-6-cấp-chuẩn-hóa-6-tier-hierarchical-rbac)
3. [Bảng Ma Trận Phân Chia Chức Năng Theo Vai Trò (Role-Feature Matrix)](#3-bảng-ma-trận-phân-chia-chức-năng-theo-vai-trò-role-feature-matrix)
4. [Chi Tiết Các Tính Năng Đề Xuất Theo Từng Vai Trò](#4-chi-tiết-các-tính-năng-đề-xuất-theo-từng-vai-trò)
5. [Thiết Kế Cơ Sở Dữ Liệu Mở Rộng (Schema Evolution & ERD)](#5-thiết-kế-cơ-sở-dữ-liệu-mở-rộng-schema-evolution--erd)
6. [Lộ Trình Triển Khai Kỹ Thuật (Phased Implementation Roadmap)](#6-lộ-trình-triển-khai-kỹ-thuật-phased-implementation-roadmap)

---

## 1. Bối Cảnh & Sự Cần Thiết Của Vai Trò Admin Đơn Vị (`ORG_ADMIN`)

### 1.1. Khoảng trống quản lý hiện tại (The Management Gap)
Trong kiến trúc ban đầu của dự án, hệ thống mới chỉ có 2 vai trò quản trị/vận hành:
* **`ADMIN` (Quản trị viên tối cao):** Có toàn quyền can thiệp vào máy chủ kỹ thuật, xem toàn bộ dữ liệu, sửa đổi CSDL.
* **`COORDINATOR` (Điều phối viên hiện trường):** Tình nguyện viên hoặc bác sĩ nhập liệu (chỉ viết bài, tải ảnh tranh vẽ của bé).

### 1.2. Mâu thuẫn trong môi trường y tế & xã hội thực tế
Trong thực tế, các đơn vị tham gia nền tảng (Bệnh viện Nhi Trung Ương, Bệnh viện K Tân Triều, Bệnh viện Nhi Đồng 1, Bệnh viện Trung ương Huế, Quỹ Trò Nghèo Vùng Cao, CLB Nụ Cười Em...) là các **pháp nhân độc lập**:
* **Trưởng phòng Công tác Xã hội (CTXH) của Bệnh viện Nhi TW** không thể được cấp quyền `ADMIN` tối cao (vì họ không được phép xem hồ sơ nội bộ của BV K Tân Triều, cũng không được can thiệp vào cấu hình server hạ tầng).
* Nhưng họ **cũng không thể chỉ mang vai trò `COORDINATOR`** (vì họ là lãnh đạo cấp viện: cần quản lý danh sách các tình nguyện viên của viện mình, quản lý số tài khoản viện phí chính thức của bệnh viện, đối soát biến động số dư viện phí và duyệt cấp tài khoản đóng cho phụ huynh sau khi kiểm tra CCCD).

### 1.3. Kết luận kiến trúc
> Việc bổ sung vai trò **`ORG_ADMIN` (Admin Đơn vị / Bệnh viện / Quỹ)** là mắt xích bắt buộc để giải quyết trọn vẹn bài toán **Phân vùng dữ liệu đa tổ chức (Multi-Tenant Data Partitioning)**, đáp ứng các tiêu chuẩn bảo mật dữ liệu y tế và quy định pháp lý tại Việt Nam.

---

## 2. Hệ Thống Phân Quyền 6 Cấp Chuẩn Hóa (6-Tier Hierarchical RBAC)

```mermaid
graph TD
    classDef super fill:#fee2e2,stroke:#ef4444,stroke-width:2px;
    classDef org fill:#fef3c7,stroke:#f59e0b,stroke-width:2px;
    classDef staff fill:#e0e7ff,stroke:#6366f1,stroke-width:2px;
    classDef user fill:#f0fdf4,stroke:#22c55e,stroke-width:2px;

    SuperAdmin["👑 1. SUPER_ADMIN<br/>(Chủ quản nền tảng / Quản trị tối cao)"]:::super
    OrgAdmin["🏥 2. ORG_ADMIN (MỚI)<br/>(Trưởng phòng CTXH BV Nhi TW, BV K, Quỹ...)"]:::org
    Coordinator["🩺 3. COORDINATOR<br/>(Điều phối viên / Tình nguyện viên theo viện)"]:::staff
    Family["👨‍👩‍👧 4. FAMILY<br/>(Phụ huynh bệnh nhi - Quyền rút hồ sơ con mình)"]:::user
    Donor["🤝 5. MEMBER / DONOR<br/>(Nhà hảo tâm / Thành viên cộng đồng)"]:::user
    Guest["🌐 6. GUEST<br/>(Người dùng vãng lai chưa đăng nhập)"]:::user

    SuperAdmin -->|Cấp phép viện & Giám sát toàn quốc| OrgAdmin
    OrgAdmin -->|Phân công việc & Giám sát viện| Coordinator
    Coordinator -->|Hỗ trợ hồ sơ & Nhật ký| Family
    Donor -->|Ủng hộ VietQR, Gửi minh chứng & Thắp nến| Family
    Guest -->|Xem hồ sơ, Thắp nến hy vọng| Family
```

### Bảng phân cấp quyền hạn chi tiết:

| Cấp | Vai trò (Role) | Đại diện thực tế | Phạm vi dữ liệu (Scope) | Thẩm quyền cốt lõi |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **`SUPER_ADMIN`** | Ban điều hành Nền tảng Quốc gia | Toàn bộ hệ thống (Global) | Phê duyệt cấp phép Bệnh viện/Quỹ mới; Quản trị máy chủ; Giám sát toàn bộ Audit Trail; Khóa tài khoản vi phạm. |
| **2** | **`ORG_ADMIN`** *(Mới)* | Trưởng phòng CTXH Viện, Giám đốc Quỹ | Đơn vị mình phụ trách (Tenant) | Quản lý đội ngũ Coordinator của viện; Duyệt xuất bản hồ sơ bé; Cấu hình tài khoản ngân hàng viện phí; Đối soát & duyệt vinh danh biên lai quyên góp; Cấp tài khoản FAMILY. |
| **3** | **`COORDINATOR`** | Điều phối viên, Bác sĩ điều trị | Ca bệnh được giao trong viện | Soạn thảo câu chuyện bé; Tải tranh vẽ kỷ vật; Tiền kiểm duyệt lời chúc cộng đồng; Hỗ trợ gia đình cập nhật nhật ký. |
| **4** | **`FAMILY`** | Cha mẹ / Người giám hộ hợp pháp | Chỉ duy nhất con của mình | Cập nhật nhật ký điều trị; Xác nhận đã nhận viện phí; Thực thi **Quyền rút hồ sơ khẩn cấp (Emergency Unpublish)** tức thời theo Luật Trẻ em 2016. |
| **5** | **`MEMBER / DONOR`** | Nhà hảo tâm, Tình nguyện viên | Tài khoản cá nhân | Quét mã VietQR chuyển viện phí; Gửi ảnh biên lai đối soát vinh danh; Nhận tặng quà qua Wishlist; Tải Chứng nhận tri ân điện tử; Gửi Voice Note. |
| **6** | **`GUEST`** | Cộng đồng xã hội | Chỉ đọc (Read-only) | Tìm kiếm FTS tiếng Việt; Xem câu chuyện bé; Xem Bản Đồ Hy Vọng; Xem Bảng Vàng vinh danh; Thắp nến hy vọng; Quét mã VietQR chuyển khoản trực tiếp. |

---

## 3. Bảng Ma Trận Phân Chia Chức Năng Theo Vai Trò (Role-Feature Matrix)

> Ký hiệu:  
> ✅ = Chức năng hiện đã có trong mã nguồn (Đã hoàn thành ở Giai đoạn 1–4).  
> ✨ = Chức năng mới đề xuất nâng cấp.  
> ❌ = Không có quyền truy cập.

| STT | Tên chức năng / Phân hệ | 1. GUEST | 2. DONOR | 3. FAMILY | 4. COORD | 5. ORG_ADMIN | 6. SUPER_ADMIN |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **I** | **TRA CỨU & TƯƠNG TÁC CÔNG KHAI** | | | | | | |
| 1 | Xem danh sách bé & Lọc đa chiều | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | Tìm kiếm toàn văn tiếng Việt FTS (`tsvector`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | Xem chi tiết hồ sơ & Tranh vẽ kỷ vật | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | Thắp nến hy vọng (Live Atomic Counter) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | Gửi lời chúc tri ân (Pre-moderation) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | Bản đồ hy vọng tương tác 63 tỉnh thành | ✨ | ✨ | ✨ | ✨ | ✨ | ✨ |
| 7 | Xem Bảng Vàng Vinh Danh Tấm Lòng Vàng | ✨ | ✨ | ✨ | ✨ | ✨ | ✨ |
| **II** | **BẢO TRỢ & VINH DANH NHÀ HẢO TÂM** | | | | | | |
| 8 | Quét mã VietQR Napas247 viện phí trực tiếp | ✅ | ✅ | - | - | - | - |
| 9 | Gửi ảnh minh chứng biên lai chuyển khoản | ❌ | ✨ | - | - | - | - |
| 10 | Tùy chọn vinh danh: Công khai vs Ẩn danh | ❌ | ✨ | - | - | - | - |
| 11 | Nhận Giấy Chứng Nhận Tri Ân Số (Mã QR tra cứu)| ❌ | ✨ | - | - | - | - |
| 12 | Nhận tặng quà theo Cây Ước Nguyện của bé | ❌ | ✨ | - | - | - | - |
| 13 | Thu âm lời chúc âm thanh (Voice Notes 30s) | ❌ | ✨ | - | - | - | - |
| 14 | Sổ tay thiện nguyện cá nhân (Lịch sử ủng hộ) | ❌ | ✨ | - | - | - | - |
| **III**| **CỔNG HỘ GIA ĐÌNH BỆNH NHI** | | | | | | |
| 15 | Xem hồ sơ con mình quản lý | ❌ | ❌ | ✅ | ❌ | ✅ *(Viện mình)*| ✅ *(Toàn quốc)*|
| 16 | Cập nhật nhật ký điều trị & ước mơ bé | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 17 | **Rút hồ sơ khẩn cấp (Emergency Unpublish)**| ❌ | ❌ | ✅ *(Không cần duyệt)* | ❌ | ✅ *(Theo yêu cầu)* | ✅ |
| 18 | Xác nhận đã nhận được viện phí từ nhà hảo tâm| ❌ | ❌ | ✨ | ✨ | ✨ | ✅ |
| 19 | Sổ theo dõi tiến độ viện phí & sao kê (NĐ 93) | ❌ | ❌ | ✨ | ✨ | ✨ | ✅ |
| 20 | Gửi thư cảm ơn trực tiếp đến nhà hảo tâm | ❌ | ❌ | ✨ | ❌ | ❌ | ❌ |
| **IV** | **VẬN HÀNH & ĐIỀU PHỐI VIÊN** | | | | | | |
| 21 | Soạn thảo hồ sơ bệnh nhi mới (Bản nháp) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 22 | Tải lên tranh vẽ & kỷ vật của bé | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 23 | Tiền kiểm duyệt Lời chúc tri ân | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 24 | Hỗ trợ phụ huynh đối soát chứng từ viện phí | ❌ | ❌ | ❌ | ✨ | ✨ | ❌ |
| **V**  | **QUẢN TRỊ ĐƠN VỊ / BỆNH VIỆN (MỚI)** | | | | | | |
| 25 | Bảng điều khiển Workspace riêng của Đơn vị | ❌ | ❌ | ❌ | ❌ | ✨ | ✅ |
| 26 | Quản lý danh sách Điều phối viên thuộc viện | ❌ | ❌ | ❌ | ❌ | ✨ | ❌ |
| 27 | Cấu hình thông tin & STK Viện phí của Đơn vị | ❌ | ❌ | ❌ | ❌ | ✨ | ✅ |
| 28 | Duyệt & Xuất bản hồ sơ bệnh nhi ra công chúng| ❌ | ❌ | ❌ | ❌ | ✨ | ✅ |
| 29 | Cấp tài khoản đóng `FAMILY` sau đối soát CCCD| ❌ | ❌ | ❌ | ❌ | ✨ | ✅ |
| 30 | Phê duyệt biên lai ủng hộ để đưa lên Bảng Vàng| ❌ | ❌ | ❌ | ❌ | ✨ | ✅ |
| 31 | Xuất báo cáo tài chính viện phí đơn vị (Excel)| ❌ | ❌ | ❌ | ❌ | ✨ | ✅ |
| **VI** | **QUẢN TRỊ TỐI CAO TOÀN SÀN** | | | | | | |
| 32 | Tiếp nhận & Cấp phép Đơn vị / Bệnh viện mới | ❌ | ❌ | ❌ | ❌ | ❌ | ✨ |
| 33 | Khóa / Tạm dừng hoạt động đơn vị vi phạm | ❌ | ❌ | ❌ | ❌ | ❌ | ✨ |
| 34 | Bảng thống kê vĩ mô bệnh nhi & dòng tiền toàn quốc| ❌ | ❌ | ❌ | ❌ | ❌ | ✨ |
| 35 | Giám sát toàn bộ Nhật ký kiểm toán (Audit Logs) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 36 | Cấu hình máy chủ kỹ thuật & Backup CSDL | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 4. Chi Tiết Các Tính Năng Đề Xuất Theo Từng Vai Trò

### 4.1. Dành cho `ORG_ADMIN` (Admin Đơn vị - Trọng tâm nâng cấp số 1)
1. **Workspace Đơn Vị Độc Lập:**
   * Giao diện quản trị riêng biệt tại đường dẫn `/org/portal`.
   * Hiển thị logo, tên bệnh viện, số lượng ca bệnh đang điều trị, tổng số ngọn nến đã nhận của toàn viện.
2. **Quản Lý Đội Ngũ Điều Phối Viên (Coordinator Management):**
   * Phân quyền cho bác sĩ hoặc tình nguyện viên thuộc viện mình.
   * Giao ca bệnh cụ thể cho từng điều phối viên phụ trách theo dõi.
3. **Cấu Hình Tài Khoản Viện Phí Đơn Vị:**
   * Cập nhật số tài khoản ngân hàng chính thức của bệnh viện (ví dụ: BIDV Viện Nhi TW, Vietcombank BV K).
   * Mã bệnh nhân viện phí tự động ánh xạ vào mã VietQR Napas247.
4. **Phê Duyệt Minh Chứng Quyên Góp (Donation Proof Approval):**
   * Đối soát biến động số dư tài khoản viện phí ➔ Bấm nút **"Duyệt Vinh Danh"** để đưa tên nhà hảo tâm lên Bảng Vàng và hệ thống tự động sinh Giấy Chứng Nhận Số.
5. **Cấp Tài Khoản Gia Đình (Admin-Provisioned Family Account):**
   * Tiếp nhận hồ sơ bản cứng hoặc scan CCCD + Giấy khai sinh của cha mẹ ➔ Cấp tài khoản bảo mật cho phụ huynh để họ có quyền kiểm soát hồ sơ con mình theo Luật Trẻ em 2016.

### 4.2. Dành cho `MEMBER / DONOR` (Nhà hảo tâm - Trọng tâm nâng cấp số 2)
1. **Gửi Minh Chứng Quyên Góp Lên Bảng Vàng:**
   * Sau khi quét mã VietQR chuyển viện phí, nhà hảo tâm có thể vào form gửi minh chứng: Tải ảnh chụp màn hình chuyển khoản Napas247, nhập mã giao dịch, số tiền (tùy chọn ẩn hoặc hiện).
   * Tùy chọn: *Vinh danh tên tôi* hoặc *Vinh danh dưới danh nghĩa Một Nhà Hảo Tâm Ẩn Danh*.
2. **Bảng Vàng Tri Ân Tấm Lòng Vàng (Wall of Benefactors):**
   * Giao diện trang trọng, hiển thị danh sách các tấm lòng vàng đã đồng hành cùng các con.
   * Phân hạng biểu trưng ấm áp: *Trái Tim Đồng, Trái Tim Bạc, Trái Tim Vàng, Thiên Thần Hộ Mệnh*.
3. **Giấy Chứng Nhận Tri Ân Điện Tử (Digital Certificate of Appreciation):**
   * Tự động sinh file bằng khen số đẹp mắt mang tên nhà hảo tâm, có đóng mộc số của đơn vị/bệnh viện.
   * Tích hợp **Mã QR Code tra cứu tính minh bạch**: Bất kỳ ai quét mã QR trên bằng khen đều dẫn tới trang xác minh giao dịch chính thức của viện, ngăn chặn 100% tình trạng làm giả giấy khen từ thiện.
4. **Cây Ước Nguyện Của Bé (Warrior's Wishlist Registry):**
   * Danh mục các ước mơ cụ thể của bé (1 hộp bút màu 36 màu, 1 con gấu bông, 1 bộ xếp hình Lego cứu hỏa).
   * Nhà hảo tâm bấm "Nhận thực hiện ước mơ" ➔ Nhận mã bưu phẩm và địa chỉ phòng Công tác Xã hội bệnh viện để gửi quà tận tay bé.
5. **Bức Thư Âm Thanh (Audio Voice Messages):**
   * Bấm micro thu âm lời chúc yêu thương 30-60 giây gửi tặng con trong phòng cách ly vô trùng.

### 4.3. Dành cho `FAMILY` (Phụ huynh bệnh nhi)
1. **Sổ Viện Phí & Sao Kê Minh Bạch (Transparent Medical Tracker):**
   * Phụ huynh cập nhật các đợt tạm ứng viện phí (Đợt 1 phẫu thuật, Đợt 2 hóa trị...).
   * Hiển thị thanh tiến độ: *Kinh phí đã thanh toán / Kinh phí còn thiếu*.
2. **Xác Nhận Nhanh Tiền Viện Phí Đã Nhận:**
   * Khi nhà hảo tâm chuyển khoản trực tiếp vào tài khoản gia đình bé, phụ huynh có nút bấm "Xác nhận đã nhận được viện phí" trên Cổng Gia Đình để tự động vinh danh nhà hảo tâm.
3. **Nhật Ký Nhanh Di Động (Micro-Journaling):**
   * Giao diện mobile thân thiện: Đăng 1 dòng tin vui kèm 1 bức ảnh chụp nụ cười của con ("Hôm nay con đã ăn được hết 1 bát cháo nhỏ!").

### 4.4. Dành cho `SUPER_ADMIN` (Quản trị viên tối cao)
1. **Quản Lý Danh Mục Bệnh Viện & Quỹ (Multi-Tenant Hub Management):**
   * Cấp phép kích hoạt Workspace cho đơn vị mới.
   * Tạm dừng hoặc thu hồi giấy phép nếu đơn vị vi phạm quy định minh bạch.
2. **Bản Đồ Hy Vọng Việt Nam (Interactive Hope Map):**
   * Bản đồ tương tác 63 tỉnh thành: Hiển thị mạng lưới bệnh viện nhi đồng hành và tổng số ngọn nến đã thắp sáng trên khắp cả nước.
3. **Bảng Thống Kê Vĩ Mô Toàn Quốc:**
   * Biểu đồ phân tích tỷ lệ bệnh nhi theo nhóm bệnh lý (Ung thư máu, U não, U thận...) và mức độ phân bổ viện phí hỗ trợ.

---

## 5. Thiết Kế Cơ Sở Dữ Liệu Mở Rộng (Schema Evolution & ERD)

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : "thuộc đơn vị"
    ORGANIZATIONS ||--o{ CHILDREN : "quản lý hồ sơ"
    USERS ||--o{ DONATIONS_RECOGNITION : "gửi minh chứng"
    CHILDREN ||--o{ DONATIONS_RECOGNITION : "thụ hưởng"
    DONATIONS_RECOGNITION ||--o| CERTIFICATES : "sinh giấy tri ân"
    CHILDREN ||--o{ WISHES : "ước mơ nhỏ"
    USERS ||--o{ WISHES : "nhận bảo trợ ước mơ"

    ORGANIZATIONS {
        uuid id PK
        string name "Bệnh Viện Nhi Trung Ương"
        string code "BVNTW"
        string org_type "HOSPITAL | CHARITY_FUND"
        string logo_url
        string address
        string hotline
        string default_bank_code
        string default_bank_account
        string default_bank_holder
        boolean is_verified
        boolean is_active
        timestamp created_at
    }

    DONATIONS_RECOGNITION {
        uuid id PK
        uuid child_id FK
        uuid donor_user_id FK
        string donor_name
        string donor_email
        decimal amount
        boolean is_amount_hidden
        string bank_reference_code
        string proof_image_url
        string status "PENDING | VERIFIED | REJECTED"
        uuid verified_by FK
        timestamp verified_at
        text public_message
        timestamp created_at
    }

    CERTIFICATES {
        uuid id PK
        uuid donation_id FK
        string certificate_number "CERT-2026-8891"
        string recipient_name
        string qr_verification_url
        string pdf_url
        timestamp issued_at
    }

    WISHES {
        uuid id PK
        uuid child_id FK
        string item_name "Bộ Lego Cứu Hỏa"
        text description
        string status "OPEN | ADOPTED | FULFILLED"
        uuid adopter_user_id FK
        string delivery_tracking_code
        timestamp created_at
    }
```

---

## 6. Lộ Trình Triển Khai Kỹ Thuật (Phased Implementation Roadmap)

```mermaid
flowchart TD
    Phase1["Pha 1: Cơ Sở Dữ Liệu & Phân Quyền Multi-Tenant<br/>• Bảng organizations, donations_recognition<br/>• Thêm role ORG_ADMIN vào Enum CSDL<br/>• Cột organization_id trong users và children"]
    --> Phase2["Pha 2: Backend REST API Đa Đơn Vị<br/>• Middleware ensureOrgScope (cô lập dữ liệu đơn vị)<br/>• APIs quản lý Đơn vị (/api/v1/organizations)<br/>• APIs gửi & duyệt minh chứng quyên góp (/api/v1/sponsorships/proof)"]
    --> Phase3["Pha 3: Giao Diện Frontend SSR Nâng Cao<br/>• Cổng Workspace ORG_ADMIN (/org/portal)<br/>• Bảng Vàng Vinh Danh Tấm Lòng Vàng (/sponsorships/wall-of-honor)<br/>• Form gửi biên lai Napas247 cho nhà hảo tâm"]
    --> Phase4["Pha 4: Cây Ước Nguyện & Giấy Chứng Nhận Số QR<br/>• Cây ước nguyện hiện vật của bé (Wishlist)<br/>• Tự động sinh Thư Tri Ân Số kèm mã QR tra cứu"]
    --> Phase5["Pha 5: Seed Dữ Liệu Mẫu Đa Đơn Vị & Kiểm Thử E2E<br/>• Seed 3 đơn vị: BV Nhi TW, BV K Tân Triều, Quỹ Nụ Cười Em<br/>• Tài khoản Org Admin mẫu & Đo kiểm luồng end-to-end"]
```

---

## 7. Kết Luận & Ý Nghĩa Đối Với Đồ Án BIT208V1

Việc nâng cấp hệ thống theo bản đặc tả này mang lại 3 giá trị học thuật và thực tiễn vượt trội:
1. **Tính Thực Tiễn (High Practical Feasibility):** Mô phỏng chuẩn xác 100% cách thức vận hành liên viện giữa Bệnh viện Nhi TW, Bệnh viện K, Quỹ thiện nguyện và các gia đình bệnh nhi ngoài đời thực.
2. **Tính Pháp Lý Vững Chắc:** Tuân thủ đồng thời **Luật Trẻ em 2016** (Quyền rút hồ sơ khẩn cấp của cha mẹ), **Nghị định 13/2023/NĐ-CP** (Bảo vệ dữ liệu cá nhân) và **Nghị định 93/2021/NĐ-CP** (Minh bạch dòng tiền quyên góp, chống trục lợi danh xưng từ thiện).
3. **Kiến Trúc Chuẩn Doanh Nghiệp (Enterprise Architecture):** Thể hiện rõ nét năng lực thiết kế phần mềm với mô hình **Multi-Tenant Row-Level Security**, **6-Tier Hierarchical RBAC**, và **Decoupled RESTful API**.
