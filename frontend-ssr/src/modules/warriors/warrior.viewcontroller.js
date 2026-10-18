const apiClient = require('../../shared/utils/apiClient');

/**
 * Hiển thị danh sách Chiến binh nhí (Kèm Tìm kiếm FTS, Bộ lọc & Phân trang)
 */
const listWarriors = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 6;
    const { q, category, status, hometown, organization } = req.query;

    const [warriorsRes, categoriesRes, orgsRes] = await Promise.all([
      apiClient.get('/warriors', {
        params: { page, limit, q, category, status, hometown, organization }
      }),
      apiClient.get('/warriors/categories/all').catch(() => ({ data: [] })),
      apiClient.get('/organizations').catch(() => ({ data: { organizations: [] } }))
    ]);

    const warriors = warriorsRes.data || [];
    const pagination = warriorsRes.pagination || { total: 0, page: 1, totalPages: 1 };
    const categories = categoriesRes.data || [];
    const organizations = orgsRes.data ? (orgsRes.data.organizations || []) : [];

    // Tạo mảng số trang để render thanh pagination
    const pageNumbers = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pageNumbers.push({
        number: i,
        isCurrent: i === pagination.page
      });
    }

    res.render('warriors/views/list', {
      title: 'Danh Sách Chiến Binh Nhí',
      warriors,
      pagination,
      pageNumbers,
      categories,
      organizations,
      query: { q, category, status, hometown, organization }
    });
  } catch (error) {
    console.error('[FRONTEND LIST WARRIORS ERROR]', error);
    res.render('warriors/views/list', {
      title: 'Danh Sách Chiến Binh Nhí',
      warriors: [],
      categories: [],
      error: 'Không thể kết nối tới cơ sở dữ liệu.'
    });
  }
};

/**
 * Hiển thị chi tiết hồ sơ bé (Nhật ký, Gallery tranh vẽ, Nút thắp nến, Mã VietQR, Lời chúc)
 */
const warriorDetail = async (req, res) => {
  try {
    const { slug } = req.params;
    const response = await apiClient.get(`/warriors/${slug}`);

    const { warrior, gallery, tributes, vietqrUrl } = response.data;

    res.render('warriors/views/detail', {
      title: `${warrior.full_name} (${warrior.nickname || 'Chiến Binh Nhí'})`,
      description: warrior.dream_summary,
      ogImage: warrior.avatar_url,
      warrior,
      gallery,
      tributes,
      vietqrUrl,
      successMessage: req.session.tributeSuccess || null
    });
    delete req.session.tributeSuccess;
  } catch (error) {
    console.error('[FRONTEND WARRIOR DETAIL ERROR]', error);
    res.status(404).render('home/views/index', {
      title: 'Không Tìm Thấy Hồ Sơ',
      errorMsg: 'Không tìm thấy hồ sơ của chiến binh nhí này hoặc hồ sơ đã được ẩn.'
    });
  }
};

/**
 * Xử lý form gửi lời tri ân từ trang chi tiết
 */
const submitTribute = async (req, res) => {
  try {
    const { id } = req.params;
    const { sender_name, sender_email, content, slug } = req.body;

    await apiClient.post(`/tributes/${id}/tributes`, {
      sender_name,
      sender_email,
      content
    });

    req.session.tributeSuccess = 'Cảm ơn bạn! Lời nhắn tri ân đã được gửi và đang chờ kiểm duyệt trước khi hiển thị công khai.';
    res.redirect(`/warriors/${slug || ''}#tributes`);
  } catch (error) {
    console.error('[SUBMIT TRIBUTE ERROR]', error);
    res.redirect(`/warriors/${req.body.slug || ''}?error=true#tributes`);
  }
};

/**
 * API Proxy để client AJAX gọi thắp nến không bị vướng CORS
 */
const lightCandle = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await apiClient.post(`/tributes/${id}/candle`);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Không thể thắp nến lúc này' });
  }
};

module.exports = {
  listWarriors,
  warriorDetail,
  submitTribute,
  lightCandle
};
