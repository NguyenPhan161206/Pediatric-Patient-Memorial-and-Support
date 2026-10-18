# 📚 Trung Tâm Tài Liệu Dự Án (Documentation Center)
### Cổng Ký Ức, Tri Ân & Vinh Danh Các Chiến Binh Nhí (Courageous Little Warriors Memorial & Tribute Hub)
> **Mã môn học / Đồ án:** BIT208V1 - Đồ Án Chuyên Ngành Công Nghệ Thông Tin  
> **Cập nhật:** 19/10/2026 (Phiên bản v2.0)

Thư mục `docs/` chứa toàn bộ tài liệu kỹ thuật, kiến trúc hệ thống, quy chuẩn API, từ điển dữ liệu và kịch bản trình diễn đồ án cho Hội đồng Giám khảo:

---

## 📑 Danh Mục Tài Liệu Kỹ Thuật

| Tài liệu | Mô tả chi tiết | Đối tượng sử dụng |
| :--- | :--- | :--- |
| 📘 [**USER_GUIDE_AND_WALKTHROUGH.md**](./USER_GUIDE_AND_WALKTHROUGH.md) | **Cẩm nang sử dụng & 6 Kịch bản trình diễn đồ án** cho Hội đồng Giám khảo, bảng tài khoản kiểm thử 6 vai trò (*Pre-seeded Accounts*). | Giám khảo, Giảng viên, Sinh viên bảo vệ |
| 📖 [**API_DOCUMENTATION.md**](./API_DOCUMENTATION.md) | **Tài liệu tham chiếu Backend REST API** đầy đủ 7 Module, định dạng request/response, mã lỗi HTTP và cơ chế bảo mật JWT Bearer. | Lập trình viên Backend, Frontend, Tester |
| 🛡️ [**SYSTEM_ROLES_AND_PERMISSIONS.md**](./SYSTEM_ROLES_AND_PERMISSIONS.md) | **Ma trận phân quyền 6 vai trò (RBAC)**, phân rã danh tính đa thành tố, cơ chế bảo mật và căn cứ pháp lý (*Luật Trẻ em 2016, NĐ 13/2023, NĐ 93/2021, NĐ 147/2024*). | Kiến trúc sư hệ thống, Quản trị viên, Pháp chế |
| 🗄️ [**DATABASE_SCHEMA_DICTIONARY.md**](./DATABASE_SCHEMA_DICTIONARY.md) | **Từ điển dữ liệu CSDL chuẩn hóa 3NF** chi tiết 10 bảng PostgreSQL, ràng buộc toàn vẹn, sơ đồ Mermaid ERD và chỉ mục Full-Text Search. | Kỹ sư CSDL, Backend Developer |
| 📜 [**PROJECT_HISTORY_AND_LOGS.md**](./PROJECT_HISTORY_AND_LOGS.md) | **Nhật ký tiến độ & Lịch sử phát triển toàn diện** qua các giai đoạn, khắc phục 7 thiếu sót, quy tắc Git mềm, kết quả nghiệm thu 6/6 Role. | Đánh giá tiến độ, Báo cáo đồ án |

---

## 🚀 Lối Tắt Khởi Chạy Nhanh Cho Giám Khảo

Hệ thống được đóng gói hoàn chỉnh bằng Docker Compose:
```bash
# 1. Khởi động toàn bộ 4 dịch vụ (DB, Backend, Frontend SSR, pgAdmin)
docker compose up -d

# 2. Truy cập ứng dụng web
# Giao diện chính (Frontend SSR): http://localhost:3000
# Backend REST API:              http://localhost:5000/api/v1
# pgAdmin 4 Database GUI:        http://localhost:5050
```

*Mật khẩu dùng chung cho tất cả tài khoản kiểm thử:* **`Password@2026`**
