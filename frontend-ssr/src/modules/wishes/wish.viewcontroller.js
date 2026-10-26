const apiClient = require('../../shared/utils/apiClient');

/**
 * Hiển thị trang danh mục Cây Điều Ước Toàn Quốc
 */
const renderWishesPage = async (req, res) => {
  try {
    const { category, status, organization_id, page = 1, sponsored } = req.query;

    const [wishesRes, orgsRes] = await Promise.all([
      apiClient.get('/wishes', {
        params: { category, status, organization_id, page, limit: 12 }
      }).catch(err => {
        console.error('[FRONTEND WISHES ERROR]', err);
        return { data: { wishes: [], stats: { total: 0, pending: 0, promised: 0, fulfilled: 0 }, totalWishes: 0 } };
      }),
      apiClient.get('/organizations').catch(() => ({ data: { organizations: [] } }))
    ]);

    const wishesData = wishesRes.data || { wishes: [], stats: {}, totalWishes: 0 };
    const organizations = orgsRes.data ? (orgsRes.data.organizations || []) : [];

    res.render('wishes/views/index', {
      title: 'Cây Điều Ước Trực Tuyến',
      description: 'Cùng chung tay thắp sáng những ước mơ bình dị của các chiến binh nhí',
      wishes: wishesData.wishes,
      stats: wishesData.stats,
      totalWishes: wishesData.totalWishes,
      organizations,
      currentCategory: category || '',
      currentStatus: status || '',
      currentOrgId: organization_id || '',
      sponsoredSuccess: sponsored === 'success',
      activeMenu: 'wishes'
    });
  } catch (error) {
    console.error('[RENDER WISHES PAGE ERROR]', error);
    res.status(500).render('wishes/views/index', {
      title: 'Cây Điều Ước Trực Tuyến',
      wishes: [],
      stats: { total: 0, pending: 0, promised: 0, fulfilled: 0 },
      organizations: [],
      errorMsg: 'Không thể tải danh sách điều ước. Vui lòng thử lại sau.'
    });
  }
};

/**
 * Xử lý nhận trao tặng điều ước
 */
const handleSponsorWish = async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsor_name, sponsor_phone, sponsor_message } = req.body;

    await apiClient.post(`/wishes/${id}/sponsor`, {
      sponsor_name,
      sponsor_phone,
      sponsor_message
    });

    return res.redirect('/wishes?sponsored=success');
  } catch (error) {
    console.error('[HANDLE SPONSOR WISH ERROR]', error);
    return res.redirect(`/wishes?error=${encodeURIComponent(error.message || 'Lỗi nhận trao điều ước')}`);
  }
};

module.exports = {
  renderWishesPage,
  handleSponsorWish
};
