const apiClient = require('../../shared/utils/apiClient');

/**
 * Hiển thị Cổng Gia Đình (Family Portal)
 */
const showPortal = async (req, res) => {
  if (!req.session.user) {
    req.session.returnTo = '/family/portal';
    return res.redirect('/auth/login');
  }

  const { role } = req.session.user;
  if (role !== 'FAMILY' && role !== 'ADMIN') {
    return res.status(403).render('home/views/index', {
      title: 'Không Có Quyền Truy Cập',
      errorMsg: 'Cổng này chỉ dành riêng cho Phụ huynh / Người giám hộ hợp pháp của chiến binh nhí.'
    });
  }

  try {
    const token = req.session.token;
    const response = await apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const user = response.data.user;
    let myChildren = response.data.myChildren || [];

    // Nếu là Admin, có thể xem danh sách tất cả các bé
    if (role === 'ADMIN' && myChildren.length === 0) {
      const allWarriorsRes = await apiClient.get('/warriors?limit=100');
      myChildren = (allWarriorsRes.data || []).map(w => ({
        id: w.id,
        full_name: w.full_name,
        nickname: w.nickname,
        slug: w.slug,
        status: w.status,
        is_published: true,
        candle_count: w.candle_count
      }));
    }

    // Lấy danh sách điều ước cho từng bé
    const childrenWithWishes = await Promise.all(
      myChildren.map(async (child) => {
        try {
          const wishesRes = await apiClient.get(`/wishes/warrior/${child.slug || child.id}`);
          const wishes = (wishesRes.data && wishesRes.data.wishes) || [];
          return { ...child, wishes };
        } catch (e) {
          return { ...child, wishes: [] };
        }
      })
    );

    const flashMessage = req.session.flashMessage || null;
    const errorMessage = req.session.errorMessage || null;
    delete req.session.flashMessage;
    delete req.session.errorMessage;

    res.render('family/views/portal', {
      title: 'Cổng Quản Lý Gia Đình',
      user,
      myChildren: childrenWithWishes,
      flashMessage,
      errorMessage
    });
  } catch (error) {
    console.error('[FAMILY PORTAL ERROR]', error);
    res.render('family/views/portal', {
      title: 'Cổng Quản Lý Gia Đình',
      myChildren: [],
      errorMessage: 'Không thể kết nối đến máy chủ xác thực.'
    });
  }
};

/**
 * Rút hồ sơ khẩn cấp (Emergency Unpublish / Quyền được quên)
 */
const unpublishChild = async (req, res) => {
  if (!req.session.user || !req.session.token) {
    return res.redirect('/auth/login');
  }

  const { id } = req.params;
  const { reason } = req.body;

  try {
    await apiClient.patch(`/warriors/${id}/unpublish`, { reason }, {
      headers: { Authorization: `Bearer ${req.session.token}` }
    });

    req.session.flashMessage = 'Đã rút và ẩn hồ sơ của bé thành công khỏi hệ thống công khai theo Luật Trẻ em 2016.';
  } catch (error) {
    console.error('[UNPUBLISH ERROR]', error);
    req.session.errorMessage = error.message || 'Lỗi khi rút hồ sơ bé.';
  }

  res.redirect('/family/portal');
};

/**
 * Cập nhật nhật ký điều trị / ước mơ của bé
 */
const updateDiary = async (req, res) => {
  if (!req.session.user || !req.session.token) {
    return res.redirect('/auth/login');
  }

  const { id } = req.params;
  const { nickname, dream_summary, story_html } = req.body;

  try {
    await apiClient.patch(`/warriors/${id}`, {
      nickname,
      dream_summary,
      story_html
    }, {
      headers: { Authorization: `Bearer ${req.session.token}` }
    });

    req.session.flashMessage = 'Đã cập nhật thông tin và nhật ký điều trị của bé thành công!';
  } catch (error) {
    console.error('[UPDATE DIARY ERROR]', error);
    req.session.errorMessage = error.message || 'Lỗi khi cập nhật hồ sơ.';
  }

  res.redirect('/family/portal');
};

/**
 * Đăng ký điều ước mới cho con (POST /family/wishes/create)
 */
const createChildWish = async (req, res) => {
  if (!req.session.user || !req.session.token) {
    return res.redirect('/auth/login');
  }

  const { child_id, title, description, category, estimated_cost } = req.body;

  try {
    await apiClient.post(
      '/wishes',
      {
        child_id,
        title,
        description,
        category,
        estimated_cost: estimated_cost ? parseFloat(estimated_cost) : null
      },
      {
        headers: { Authorization: `Bearer ${req.session.token}` }
      }
    );

    req.session.flashMessage = 'Đã đăng ký điều ước mới của bé thành công! Món quà ước mơ đã được kết nối lên Cây Điều Ước trực tuyến.';
  } catch (error) {
    console.error('[CREATE WISH ERROR]', error);
    req.session.errorMessage = error.message || 'Lỗi khi gửi điều ước của bé.';
  }

  res.redirect('/family/portal');
};

module.exports = {
  showPortal,
  unpublishChild,
  updateDiary,
  createChildWish
};
