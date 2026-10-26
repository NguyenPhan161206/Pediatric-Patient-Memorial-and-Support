# 📘 Cẩm Nang Sử Dụng & Kịch Bản Trình Diễn Đồ Án (User Guide & Defense Walkthrough)
### Dự Án: Cổng Ký Ức, Tri Ân & Vinh Danh Các Chiến Binh Nhí (Courageous Little Warriors Hub)
> **Mã môn học:** BIT208V1 - Đồ Án Chuyên Ngành Công Nghệ Thông Tin  
> **Dành cho:** Sinh viên thực hiện, Giảng viên hướng dẫn và Hội đồng Chấm đồ án Tốt nghiệp  
> **Cập nhật:** 19/10/2026 (Phiên bản v2.0 - Hoàn thiện 6 Roles, Media Vault & Web Audio)

---

## 📌 Mục Lục
1. [Bảng Tài Khoản Kiểm Thử Đầy Đủ 6 Vai Trò (Pre-seeded Accounts)](#1-bảng-tài-khoản-kiểm-thử-đầy-đủ-6-vai-trò-pre-seeded-accounts)
2. [Cấu Trúc Giao Diện: Thanh Công Cụ Toolbar Bên Trái (Left Sidebar)](#2-cấu-trúc-giao-diện-thanh-công-cụ-toolbar-bên-trái-left-sidebar)
3. [Kịch Bản 1: Khách Vãng Lai Trải Nghiệm Demo Sandbox 1-Click & Chứng Nhận Số](#3-kịch-bản-1-khách-vãng-lai-trải-nghiệm-demo-sandbox-1-click--chứng-nhận-số)
4. [Kịch Bản 2: Phụ Huynh Quản Lý Kho Kỷ Niệm & Ghi Âm Lời Ru Web Audio](#4-kịch-bản-2-phụ-huynh-quản-lý-kho-kỷ-niệm--ghi-âm-lời-ru-web-audio)
5. [Kịch Bản 3: Điều Phối Viên Thẩm Định Âm Thanh & Duyệt Lời Chúc Tiền Kiểm](#5-kịch-bản-3-điều-phối-viên-thẩm-định-âm-thanh--duyệt-lời-chúc-tiền-kiểm)
6. [Kịch Bản 4: Quản Trị Bệnh Viện Đối Soát Viện Phí & Quản Lý Đội Ngũ Y Bác Sĩ](#6-kịch-bản-4-quản-trị-bệnh-viện-đối-soát-viện-phí--quản-lý-đội-ngũ-y-bác-sĩ)
7. [Kịch Bản 5: Quản Trị Hệ Thống Điều Hành KPI & Cấp Phát Tài Khoản](#7-kịch-bản-5-quản-trị-hệ-thống-điều-hành-kpi--cấp-phát-tài-khoản)
8. [Kịch Bản 6: Thực Thi Quyền Rút Hồ Sơ Khẩn Cấp (Điều 33 Luật Trẻ Em 2016)](#8-kịch-bản-6-thực-thi-quyền-rút-hồ-sơ-khẩn-cấp-điều-33-luật-trẻ-em-2016)

---

## 1. Bảng Tài Khoản Kiểm Thử Đầy Đủ 6 Vai Trò (Pre-seeded Accounts)

Toàn bộ tài khoản thử nghiệm đã được nạp sẵn vào CSDL với mật khẩu đồng bộ chuẩn **`Password@2026`**:

| STT | Vai Trò (Role) | Email Đăng Nhập | Mật Khẩu | Tên Hiển Thị Chuẩn Hóa | Ý Nghĩa / Mục Đích Kiểm Thử |
| :-: | :--- | :--- | :---: | :--- | :--- |
| 1 | **SUPER_ADMIN** | `superadmin@warrior.org` | `Password@2026` | Đặng Quốc Anh | Quản trị cấp cao nhất, toàn quyền cấu hình hạ tầng. |
| 2 | **ADMIN** | `admin@warrior.org` | `Password@2026` | Nguyễn Văn Trị (Quản Trị Viên Vận Hành) | Giám sát Dashboard, Quản trị 11 users, Phân quyền, Khóa/Mở tài khoản. |
| 3 | **COORDINATOR** | `coordinator@warrior.org` | `Password@2026` | CN. Trần Thị Thu Hà (Điều Phối Viên Mạng Lưới) | Tiền kiểm duyệt lời chúc, Nghe thẩm định audio tin nhắn thoại, Cấp tài khoản gia đình. |
| 4 | **ORG_ADMIN (Viện K)** | `orgadmin.k@warriorhub.vn` | `Password@2026` | ThS. Nguyễn Thị Mai (Quản Trị Viên Đơn Vị Y Tế) | Quản trị Bệnh viện K Tân Triều, Bệnh nhi, Bác sĩ khoa phòng, Đối soát viện phí. |
| 5 | **ORG_ADMIN (Nhi TW)** | `orgadmin.nhi@warriorhub.vn` | `Password@2026` | BS.CKII. Lê Minh Hoàng | Quản trị Bệnh viện Nhi TW, xác nhận điều trị nội trú. |
| 6 | **ORG_ADMIN (Quỹ)** | `orgadmin.nucuoiem@warriorhub.vn` | `Password@2026` | Đặng Thùy Dương | Đại diện Quỹ Thiện Nguyện Nụ Cười Em. |
| 7 | **FAMILY (Bé Minh An)** | `family.minhan@gmail.com` | `Password@2026` | KTS. Lê Văn Hải (Bố bé Mai Chi) | Phụ huynh bé Nguyễn Minh An: Kho ảnh/video, Thu âm lời ru Web Audio, Cây điều ước. |
| 8 | **FAMILY (Bé Mai Chi)** | `family.maichi@gmail.com` | `Password@2026` | Lê Văn Hải (Bố bé Mai Chi) | Phụ huynh bé Lê Mai Chi. |
| 9 | **FAMILY (Bé Tuấn Kiệt)**| `family.tuankiet@gmail.com` | `Password@2026` | Trần Văn Đức (Bố bé Tuấn Kiệt) | Phụ huynh bé Trần Tuấn Kiệt (Viện K). |
| 10 | **FAMILY (Bé Thiên Ân)**| `family.thienan@gmail.com` | `Password@2026` | Phạm Thu Trang (Mẹ thiên thần Thiên Ân)| Phụ huynh bé Thiên Ân (`ANGEL`). |
| 11 | **MEMBER** | `supporter@gmail.com` | `Password@2026` | Phạm Minh Hùng | Nhà hảo tâm thành viên đã đăng ký. |
| 12 | **PUBLIC GUEST** | Không cần đăng nhập | N/A | Khách vãng lai | Xem danh sách bé, Thắp nến, Thử nghiệm Sandbox 1-Click. |

---

## 2. Cấu Trúc Giao Diện: Thanh Công Cụ Toolbar Bên Trái (Left Sidebar)

Giao diện được tái cấu trúc thành **Thanh công cụ Toolbar bên trái (Left Sidebar)** thống nhất trên mọi trang:
* **Khả năng thu gọn linh hoạt (Desktop Collapsible):** Nhấp nút mũi tên góc dưới cùng bên trái để chuyển đổi mượt mà giữa chế độ rộng (288px) và chế độ thu gọn biểu tượng (80px). Trạng thái được lưu tự động trong `localStorage`.
* **Phân cụm menu ngữ cảnh:**
  1. *Khám Phá Cộng Đồng:* Trang chủ & Bản đồ, Danh mục Chiến binh nhí, Cây Điều Ước, Bức Tường Vinh Danh.
  2. *Hành Động Nhanh:* Nút kích hoạt **Mô Phỏng Sandbox 1-Click**.
  3. *Menu Phân Quyền Động:* Tùy theo vai trò người dùng đăng nhập, các khối công cụ chuyên biệt sẽ xuất hiện (Quản trị hệ thống `ADMIN`, Tiền kiểm duyệt `COORDINATOR`, Cổng Bệnh viện `ORG_ADMIN`, Cổng Hộ gia đình `FAMILY`).
  4. *Thẻ Hồ Sơ Người Dùng (Footer Toolbar):* Hiển thị avatar, tên định danh chuẩn hóa theo tiền tố xưng hô và nút Đăng xuất an toàn.

---

## 3. Kịch Bản 1: Khách Vãng Lai Trải Nghiệm Demo Sandbox 1-Click & Chứng Nhận Số

> **Mục tiêu trình diễn:** Minh họa cơ chế **Zero-touch Cashflow (Nghị định 93/2021/NĐ-CP)** và tính năng **Chứng Nhận Tri Ân Số HMAC-SHA256** mà không cần chuyển tiền thật.

1. **Bước 1:** Truy cập trang chủ `http://localhost:3000/`.
2. **Bước 2:** Bấm vào nút vàng **"⚡ Thử Nghiệm Demo"** trên thanh Header hoặc nút **"Mô Phỏng Ủng Hộ (Sandbox 1-Click)"** trên thanh Sidebar.
3. **Bước 3:** Modal Sandbox xuất hiện:
   * Chọn chiến binh nhí nhận tiếp sức (VD: *👦 Bé Minh An - Bệnh viện Nhi TW*).
   * Hệ thống lập tức hiển thị tài khoản tiếp nhận thực tế của Bệnh viện Nhi TW tại ngân hàng BIDV.
   * Chọn số tiền thử nghiệm (VD: *500.000 đ*).
   * Nhập tên nhà hảo tâm mô phỏng: *"Hội Đồng Giám Khảo BIT208V1"*.
   * Tích chọn *"Mở ngay Chứng Nhận Tri Ân Số sau khi thanh toán"*.
4. **Bước 4:** Bấm **"Kích Hoạt Thanh Toán 1-Click 🚀"**:
   * Hệ thống tự động tạo mã giao dịch, thẩm định đối soát, sinh mã Chứng Nhận Số (VD: `CLW-2026-XXXX`).
   * Tự động điều hướng tới trang **Chứng Nhận Tri Ân Số Công Khai** (`/verify/cert/:token`).
   * Giám khảo có thể dùng camera điện thoại quét mã QR trên màn hình để kiểm tra tính hợp lệ của chứng chỉ mật mã.
5. **Bước 5:** Bấm sang menu **"Bức Tường Vinh Danh"**: Tên *"Hội Đồng Giám Khảo BIT208V1"* đã được vinh danh trang trọng kèm dấu tích xanh *"Đã xác minh"*.

---

## 4. Kịch Bản 2: Phụ Huynh Quản Lý Kho Kỷ Niệm & Ghi Âm Lời Ru Web Audio

> **Mục tiêu trình diễn:** Minh họa năng lực quản lý truyền thông đa phương tiện (*Media Vault*) và công nghệ thu âm lời ru trực tiếp qua trình duyệt (*HTML5 Web Audio API*).

1. **Bước 1:** Đăng nhập tài khoản phụ huynh:
   * Email: `family.minhan@gmail.com`
   * Mật khẩu: `Password@2026`
2. **Bước 2:** Nhấp vào menu **"👨‍👩‍👧 Cổng Quản Lý Gia Đình"** (`/family/portal`):
   * Giao diện chào mừng phụ huynh **KTS. Lê Văn Hải (Bố bé Mai Chi)**.
3. **Bước 3: Tùy biến danh xưng và cách xưng hô:**
   * Bấm nút **"⚙️ Cài đặt danh xưng"**.
   * Thay đổi Giới tính (*Nam* $\rightarrow$ Tiền tố Ông / Mr.), Họ tên, Chức danh, Quan hệ với con (*Bố*).
   * Quan sát khung **Xem trước song ngữ thời gian thực (Live Preview)** Tiếng Việt & English thay đổi tức thì theo từng phím gõ.
   * Bấm *"Lưu Thông Tin Xưng Hô"*.
4. **Bước 4: Thêm video kỷ niệm của bé vào Kho Kỷ Niệm:**
   * Tại mục **"📸 Kho Kỷ Niệm Của Con"**, bấm nút **"+ Thêm Ảnh / Video Kỷ Niệm"**.
   * Chọn loại: *🎬 Video / Clip kỷ niệm*.
   * Dán đường dẫn YouTube: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`.
   * Nhập tiêu đề: *"Clip sinh nhật nụ cười rạng rỡ của con"*.
   * Bấm *"Lưu Vào Kho Kỷ Niệm"*: Hệ thống tự động chuyển đổi thành YouTube Embed Player và lấy ảnh thumbnail chất lượng cao.
5. **Bước 5: Thu âm Lời Ru Yêu Thương (HTML5 Web Audio):**
   * Tại mục **"🎙️ Ghi Âm Lời Ru & Tin Nhắn Thoại Yêu Thương Gửi Con"**:
   * Bấm nút đỏ **"Bắt đầu thu âm"** và cấp quyền Microphone.
   * Đồng hồ đếm giây hoạt động kèm hiệu ứng thanh sóng âm dao động.
   * Sau khi nói/hát ru vài giây, bấm **"Dừng thu âm ⏹️"**.
   * Trình phát âm thanh xuất hiện cho phép phụ huynh nghe lại bản thu.
   * Bấm **"💌 Lưu Lời Ru Gửi Con"**: Tệp âm thanh được tải lên máy chủ và lưu trữ an toàn.
6. **Bước 6:** Bấm nút **"Xem trang công khai ↗"** để chiêm ngưỡng trang hồ sơ của con với đầy đủ Trình phát video YouTube và Trình phát âm thanh lời ru.

---

## 5. Kịch Bản 3: Điều Phối Viên Thẩm Định Âm Thanh & Duyệt Lời Chúc Tiền Kiểm

> **Mục tiêu trình diễn:** Minh họa quy trình tiền kiểm duyệt 100% nội dung chữ và âm thanh theo **Nghị định 147/2024/NĐ-CP**.

1. **Bước 1:** Đăng nhập tài khoản Điều phối viên:
   * Email: `coordinator@warrior.org`
   * Mật khẩu: `Password@2026`
2. **Bước 2:** Trên thanh Toolbar bên trái, bấm vào mục **"🛡️ Kiểm Duyệt Lời Chúc"** (`/tributes/moderation`).
3. **Bước 3:** Hàng đợi tiền kiểm hiển thị các lời chúc và tin nhắn thoại đang ở trạng thái `PENDING`:
   * Các tin nhắn thoại có nhãn nổi bật: *🎙️ Thẩm định tin nhắn thoại / Lời ru*.
   * Điều phối viên bấm nút **Play** trên HTML5 Audio Player để nghe thử nội dung ghi âm trước khi quyết định.
4. **Bước 4:** Bấm **"✓ Phê duyệt"**: Lời chúc kèm bản ghi âm lập tức được công khai trên trang tưởng niệm của bé.
5. **Bước 5 (Thử nghiệm từ chối):** Với những lời chúc chứa nội dung không phù hợp, bấm **"✕ Từ chối"**: Nội dung bị loại bỏ an toàn.

---

## 6. Kịch Bản 4: Quản Trị Bệnh Viện Đối Soát Viện Phí & Quản Lý Đội Ngũ Y Bác Sĩ

> **Mục tiêu trình diễn:** Minh họa mô hình quản trị đa bệnh viện (*Multitenancy*) và quản lý nhân sự y tế khoa phòng (`ORG_ADMIN`).

1. **Bước 1:** Đăng nhập tài khoản Bệnh viện K Tân Triều:
   * Email: `orgadmin.k@warriorhub.vn`
   * Mật khẩu: `Password@2026`
2. **Bước 2:** Bấm vào mục **"🏥 Cổng Quản Lý Bệnh Viện"** (`/organizations/portal`):
   * Tiêu đề hiển thị: **Bệnh viện K - Cơ sở Tân Triều**.
   * Bảng chỉ số: Bệnh nhi đang điều trị, Tổng viện phí đã tiếp sức, Biên lai cần đối soát, Điều ước của bé.
3. **Bước 3: Xem danh sách bệnh nhi:**
   * Danh sách bệnh nhi thuộc Khoa Nhi Ung Bướu của viện, phân loại bệnh lý, trạng thái và số nến.
4. **Bước 4: Kiểm tra đội ngũ y bác sĩ & nhân sự y tế:**
   * Kéo xuống mục **"👨‍⚕️ Đội Ngũ Cán Bộ Y Tế & Điều Phối Viên Bệnh Viện"**:
   * Hiển thị thẻ thông tin của **ThS. Nguyễn Thị Mai** kèm học hàm, chức vụ *Quản Trị Viên Đơn Vị Y Tế*, khoa phòng *Cơ Sở Tân Triều*, email và hotline liên hệ.
5. **Bước 5: Quản lý thông tin tài khoản viện phí:**
   * Mục cập nhật số tài khoản ngân hàng tiếp nhận viện phí công khai (STK Vietcombank của Quỹ Ngày Mai Tươi Sáng - BV K).

---

## 7. Kịch Bản 5: Quản Trị Hệ Thống Điều Hành KPI & Cấp Phát Tài Khoản

> **Mục tiêu trình diễn:** Minh họa vai trò Quản trị viên hệ thống toàn quyền (`ADMIN`).

1. **Bước 1:** Đăng nhập tài khoản Quản trị viên:
   * Email: `admin@warrior.org`
   * Mật khẩu: `Password@2026`
2. **Bước 2: Xem Bảng Điều Hành Hợp Nhất (`/admin/dashboard`):**
   * Các thẻ KPI: Tổng người dùng (11 users phân loại theo 6 role và giới tính), Tổng bệnh nhi, Tổng dòng tiền Zero-touch, Hàng đợi tiền kiểm.
   * Bảng phân bổ bệnh nhân và viện phí theo từng bệnh viện.
   * Bảng nhật ký kiểm toán (*Audit Trail*) ghi nhận các hành vi nhạy cảm kèm IP và mốc thời gian.
3. **Bước 3: Quản Lý Người Dùng & Cấp Phát Tài Khoản (`/admin/users`):**
   * Xem bảng dữ liệu 11 tài khoản với tên hiển thị chuẩn hóa đa thành tố.
   * Thử nghiệm bộ lọc: Lọc theo vai trò `ORG_ADMIN` hoặc lọc theo bệnh viện.
   * **Thử nghiệm khóa tài khoản:** Bấm nút **"🔒 Khóa"** trên một tài khoản $\rightarrow$ Trạng thái chuyển sang *"Đã khóa"*, người dùng đó sẽ không thể đăng nhập.
   * **Thử nghiệm reset mật khẩu:** Bấm nút **"🔑 Reset"** $\rightarrow$ Mật khẩu lập tức được khôi phục về `Password@2026`.
   * **Thử nghiệm cấp tài khoản mới:** Bấm nút **"+ Cấp Tài Khoản Mới"**, chọn vai trò, nhập họ tên phân tách, chọn giới tính và quan sát Live Preview thời gian thực.

---

## 8. Kịch Bản 6: Thực Thi Quyền Rút Hồ Sơ Khẩn Cấp (Điều 33 Luật Trẻ Em 2016)

> **Mục tiêu trình diễn:** Minh họa quyền bảo mật thông tin tối thượng của cha mẹ bệnh nhi (*Emergency Unpublish / Right to be Forgotten*).

1. **Bước 1:** Đăng nhập tài khoản phụ huynh `family.minhan@gmail.com` / `Password@2026`.
2. **Bước 2:** Vào Cổng Gia Đình (`/family/portal`), quan sát hồ sơ bé Nguyễn Minh An đang ở trạng thái xanh: **"Đang hiển thị công khai"**.
3. **Bước 3:** Mở một tab trình duyệt khác truy cập trang công khai: `http://localhost:3000/warriors/nguyen-minh-an-bo` (hồ sơ vẫn hiển thị bình thường).
4. **Bước 4:** Quay lại tab phụ huynh, kéo xuống khu vực màu đỏ:  
   **"🚨 Rút Hồ Sơ Khẩn Cấp (Emergency Unpublish - Quyền Được Quên)"**.
5. **Bước 5:** Nhập lý do: *"Gia đình yêu cầu bảo mật riêng tư theo Luật Trẻ em 2016"* và bấm nút **"Ẩn hồ sơ ngay"**.
6. **Bước 6: Kiểm tra kết quả:**
   * Tại tab phụ huynh: Trạng thái hồ sơ chuyển sang **"🔒 Đã ẩn an toàn (Quyền được quên)"**.
   * Quay lại tab công khai và F5: Hệ thống báo lỗi `404 Not Found` (*"Không tìm thấy hồ sơ của chiến binh nhí này hoặc hồ sơ đã được ẩn"*).
   * Vào trang danh sách chiến binh (`/warriors`) và tìm kiếm: Hồ sơ bé đã hoàn toàn biến mất khỏi kết quả tìm kiếm công cộng.
7. **Kết luận:** Quyền riêng tư của trẻ em được thực thi ngay tức thì mà **không cần chờ phê duyệt từ bất kỳ cấp quản lý nào**, tuân thủ hoàn hảo Điều 33 Luật Trẻ em 2016.
