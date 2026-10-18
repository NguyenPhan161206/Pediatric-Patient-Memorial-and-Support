const apiClient = require('../../shared/utils/apiClient');

/**
 * Hiển thị Dashboard Cổng Bệnh Viện & Quỹ Bảo Trợ
 */
const showHospitalPortal = async (req, res) => {
  if (!req.session.user || !req.session.token) {
    req.session.returnTo = '/organizations/portal';
    return res.redirect('/auth/login');
  }

  const { role } = req.session.user;
  if (!['ORG_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return res.status(403).render('home/views/index', {
      title: 'Không Có Quyền Truy Cập',
      errorMsg: 'Cổng này chỉ dành riêng cho Ban Quản Trị Bệnh Viện & Cơ Sở Điều Trị (ORG_ADMIN).'
    });
  }

  try {
    const token = req.session.token;
    const { org_id } = req.query;

    const [portalRes, allOrgsRes] = await Promise.all([
      apiClient.get('/organizations/portal/stats', {
        params: { org_id },
        headers: { Authorization: `Bearer ${token}` }
      }),
      apiClient.get('/organizations').catch(() => ({ data: { organizations: [] } }))
    ]);

    const portalData = portalRes.data || { organization: {}, stats: {}, warriors: [], recentDonations: [] };
    const allOrganizations = allOrgsRes.data ? (allOrgsRes.data.organizations || []) : [];

    const flashMessage = req.session.flashMessage || null;
    const errorMessage = req.session.errorMessage || null;
    delete req.session.flashMessage;
    delete req.session.errorMessage;

    res.render('organizations/views/portal', {
      title: `Cổng Quản Lý | ${portalData.organization.name || 'Bệnh Viện'}`,
      organization: portalData.organization,
      stats: portalData.stats,
      warriors: portalData.warriors,
      recentDonations: portalData.recentDonations,
      allOrganizations,
      isSuperAdminOrAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
      flashMessage,
      errorMessage,
      activeMenu: 'hospital-portal'
    });
  } catch (error) {
    console.error('[HOSPITAL PORTAL ERROR]', error);
    res.status(500).render('home/views/index', {
      title: 'Lỗi Tải Cổng Bệnh Viện',
      errorMsg: error.message || 'Không thể tải dữ liệu cổng bệnh viện.'
    });
  }
};

/**
 * Cập nhật thông tin phòng CTXH bệnh viện
 */
const updateHospitalInfo = async (req, res) => {
  if (!req.session.user || !req.session.token) {
    return res.redirect('/auth/login');
  }

  const { id } = req.params;
  const { contact_person, phone, email, address, bank_name, bank_code, bank_account_number, bank_account_name } = req.body;

  try {
    await apiClient.put(
      `/organizations/${id}`,
      {
        contact_person,
        phone,
        email,
        address,
        bank_name,
        bank_code,
        bank_account_number,
        bank_account_name
      },
      {
        headers: { Authorization: `Bearer ${req.session.token}` }
      }
    );

    req.session.flashMessage = 'Đã cập nhật thông tin phòng Công tác Xã hội bệnh viện thành công!';
  } catch (error) {
    console.error('[UPDATE HOSPITAL INFO ERROR]', error);
    req.session.errorMessage = error.message || 'Lỗi khi cập nhật thông tin bệnh viện.';
  }

  res.redirect('/organizations/portal');
};

module.exports = {
  showHospitalPortal,
  updateHospitalInfo
};
