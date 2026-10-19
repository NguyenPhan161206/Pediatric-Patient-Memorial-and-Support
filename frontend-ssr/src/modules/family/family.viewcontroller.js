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

    // Lấy danh sách điều ước và kỷ vật/đa phương tiện cho từng bé
    const childrenWithDetails = await Promise.all(
      myChildren.map(async (child) => {
        let wishes = [];
        let gallery = [];
        try {
          const [wishesRes, detailRes] = await Promise.all([
            apiClient.get(`/wishes/warrior/${child.slug || child.id}`).catch(() => ({ data: { wishes: [] } })),
            apiClient.get(`/warriors/${child.slug || child.id}`).catch(() => ({ data: { gallery: [] } }))
          ]);
          wishes = (wishesRes.data && wishesRes.data.wishes) || [];
          gallery = (detailRes.data && detailRes.data.gallery) || [];
        } catch (e) {
          // fallback
        }
        const warriorDetail = (detailRes.data && detailRes.data.warrior) || {};
        return { ...child, ...warriorDetail, wishes, gallery };
      })
    );

    const flashMessage = req.session.flashMessage || null;
    const errorMessage = req.session.errorMessage || null;
    delete req.session.flashMessage;
    delete req.session.errorMessage;

    res.render('family/views/portal', {
      title: 'Cổng Quản Lý Gia Đình',
      user,
      myChildren: childrenWithDetails,
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

/**
 * Thêm kỷ vật / Đa phương tiện vào kho kỷ niệm của bé (POST /family/gallery/add)
 */
const addMediaItem = async (req, res) => {
  if (!req.session.user || !req.session.token) {
    return res.redirect('/auth/login');
  }

  const { child_id, media_url, media_type, caption, base64Data } = req.body;

  try {
    await apiClient.post(
      `/warriors/${child_id}/gallery`,
      {
        media_url,
        media_type,
        caption,
        base64Data
      },
      {
        headers: { Authorization: `Bearer ${req.session.token}` }
      }
    );

    req.session.flashMessage = 'Đã thêm kỷ niệm mới vào kho lưu trữ của con thành công!';
  } catch (error) {
    console.error('[ADD MEDIA ERROR]', error);
    req.session.errorMessage = error.message || 'Lỗi khi lưu kỷ vật của bé.';
  }

  res.redirect('/family/portal');
};

/**
 * Xóa một kỷ vật khỏi kho lưu trữ (POST /family/gallery/:childId/:itemId/delete)
 */
const deleteMediaItem = async (req, res) => {
  if (!req.session.user || !req.session.token) {
    return res.redirect('/auth/login');
  }

  const { childId, itemId } = req.params;

  try {
    await apiClient.delete(
      `/warriors/${childId}/gallery/${itemId}`,
      {
        headers: { Authorization: `Bearer ${req.session.token}` }
      }
    );

    req.session.flashMessage = 'Đã xóa kỷ vật thành công.';
  } catch (error) {
    console.error('[DELETE MEDIA ERROR]', error);
    req.session.errorMessage = error.message || 'Lỗi khi xóa kỷ vật.';
  }

  res.redirect('/family/portal');
};

/**
 * Phụ huynh gửi tin nhắn thoại / lời nhắn ấm áp gửi con (POST /family/tributes/voice)
 */
const sendFamilyVoiceNote = async (req, res) => {
  if (!req.session.user || !req.session.token) {
    return res.redirect('/auth/login');
  }

  const { child_id, content, base64Audio, duration_seconds } = req.body;

  try {
    const parentName = req.session.user.displayName || req.session.user.fullName || 'Phụ huynh của bé';
    await apiClient.post(
      `/tributes/${child_id}/tributes`,
      {
        sender_name: parentName,
        sender_email: req.session.user.email,
        content: content || 'Lời ru và tâm sự yêu thương của cha mẹ gửi con',
        base64Audio,
        duration_seconds
      }
    );

    req.session.flashMessage = 'Đã lưu tin nhắn thoại yêu thương gửi con thành công!';
  } catch (error) {
    console.error('[FAMILY VOICE NOTE ERROR]', error);
    req.session.errorMessage = error.message || 'Lỗi khi gửi tin nhắn thoại.';
  }

  res.redirect('/family/portal');
};

/**
 * Cập nhật thông tin danh tính và cách xưng hô của phụ huynh
 */
const updateFamilyProfile = async (req, res) => {
  if (!req.session.user || !req.session.token) {
    return res.redirect('/auth/login');
  }

  const {
    last_name,
    middle_name,
    first_name,
    gender,
    title_prefix,
    family_relation,
    display_mode,
    phone_number
  } = req.body;

  try {
    const resProfile = await apiClient.patch(
      '/auth/profile',
      {
        last_name,
        middle_name,
        first_name,
        gender,
        title_prefix,
        family_relation,
        display_mode,
        phone_number
      },
      {
        headers: { Authorization: `Bearer ${req.session.token}` }
      }
    );

    if (resProfile.data && resProfile.data.data && resProfile.data.data.user) {
      req.session.user = {
        ...req.session.user,
        ...resProfile.data.data.user
      };
    }

    req.session.flashMessage = 'Đã cập nhật thông tin xưng hô và danh tính phụ huynh thành công!';
  } catch (error) {
    console.error('[UPDATE FAMILY PROFILE ERROR]', error);
    req.session.errorMessage = error.message || 'Lỗi khi cập nhật danh tính phụ huynh.';
  }

  res.redirect('/family/portal');
};

/**
 * Nộp thông tin / ảnh mã QR viện phí của gia đình để Bệnh viện thẩm định
 */
const submitFamilyBankQRAction = async (req, res) => {
  if (!req.session.user || !req.session.token) {
    return res.redirect('/auth/login');
  }

  const { id } = req.params;
  const { bank_code, bank_account_number, bank_account_name, qr_image_data, note } = req.body;

  try {
    const response = await apiClient.post(
      `/warriors/${id}/family-bank`,
      { bank_code, bank_account_number, bank_account_name, qr_image_data, note },
      {
        headers: { Authorization: `Bearer ${req.session.token}` }
      }
    );

    req.session.flashMessage = response.data?.message || 'Đã gửi thông tin tài khoản và mã QR của gia đình thành công. Đang chờ Bệnh viện thẩm định theo Nghị định 93/2021/NĐ-CP.';
  } catch (error) {
    console.error('[SUBMIT FAMILY BANK QR ERROR]', error);
    req.session.errorMessage = error.response?.data?.message || error.message || 'Lỗi khi gửi thông tin mã QR.';
  }

  res.redirect('/family/portal');
};

module.exports = {
  showPortal,
  unpublishChild,
  updateDiary,
  createChildWish,
  addMediaItem,
  deleteMediaItem,
  sendFamilyVoiceNote,
  updateFamilyProfile,
  submitFamilyBankQRAction
};
