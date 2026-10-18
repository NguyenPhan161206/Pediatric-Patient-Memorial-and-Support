const apiClient = require('../../shared/utils/apiClient');

/**
 * Hiển thị trang tra cứu & xem Chứng Nhận Tri Ân Số công khai (Quét qua Mã QR)
 */
const viewCertificate = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const response = await apiClient.get(`/donations/verify/${qrToken}`);

    // response từ backend có cấu trúc: { status: 'success', isValid: true, data: { ...certFields } }
    const isValid = response.isValid === true || (response.data && response.data.isValid === true);
    const certData = response.data || response;

    if (!isValid || !certData) {
      throw new Error('Chứng nhận không hợp lệ');
    }

    res.render('donations/views/certificate', {
      title: `Chứng Nhận Tri Ân | ${certData.donor_name}`,
      description: `Chứng nhận tri ân tấm lòng vàng của nhà hảo tâm ${certData.donor_name} dành cho bé ${certData.child_name}`,
      cert: certData,
      isValid: true
    });
  } catch (error) {
    console.error('[VIEW CERT ERROR]', error.message || error);
    res.status(404).render('donations/views/certificate', {
      title: 'Chứng Nhận Không Hợp Lệ',
      isValid: false,
      errorMsg: 'Mã chứng nhận không tồn tại hoặc chưa được kích hoạt hợp lệ trên hệ thống.'
    });
  }
};

/**
 * Màn hình xét duyệt biên lai minh chứng (Dành cho ORG_ADMIN, FAMILY, ADMIN)
 */
const viewModeration = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.redirect('/auth/login?redirect=/donations/moderation');
    }

    const token = req.session.token;
    const response = await apiClient.get('/donations/pending', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const donations = response.data ? response.data.donations : [];
    const totalPending = response.data ? response.data.totalPending : 0;

    res.render('donations/views/moderation', {
      title: 'Xét Duyệt Minh Chứng Giao Dịch',
      donations,
      totalPending,
      modSuccess: req.session.modSuccess || null,
      modError: req.session.modError || null
    });
    delete req.session.modSuccess;
    delete req.session.modError;
  } catch (error) {
    console.error('[VIEW MODERATION ERROR]', error);
    res.render('donations/views/moderation', {
      title: 'Xét Duyệt Minh Chứng Giao Dịch',
      donations: [],
      totalPending: 0,
      modError: 'Không thể tải danh sách biên lai chờ duyệt.'
    });
  }
};

/**
 * Nộp minh chứng giao dịch chuyển khoản VietQR Napas247 thật
 */
const submitProof = async (req, res) => {
  try {
    const { child_id, donor_name, donor_email, donor_phone, amount, transfer_message, proof_image_url, slug, is_anonymous } = req.body;

    await apiClient.post('/donations/submit-proof', {
      child_id,
      donor_name,
      donor_email,
      donor_phone,
      amount,
      transfer_message,
      proof_image_url,
      is_anonymous: Boolean(is_anonymous)
    });

    req.session.donationSuccess = 'Đã gửi minh chứng giao dịch thành công! Bệnh viện/Gia đình sẽ đối soát và hiển thị tên bạn lên Bức Tường Vinh Danh.';
    res.redirect(`/warriors/${slug}#wall-of-honor`);
  } catch (error) {
    console.error('[SUBMIT PROOF FRONTEND ERROR]', error);
    res.redirect(`/warriors/${req.body.slug || ''}`);
  }
};

/**
 * Mô phỏng chuyển khoản Sandbox 1-Click (Dành cho Live Demo)
 */
const mockSandboxPay = async (req, res) => {
  try {
    const { child_id, donor_name, amount, message, slug } = req.body;

    const response = await apiClient.post('/donations/mock-sandbox-pay', {
      child_id,
      donor_name,
      amount,
      message
    });

    const resData = response.data || response;
    const certCode = (resData.certificate && resData.certificate.code) || '';
    req.session.donationSuccess = `Thanh toán mô phỏng thành công! Đã cấp Chứng Nhận Tri Ân Số (${certCode}).`;
    res.redirect(`/warriors/${slug}#wall-of-honor`);
  } catch (error) {
    console.error('[MOCK SANDBOX FRONTEND ERROR]', error);
    res.redirect(`/warriors/${req.body.slug || ''}`);
  }
};

/**
 * Phê duyệt biên lai giao dịch
 */
const verifyDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.session.token;

    const response = await apiClient.patch(
      `/donations/${id}/verify`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const resData = response.data || response;
    const donorName = (resData.donation && resData.donation.donor_name) || 'Nhà hảo tâm';
    const certCode = (resData.certificate && resData.certificate.code) || '';

    req.session.modSuccess = `Đã duyệt thành công giao dịch của ${donorName} (${certCode})!`;
    res.redirect('/donations/moderation');
  } catch (error) {
    console.error('[VERIFY FRONTEND ERROR]', error);
    req.session.modError = 'Lỗi phê duyệt giao dịch.';
    res.redirect('/donations/moderation');
  }
};

/**
 * Từ chối biên lai giao dịch
 */
const rejectDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const token = req.session.token;

    await apiClient.patch(
      `/donations/${id}/reject`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    req.session.modSuccess = 'Đã từ chối biên lai giao dịch.';
    res.redirect('/donations/moderation');
  } catch (error) {
    console.error('[REJECT FRONTEND ERROR]', error);
    req.session.modError = 'Lỗi từ chối giao dịch.';
    res.redirect('/donations/moderation');
  }
};

/**
 * Nhà hảo tâm nhận trao tặng điều ước
 */
const sponsorWish = async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsor_name, sponsor_phone, sponsor_message, slug } = req.body;

    const response = await apiClient.post(`/wishes/${id}/sponsor`, {
      sponsor_name,
      sponsor_phone,
      sponsor_message
    });

    req.session.wishSuccess = response.message;
    res.redirect(`/warriors/${slug}#wishes`);
  } catch (error) {
    console.error('[SPONSOR WISH FRONTEND ERROR]', error);
    res.redirect(`/warriors/${req.body.slug || ''}`);
  }
};

/**
 * Hiển thị Bức Tường Vinh Danh Toàn Quốc
 */
const renderWallOfHonor = async (req, res) => {
  try {
    const { organization_id } = req.query;

    const [wallRes, orgsRes] = await Promise.all([
      apiClient.get('/donations/wall', {
        params: { organization_id }
      }).catch(err => {
        console.error('[WALL ERROR]', err);
        return { data: { totalAmount: 0, totalDonations: 0, totalChildrenSupported: 0, donations: [], hospitalStats: [] } };
      }),
      apiClient.get('/organizations').catch(() => ({ data: { organizations: [] } }))
    ]);

    const wallData = wallRes.data || { totalAmount: 0, totalDonations: 0, totalChildrenSupported: 0, donations: [], hospitalStats: [] };
    const organizations = orgsRes.data ? (orgsRes.data.organizations || []) : [];

    res.render('donations/views/wall', {
      title: 'Bức Tường Vinh Danh & Tri Ân Toàn Quốc',
      description: 'Vinh danh những tấm lòng vàng đã chung tay tiếp thêm hy vọng cho các chiến binh nhí',
      totalAmount: wallData.totalAmount,
      totalDonations: wallData.totalDonations,
      totalChildrenSupported: wallData.totalChildrenSupported,
      donations: wallData.donations,
      hospitalStats: wallData.hospitalStats,
      organizations,
      currentOrgId: organization_id || '',
      activeMenu: 'wall-of-honor'
    });
  } catch (error) {
    console.error('[RENDER WALL ERROR]', error);
    res.status(500).render('donations/views/wall', {
      title: 'Bức Tường Vinh Danh',
      totalAmount: 0,
      totalDonations: 0,
      totalChildrenSupported: 0,
      donations: [],
      hospitalStats: [],
      organizations: [],
      errorMsg: 'Không thể tải Bức Tường Vinh Danh. Vui lòng thử lại sau.'
    });
  }
};

module.exports = {
  viewCertificate,
  viewModeration,
  submitProof,
  mockSandboxPay,
  verifyDonation,
  rejectDonation,
  sponsorWish,
  renderWallOfHonor
};
