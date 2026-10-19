const apiClient = require('../../shared/utils/apiClient');

/**
 * Hiển thị Dashboard Quản Trị Hệ Thống (/admin/dashboard)
 */
const renderDashboard = async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'ADMIN' && req.session.user.role !== 'SUPER_ADMIN')) {
    req.session.errorMsg = 'Bạn không có quyền truy cập vào Cổng Quản Trị Hệ Thống.';
    return res.redirect('/auth/login');
  }

  try {
    const token = req.session.token;
    const response = await apiClient.get('/admin/dashboard/metrics', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const metrics = response.data || {};

    return res.render('admin/views/dashboard', {
      title: 'Bảng Điều Hành Quản Trị',
      user: req.session.user,
      metrics,
      successMsg: req.session.successMsg,
      errorMsg: req.session.errorMsg
    });
  } catch (error) {
    console.error('[ADMIN RENDER DASHBOARD ERROR]', error);
    return res.render('admin/views/dashboard', {
      title: 'Bảng Điều Hành Quản Trị',
      user: req.session.user,
      metrics: {
        users: { total: 0, byRole: {}, byGender: {} },
        children: { total: 0, byStatus: {} },
        finances: { totalAmount: 0, totalTransactions: 0 },
        pendingQueues: { tributes: 0, donations: 0, wishes: 0 },
        hospitalDistribution: [],
        recentAuditLogs: []
      },
      errorMsg: 'Không thể tải chỉ số hệ thống: ' + (error.message || 'Lỗi kết nối')
    });
  } finally {
    delete req.session.successMsg;
    delete req.session.errorMsg;
  }
};

/**
 * Hiển thị Quản Lý Người Dùng & Cấp Tài Khoản (/admin/users)
 */
const renderUsers = async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'ADMIN' && req.session.user.role !== 'SUPER_ADMIN')) {
    req.session.errorMsg = 'Bạn không có quyền truy cập vào danh mục người dùng.';
    return res.redirect('/auth/login');
  }

  try {
    const token = req.session.token;
    const { page, limit, role, org_id, gender, is_active, q } = req.query;

    const queryParams = new URLSearchParams();
    if (page) queryParams.set('page', page);
    if (limit) queryParams.set('limit', limit);
    if (role) queryParams.set('role', role);
    if (org_id) queryParams.set('org_id', org_id);
    if (gender) queryParams.set('gender', gender);
    if (is_active) queryParams.set('is_active', is_active);
    if (q) queryParams.set('q', q);

    const [usersRes, orgsRes, warriorsRes] = await Promise.all([
      apiClient.get(`/admin/users?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      apiClient.get('/organizations').catch(() => ({ data: { organizations: [] } })),
      apiClient.get('/warriors?limit=100').catch(() => ({ data: [] }))
    ]);

    const users = usersRes.data || [];
    const pagination = usersRes.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 };
    const organizations = orgsRes.data ? (orgsRes.data.organizations || []) : [];
    const warriors = warriorsRes.data || [];

    return res.render('admin/views/users', {
      title: 'Quản Lý Người Dùng & Cấp Quyền',
      user: req.session.user,
      users,
      pagination,
      organizations,
      warriors,
      currentFilter: { role, org_id, gender, is_active, q },
      successMsg: req.session.successMsg,
      errorMsg: req.session.errorMsg
    });
  } catch (error) {
    console.error('[ADMIN RENDER USERS ERROR]', error);
    return res.render('admin/views/users', {
      title: 'Quản Lý Người Dùng & Cấp Quyền',
      user: req.session.user,
      users: [],
      pagination: { total: 0, page: 1, limit: 15, totalPages: 1 },
      organizations: [],
      warriors: [],
      currentFilter: req.query,
      errorMsg: 'Không thể tải danh sách người dùng: ' + (error.message || 'Lỗi kết nối')
    });
  } finally {
    delete req.session.successMsg;
    delete req.session.errorMsg;
  }
};

/**
 * Xử lý tạo và cấp tài khoản mới
 */
const handleCreateUser = async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'ADMIN' && req.session.user.role !== 'SUPER_ADMIN')) {
    return res.redirect('/auth/login');
  }

  try {
    const token = req.session.token;
    const {
      email,
      password,
      last_name,
      middle_name,
      first_name,
      gender,
      title_prefix,
      family_relation,
      job_title,
      department,
      include_prefix_in_display,
      include_title_in_display,
      include_relation_in_display,
      display_mode,
      phone_number,
      role,
      org_id,
      child_id
    } = req.body;

    const payload = {
      email,
      password,
      last_name,
      middle_name,
      first_name,
      gender,
      title_prefix,
      family_relation,
      job_title,
      department,
      include_prefix_in_display: include_prefix_in_display === 'on' || include_prefix_in_display === true,
      include_title_in_display: include_title_in_display === 'on' || include_title_in_display === true,
      include_relation_in_display: include_relation_in_display === 'on' || include_relation_in_display === true,
      display_mode,
      phone_number,
      role,
      org_id: org_id || null,
      child_id: child_id || null
    };

    const response = await apiClient.post('/admin/users', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    req.session.successMsg = response.message || 'Đã cấp tài khoản người dùng mới thành công.';
  } catch (error) {
    console.error('[ADMIN CREATE USER ERROR]', error);
    req.session.errorMsg = 'Lỗi tạo tài khoản: ' + (error.message || 'Thất bại');
  }

  return res.redirect('/admin/users');
};

/**
 * Khóa hoặc Mở khóa tài khoản
 */
const handleToggleStatus = async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'ADMIN' && req.session.user.role !== 'SUPER_ADMIN')) {
    return res.redirect('/auth/login');
  }

  try {
    const token = req.session.token;
    const { id } = req.params;

    const response = await apiClient.patch(`/admin/users/${id}/status`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    req.session.successMsg = response.message || 'Đã cập nhật trạng thái người dùng thành công.';
  } catch (error) {
    console.error('[ADMIN TOGGLE STATUS ERROR]', error);
    req.session.errorMsg = 'Lỗi cập nhật trạng thái: ' + (error.message || 'Thất bại');
  }

  return res.redirect('/admin/users');
};

/**
 * Đặt lại mật khẩu về mặc định Password@2026
 */
const handleResetPassword = async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'ADMIN' && req.session.user.role !== 'SUPER_ADMIN')) {
    return res.redirect('/auth/login');
  }

  try {
    const token = req.session.token;
    const { id } = req.params;

    const response = await apiClient.post(`/admin/users/${id}/reset-password`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    req.session.successMsg = response.message || 'Đã đặt lại mật khẩu về mặc định Password@2026.';
  } catch (error) {
    console.error('[ADMIN RESET PASSWORD ERROR]', error);
    req.session.errorMsg = 'Lỗi đặt lại mật khẩu: ' + (error.message || 'Thất bại');
  }

  return res.redirect('/admin/users');
};

/**
 * Hiển thị Quản Lý Đơn Vị & Cơ Sở Y Tế Phụ Trách (/admin/organizations)
 */
const renderOrganizations = async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'ADMIN' && req.session.user.role !== 'SUPER_ADMIN')) {
    req.session.errorMsg = 'Bạn không có quyền truy cập vào danh mục cơ sở y tế.';
    return res.redirect('/auth/login');
  }

  try {
    const token = req.session.token;
    const response = await apiClient.get('/organizations');
    const orgs = (response.data && response.data.organizations) || [];

    const totalOrgs = orgs.length;
    const activeOrgs = orgs.filter(o => o.is_active !== false).length;
    const totalWarriors = orgs.reduce((sum, o) => sum + (parseInt(o.warriors_count, 10) || 0), 0);

    return res.render('admin/views/organizations', {
      title: 'Quản Lý Đơn Vị & Cơ Sở Y Tế Phụ Trách',
      user: req.session.user,
      organizations: orgs,
      stats: {
        totalOrgs,
        activeOrgs,
        totalWarriors
      },
      successMsg: req.session.successMsg,
      errorMsg: req.session.errorMsg
    });
  } catch (error) {
    console.error('[ADMIN RENDER ORGS ERROR]', error);
    return res.render('admin/views/organizations', {
      title: 'Quản Lý Đơn Vị & Cơ Sở Y Tế Phụ Trách',
      user: req.session.user,
      organizations: [],
      stats: { totalOrgs: 0, activeOrgs: 0, totalWarriors: 0 },
      errorMsg: 'Không thể tải danh sách đơn vị: ' + (error.message || 'Lỗi kết nối')
    });
  } finally {
    delete req.session.successMsg;
    delete req.session.errorMsg;
  }
};

/**
 * Thêm mới Đơn vị & Cơ sở Y tế động
 */
const handleCreateOrganization = async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'ADMIN' && req.session.user.role !== 'SUPER_ADMIN')) {
    return res.redirect('/auth/login');
  }

  try {
    const token = req.session.token;
    const payload = req.body;

    const response = await apiClient.post('/organizations', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    req.session.successMsg = response.message || 'Đã thêm mới cơ sở y tế thành công.';
  } catch (error) {
    console.error('[ADMIN CREATE ORG ERROR]', error);
    req.session.errorMsg = error.response?.data?.message || error.message || 'Lỗi thêm mới cơ sở y tế.';
  }

  return res.redirect('/admin/organizations');
};

/**
 * Vô hiệu hóa hoặc kích hoạt lại Đơn vị
 */
const handleToggleOrganizationStatus = async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'ADMIN' && req.session.user.role !== 'SUPER_ADMIN')) {
    return res.redirect('/auth/login');
  }

  try {
    const token = req.session.token;
    const { id } = req.params;

    const response = await apiClient.patch(`/organizations/${id}/status`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    req.session.successMsg = response.message || 'Đã cập nhật trạng thái đơn vị thành công.';
  } catch (error) {
    console.error('[ADMIN TOGGLE ORG ERROR]', error);
    req.session.errorMsg = error.response?.data?.message || error.message || 'Lỗi cập nhật trạng thái đơn vị.';
  }

  return res.redirect('/admin/organizations');
};

module.exports = {
  renderDashboard,
  renderUsers,
  handleCreateUser,
  handleToggleStatus,
  handleResetPassword,
  renderOrganizations,
  handleCreateOrganization,
  handleToggleOrganizationStatus
};
