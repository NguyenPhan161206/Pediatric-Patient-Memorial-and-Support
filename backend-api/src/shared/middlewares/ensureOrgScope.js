/**
 * Middleware đảm bảo kiểm soát truy cập phân vùng tổ chức (Multi-Tenant Organization Scope)
 * Chống lỗ hổng IDOR (Insecure Direct Object Reference) giữa các Bệnh viện / Quỹ.
 * 
 * Quy tắc:
 * - ADMIN / SUPER_ADMIN: Có quyền toàn cục (Global Scope), truy cập được mọi viện.
 * - ORG_ADMIN: Chỉ được xem/chỉnh sửa tài nguyên thuộc viện của mình (req.user.org_id === targetOrgId).
 * - Các vai trò khác: Bị từ chối (403 Forbidden).
 */
const ensureOrgScope = (getOrgIdFn) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'Bạn chưa được xác thực danh tính.'
        });
      }

      // Quản trị viên tối cao có quyền toàn cục
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Quản trị viên cấp đơn vị (Bệnh viện / Quỹ)
      if (user.role === 'ORG_ADMIN') {
        let targetOrgId = null;

        if (typeof getOrgIdFn === 'function') {
          targetOrgId = await getOrgIdFn(req);
        } else {
          targetOrgId = req.params.orgId || req.params.id || req.body.organization_id || req.body.org_id;
        }

        // Nếu endpoint có xác định targetOrgId cụ thể, phải khớp với org_id của user
        if (targetOrgId && String(targetOrgId) !== String(user.org_id)) {
          return res.status(403).json({
            status: 'fail',
            message: 'Từ chối truy cập: Bạn không có quyền quản trị hoặc thao tác trên dữ liệu của cơ sở/bệnh viện khác.'
          });
        }

        return next();
      }

      return res.status(403).json({
        status: 'fail',
        message: 'Hành động này yêu cầu quyền Quản trị đơn vị (ORG_ADMIN).'
      });
    } catch (err) {
      console.error('[ENSURE_ORG_SCOPE_ERROR]', err);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi kiểm tra phạm vi phân quyền đơn vị.'
      });
    }
  };
};

module.exports = {
  ensureOrgScope
};
