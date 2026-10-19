const db = require('../database/knex');

/**
 * Middleware bảo vệ quyền sở hữu của Hộ Gia Đình (Ownership-based Access Control)
 * Đảm bảo tài khoản FAMILY chỉ có thể chỉnh sửa/ẩn hồ sơ của chính con mình.
 * Admin có toàn quyền vượt qua kiểm tra này.
 */
const ensureFamilyOwnership = async (req, res, next) => {
  try {
    const childId = req.params.id || req.params.childId;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'Vui lòng đăng nhập trước khi thực hiện.'
      });
    }

    // Quản trị viên hệ thống (Platform Admin) không có thẩm quyền can thiệp hồ sơ bệnh án
    // theo Luật Trẻ Em 2016 và Nghị định 13/2023/NĐ-CP (PDPD)
    if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        status: 'fail',
        message: 'Quản trị viên hệ thống không có thẩm quyền sửa đổi trực tiếp hồ sơ bệnh án của bệnh nhi theo Luật Trẻ em 2016 và Nghị định 13/2023/NĐ-CP. Thao tác này thuộc thẩm quyền của Cơ sở Y tế quản lý (ORG_ADMIN) hoặc Hộ gia đình (FAMILY).'
      });
    }

    // Nếu là Admin Đơn Vị (ORG_ADMIN)
    if (currentUser.role === 'ORG_ADMIN') {
      const child = await db('children')
        .where({ id: childId })
        .first();

      if (!child) {
        return res.status(404).json({
          status: 'fail',
          message: 'Không tìm thấy hồ sơ chiến binh nhí này.'
        });
      }

      if (child.organization_id && child.organization_id === currentUser.org_id) {
        return next(); // Đúng bé thuộc bệnh viện/cơ sở quản lý
      }
    }

    // Nếu là vai trò FAMILY
    if (currentUser.role === 'FAMILY') {
      const child = await db('children')
        .where({ id: childId })
        .first();

      if (!child) {
        return res.status(404).json({
          status: 'fail',
          message: 'Không tìm thấy hồ sơ chiến binh nhí này.'
        });
      }

      if (child.family_user_id === currentUser.id) {
        return next(); // Đúng là cha mẹ/người giám hộ của bé này
      }
    }

    // Điều phối viên (COORDINATOR) được phép sửa nếu họ là người tạo hồ sơ ban đầu hoặc cùng viện
    if (currentUser.role === 'COORDINATOR') {
      const child = await db('children')
        .where({ id: childId })
        .first();

      if (child && (child.created_by === currentUser.id || (currentUser.org_id && child.organization_id === currentUser.org_id))) {
        return next();
      }
    }

    return res.status(403).json({
      status: 'fail',
      message: 'Bạn không có quyền chỉnh sửa hoặc thao tác trên hồ sơ của bé này.'
    });
  } catch (error) {
    console.error('[OWNERSHIP ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi kiểm tra quyền sở hữu hồ sơ.'
    });
  }
};

module.exports = {
  ensureFamilyOwnership
};
