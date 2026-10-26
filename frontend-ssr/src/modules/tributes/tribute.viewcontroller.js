const apiClient = require('../../shared/utils/apiClient');

/**
 * Hiển thị Bảng Kiểm Duyệt Lời Chúc (Pre-moderation Dashboard)
 */
const showModeration = async (req, res) => {
  if (!req.session.user) {
    req.session.returnTo = '/tributes/moderation';
    return res.redirect('/auth/login');
  }

  const { role } = req.session.user;
  if (role !== 'ADMIN' && role !== 'COORDINATOR' && role !== 'FAMILY') {
    return res.status(403).render('home/views/index', {
      title: 'Không Có Quyền Truy Cập',
      errorMsg: 'Bạn không có quyền truy cập bảng kiểm duyệt lời chúc.'
    });
  }

  try {
    const token = req.session.token;
    const response = await apiClient.get('/tributes/pending', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const pendingTributes = response.data || [];
    const flashMessage = req.session.flashMessage || null;
    const errorMessage = req.session.errorMessage || null;
    delete req.session.flashMessage;
    delete req.session.errorMessage;

    res.render('tributes/views/moderation', {
      title: 'Kiểm Duyệt Lời Chúc & Tri Ân',
      pendingTributes,
      flashMessage,
      errorMessage,
      userRole: role
    });
  } catch (error) {
    console.error('[TRIBUTE MODERATION ERROR]', error);
    res.render('tributes/views/moderation', {
      title: 'Kiểm Duyệt Lời Chúc & Tri Ân',
      pendingTributes: [],
      errorMessage: 'Không thể kết nối đến máy chủ lấy danh sách kiểm duyệt.'
    });
  }
};

/**
 * Phê duyệt lời chúc
 */
const approveTribute = async (req, res) => {
  if (!req.session.user || !req.session.token) {
    return res.redirect('/auth/login');
  }

  const { id } = req.params;

  try {
    await apiClient.patch(`/tributes/${id}/approve`, {}, {
      headers: { Authorization: `Bearer ${req.session.token}` }
    });

    req.session.flashMessage = 'Đã phê duyệt lời chúc thành công! Nội dung đã hiển thị công khai trên tường tri ân.';
  } catch (error) {
    console.error('[APPROVE ERROR]', error);
    req.session.errorMessage = error.message || 'Lỗi khi duyệt lời chúc.';
  }

  res.redirect('/tributes/moderation');
};

/**
 * Từ chối lời chúc
 */
const rejectTribute = async (req, res) => {
  if (!req.session.user || !req.session.token) {
    return res.redirect('/auth/login');
  }

  const { id } = req.params;

  try {
    await apiClient.patch(`/tributes/${id}/reject`, {}, {
      headers: { Authorization: `Bearer ${req.session.token}` }
    });

    req.session.flashMessage = 'Đã từ chối lời chúc thành công.';
  } catch (error) {
    console.error('[REJECT ERROR]', error);
    req.session.errorMessage = error.message || 'Lỗi khi từ chối lời chúc.';
  }

  res.redirect('/tributes/moderation');
};

module.exports = {
  showModeration,
  approveTribute,
  rejectTribute
};
