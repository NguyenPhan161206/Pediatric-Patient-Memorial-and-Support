const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('crypto');
const db = require('../../shared/database/knex');
const { logAudit } = require('../../shared/audit/auditLogger');

/**
 * Gửi minh chứng ủng hộ (Upload ảnh biên lai chuyển khoản Napas247 VietQR)
 */
const submitProof = async (req, res) => {
  try {
    const {
      child_id,
      donor_name,
      donor_email,
      donor_phone,
      amount,
      transfer_message,
      transaction_code,
      is_anonymous
    } = req.body;

    if (!child_id || !donor_name || !amount) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp đầy đủ: ID bé, tên người ủng hộ và số tiền.'
      });
    }

    const child = await db('children').where({ id: child_id }).first();
    if (!child) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ chiến binh nhí.'
      });
    }

    let proofImageUrl = null;
    if (req.file) {
      proofImageUrl = `/uploads/receipts/${req.file.filename}`;
    } else if (req.body.proof_image_url) {
      proofImageUrl = req.body.proof_image_url;
    }

    const [donation] = await db('donations_transactions').insert({
      child_id: child.id,
      organization_id: child.organization_id || null,
      donor_user_id: req.user ? req.user.id : null,
      transaction_code: transaction_code ? transaction_code.trim() : `TX-${Date.now().toString().slice(-8)}`,
      donor_name: donor_name.trim(),
      donor_email: donor_email ? donor_email.trim() : null,
      donor_phone: donor_phone ? donor_phone.trim() : null,
      amount: parseFloat(amount),
      transfer_message: transfer_message ? transfer_message.trim() : `ChienBinhNhi ${child.slug}`,
      payment_method: 'NAPAS247_VIETQR',
      proof_image_url: proofImageUrl,
      is_anonymous: is_anonymous === 'true' || is_anonymous === true,
      status: 'PENDING',
      verification_type: 'MANUAL_PROOF'
    }).returning('*');

    await logAudit({
      userId: req.user ? req.user.id : null,
      action: 'SUBMIT_DONATION_PROOF',
      resourceType: 'DONATIONS',
      resourceId: donation.id,
      metadata: { childId: child.id, amount: donation.amount },
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: 'Đã gửi minh chứng giao dịch thành công. Vui lòng chờ Bệnh viện/Gia đình đối soát và vinh danh.',
      data: donation
    });
  } catch (error) {
    console.error('[SUBMIT PROOF ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi gửi minh chứng giao dịch.'
    });
  }
};

/**
 * Cổng Ngân Hàng Mô Phỏng Sandbox (Mock Banking Gateway) - Dành cho Live Demo 1-Click
 */
const mockSandboxPay = async (req, res) => {
  try {
    const {
      child_id,
      donor_name,
      amount,
      donor_email,
      donor_phone,
      message,
      is_anonymous
    } = req.body;

    if (!child_id || !donor_name) {
      return res.status(400).json({
        status: 'fail',
        message: 'Thiếu thông tin bé hoặc tên người ủng hộ demo.'
      });
    }

    const child = await db('children as c')
      .leftJoin('organizations as org', 'c.organization_id', 'org.id')
      .where('c.id', child_id)
      .select('c.*', 'org.code as org_code', 'org.name as org_name')
      .first();

    if (!child) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ của bé.'
      });
    }

    const donationAmount = amount ? parseFloat(amount) : 200000;
    const orgCode = child.org_code || 'WARRIOR';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const certCode = `CERT-2026-${orgCode}-${randomSuffix}`;
    const qrToken = `qr-demo-${Date.now().toString(36)}-${randomSuffix}`;
    const mockTxCode = `SANDBOX-${Date.now().toString().slice(-6)}`;

    // Tạo mã QR xác thực offline
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const verifyUrl = `${protocol}://${host}/verify/cert/${qrToken}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    });

    const [donation] = await db('donations_transactions').insert({
      child_id: child.id,
      organization_id: child.organization_id || null,
      donor_user_id: req.user ? req.user.id : null,
      transaction_code: mockTxCode,
      donor_name: donor_name.trim(),
      donor_email: donor_email || 'demo.donor@sandbox.vn',
      donor_phone: donor_phone || '0901234567',
      amount: donationAmount,
      transfer_message: message || `ChienBinhNhi ${child.slug} (Sandbox Demo)`,
      payment_method: 'MOCK_SANDBOX',
      proof_image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600',
      is_anonymous: is_anonymous === 'true' || is_anonymous === true,
      status: 'VERIFIED',
      verification_type: 'MOCK_INSTANT',
      verified_by: req.user ? req.user.id : null,
      verified_at: new Date(),
      certificate_code: certCode,
      certificate_qr_token: qrToken,
      certificate_qr_data: qrDataUrl
    }).returning('*');

    await logAudit({
      userId: req.user ? req.user.id : null,
      action: 'MOCK_SANDBOX_DONATION',
      resourceType: 'DONATIONS',
      resourceId: donation.id,
      metadata: { childId: child.id, amount: donationAmount, certCode },
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: 'Mô phỏng thanh toán VietQR thành công! Đã cấp Chứng Nhận Tri Ân Số.',
      data: {
        donation,
        certificate: {
          code: certCode,
          qrToken,
          qrDataUrl,
          verifyUrl
        }
      }
    });
  } catch (error) {
    console.error('[MOCK SANDBOX ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi mô phỏng giao dịch Sandbox.'
    });
  }
};

/**
 * Lấy danh sách Bức Tường Vinh Danh của một bé (Chỉ các khoản VERIFIED)
 */
const getWallOfHonorByChild = async (req, res) => {
  try {
    const { slugOrId } = req.params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const child = await db('children')
      .where(function() {
        if (isUuid) {
          this.where({ id: slugOrId }).orWhere({ slug: slugOrId });
        } else {
          this.where({ slug: slugOrId });
        }
      })
      .first();

    if (!child) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ của bé.'
      });
    }

    const donations = await db('donations_transactions as dt')
      .leftJoin('organizations as org', 'dt.organization_id', 'org.id')
      .where({ 'dt.child_id': child.id, 'dt.status': 'VERIFIED' })
      .select(
        'dt.id',
        'dt.transaction_code',
        'dt.donor_name',
        'dt.amount',
        'dt.transfer_message',
        'dt.is_anonymous',
        'dt.certificate_code',
        'dt.certificate_qr_token',
        'dt.certificate_qr_data',
        'dt.verified_at',
        'dt.created_at',
        'org.name as organization_name'
      )
      .orderBy('dt.verified_at', 'desc');

    // Che tên nếu người ủng hộ chọn ẩn danh
    const sanitizedDonations = donations.map((d) => ({
      ...d,
      donor_name: d.is_anonymous ? 'Nhà Hảo Tâm Ẩn Danh' : d.donor_name
    }));

    // Tổng số tiền và lượt ủng hộ
    const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

    return res.status(200).json({
      status: 'success',
      data: {
        totalDonations: donations.length,
        totalAmount,
        donations: sanitizedDonations
      }
    });
  } catch (error) {
    console.error('[WALL OF HONOR ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tải danh sách Bức Tường Vinh Danh.'
    });
  }
};

/**
 * Lấy Bức Tường Vinh Danh Toàn Quốc (Toàn bộ khoản quyên góp VERIFIED trên cả nước)
 */
const getNationalWallOfHonor = async (req, res) => {
  try {
    const { organization_id, page = 1, limit = 30 } = req.query;

    let query = db('donations_transactions as dt')
      .join('children as c', 'dt.child_id', 'c.id')
      .leftJoin('organizations as org', 'dt.organization_id', 'org.id')
      .where('dt.status', 'VERIFIED');

    if (organization_id) {
      query = query.where('dt.organization_id', organization_id);
    }

    const totalRes = await db('donations_transactions')
      .where('status', 'VERIFIED')
      .select(
        db.raw('COUNT(*) as total_donations'),
        db.raw('COALESCE(SUM(amount), 0) as total_amount'),
        db.raw('COUNT(DISTINCT child_id) as total_children')
      )
      .first();

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const donations = await query
      .select(
        'dt.id',
        'dt.transaction_code',
        'dt.donor_name',
        'dt.amount',
        'dt.transfer_message',
        'dt.is_anonymous',
        'dt.certificate_code',
        'dt.certificate_qr_token',
        'dt.verified_at',
        'dt.created_at',
        'c.id as child_id',
        'c.full_name as child_name',
        'c.nickname as child_nickname',
        'c.slug as child_slug',
        'c.avatar_url as child_avatar_url',
        'org.id as org_id',
        'org.name as org_name',
        'org.province as org_province'
      )
      .orderBy('dt.verified_at', 'desc')
      .limit(parseInt(limit, 10))
      .offset(offset);

    const sanitizedDonations = donations.map((d) => ({
      ...d,
      donor_name: d.is_anonymous ? 'Nhà Hảo Tâm Ẩn Danh' : d.donor_name
    }));

    // Phân bổ theo bệnh viện
    const hospitalStats = await db('donations_transactions as dt')
      .join('organizations as org', 'dt.organization_id', 'org.id')
      .where('dt.status', 'VERIFIED')
      .groupBy('org.id', 'org.name', 'org.province')
      .select(
        'org.id',
        'org.name',
        'org.province',
        db.raw('COUNT(dt.id) as donation_count'),
        db.raw('COALESCE(SUM(dt.amount), 0) as total_amount')
      )
      .orderBy('total_amount', 'desc');

    return res.status(200).json({
      status: 'success',
      data: {
        totalAmount: parseFloat(totalRes.total_amount) || 0,
        totalDonations: parseInt(totalRes.total_donations, 10) || 0,
        totalChildrenSupported: parseInt(totalRes.total_children, 10) || 0,
        donations: sanitizedDonations,
        hospitalStats
      }
    });
  } catch (error) {
    console.error('[GET NATIONAL WALL ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tải Bức Tường Vinh Danh toàn quốc.'
    });
  }
};

/**
 * Lấy danh sách biên lai chờ duyệt (Dành cho ORG_ADMIN, FAMILY, SUPER_ADMIN)
 */
const getPendingDonations = async (req, res) => {
  try {
    const user = req.user;
    let query = db('donations_transactions as dt')
      .join('children as c', 'dt.child_id', 'c.id')
      .leftJoin('organizations as org', 'dt.organization_id', 'org.id')
      .where('dt.status', 'PENDING');

    // Phân quyền dữ liệu
    if (user.role === 'ORG_ADMIN') {
      query = query.andWhere('dt.organization_id', user.org_id);
    } else if (user.role === 'FAMILY') {
      query = query.andWhere('c.family_user_id', user.id);
    } else if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        status: 'fail',
        message: 'Bạn không có quyền truy cập danh sách xét duyệt.'
      });
    }

    const pendingList = await query
      .select(
        'dt.*',
        'c.full_name as child_name',
        'c.slug as child_slug',
        'c.avatar_url as child_avatar',
        'org.name as organization_name'
      )
      .orderBy('dt.created_at', 'desc');

    return res.status(200).json({
      status: 'success',
      data: {
        totalPending: pendingList.length,
        donations: pendingList
      }
    });
  } catch (error) {
    console.error('[GET PENDING ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tải danh sách biên lai chờ duyệt.'
    });
  }
};

/**
 * Phê duyệt biên lai và Cấp Chứng Nhận Tri Ân Số kèm Mã QR
 */
const verifyDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const donation = await db('donations_transactions as dt')
      .join('children as c', 'dt.child_id', 'c.id')
      .leftJoin('organizations as org', 'dt.organization_id', 'org.id')
      .where('dt.id', id)
      .select('dt.*', 'c.full_name as child_name', 'c.slug as child_slug', 'c.family_user_id', 'org.code as org_code', 'org.name as org_name')
      .first();

    if (!donation) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy giao dịch ủng hộ này.'
      });
    }

    // Kiểm tra quyền duyệt
    if (user.role === 'ORG_ADMIN' && donation.organization_id !== user.org_id) {
      return res.status(403).json({ status: 'fail', message: 'Bạn không có quyền duyệt giao dịch của bệnh viện khác.' });
    }
    if (user.role === 'FAMILY' && donation.family_user_id !== user.id) {
      return res.status(403).json({ status: 'fail', message: 'Bạn không có quyền duyệt giao dịch của bé khác.' });
    }

    // Sinh mã chứng nhận và QR token
    const orgCode = donation.org_code || 'WARRIOR';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const certCode = `CERT-2026-${orgCode}-${randomSuffix}`;
    const qrToken = `qr-${Date.now().toString(36)}-${randomSuffix}`;

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const verifyUrl = `${protocol}://${host}/verify/cert/${qrToken}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    });

    const [updated] = await db('donations_transactions')
      .where({ id })
      .update({
        status: 'VERIFIED',
        verified_by: user.id,
        verified_at: new Date(),
        certificate_code: certCode,
        certificate_qr_token: qrToken,
        certificate_qr_data: qrDataUrl,
        updated_at: new Date()
      })
      .returning('*');

    await logAudit({
      userId: user.id,
      action: 'VERIFY_DONATION_PROOF',
      resourceType: 'DONATIONS',
      resourceId: id,
      metadata: { certCode, amount: updated.amount, childName: donation.child_name },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Đã duyệt giao dịch thành công và cấp Chứng Nhận Tri Ân Số.',
      data: {
        donation: updated,
        certificate: {
          code: certCode,
          qrToken,
          qrDataUrl,
          verifyUrl
        }
      }
    });
  } catch (error) {
    console.error('[VERIFY DONATION ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi phê duyệt giao dịch.'
    });
  }
};

/**
 * Từ chối biên lai giả mạo/không hợp lệ
 */
const rejectDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    const donation = await db('donations_transactions as dt')
      .join('children as c', 'dt.child_id', 'c.id')
      .where('dt.id', id)
      .select('dt.*', 'c.family_user_id')
      .first();

    if (!donation) {
      return res.status(404).json({ status: 'fail', message: 'Không tìm thấy giao dịch.' });
    }

    if (user.role === 'ORG_ADMIN' && donation.organization_id !== user.org_id) {
      return res.status(403).json({ status: 'fail', message: 'Từ chối quyền hạn.' });
    }
    if (user.role === 'FAMILY' && donation.family_user_id !== user.id) {
      return res.status(403).json({ status: 'fail', message: 'Từ chối quyền hạn.' });
    }

    const [rejected] = await db('donations_transactions')
      .where({ id })
      .update({
        status: 'REJECTED',
        reject_reason: reason || 'Minh chứng không hợp lệ hoặc số dư chưa khớp.',
        verified_by: user.id,
        verified_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    await logAudit({
      userId: user.id,
      action: 'REJECT_DONATION_PROOF',
      resourceType: 'DONATIONS',
      resourceId: id,
      metadata: { reason },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Đã từ chối giao dịch.',
      data: rejected
    });
  } catch (error) {
    console.error('[REJECT DONATION ERROR]', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi từ chối giao dịch.' });
  }
};

/**
 * Xác thực công khai Chứng Nhận Tri Ân Số qua Mã QR
 */
const verifyCertificatePublic = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const queryTerm = (qrToken || '').trim();

    const donation = await db('donations_transactions as dt')
      .join('children as c', 'dt.child_id', 'c.id')
      .leftJoin('organizations as org', 'dt.organization_id', 'org.id')
      .leftJoin('users as u', 'dt.verified_by', 'u.id')
      .where('dt.status', 'VERIFIED')
      .andWhere(function() {
        this.where('dt.certificate_qr_token', queryTerm)
          .orWhere('dt.certificate_code', queryTerm)
          .orWhere('dt.transaction_code', queryTerm);
      })
      .select(
        'dt.id',
        'dt.certificate_code',
        'dt.certificate_qr_token',
        'dt.certificate_qr_data',
        'dt.transaction_code',
        'dt.donor_name',
        'dt.amount',
        'dt.transfer_message',
        'dt.is_anonymous',
        'dt.payment_method',
        'dt.verified_at',
        'c.full_name as child_name',
        'c.slug as child_slug',
        'c.avatar_url as child_avatar',
        'org.name as organization_name',
        'org.logo_url as organization_logo',
        'org.province as organization_province',
        'u.full_name as verifier_name'
      )
      .first();

    if (!donation) {
      return res.status(404).json({
        status: 'fail',
        isValid: false,
        message: 'Chứng nhận không tồn tại hoặc chưa được kích hoạt hợp lệ.'
      });
    }

    return res.status(200).json({
      status: 'success',
      isValid: true,
      message: 'Chứng Nhận Tri Ân Số Hợp Lệ theo Nghị định 93/2021/NĐ-CP.',
      data: {
        ...donation,
        donor_name: donation.is_anonymous ? 'Nhà Hảo Tâm Ẩn Danh' : donation.donor_name
      }
    });
  } catch (error) {
    console.error('[PUBLIC VERIFY CERT ERROR]', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi tra cứu chứng nhận.' });
  }
};

/**
 * Lấy danh sách các chứng nhận đã cấp gần đây nhất để phục vụ tra cứu
 */
const getRecentCertificates = async (req, res) => {
  try {
    const certificates = await db('donations_transactions as dt')
      .join('children as c', 'dt.child_id', 'c.id')
      .leftJoin('organizations as org', 'dt.organization_id', 'org.id')
      .where('dt.status', 'VERIFIED')
      .whereNotNull('dt.certificate_code')
      .select(
        'dt.id',
        'dt.certificate_code',
        'dt.certificate_qr_token',
        'dt.transaction_code',
        'dt.donor_name',
        'dt.amount',
        'dt.is_anonymous',
        'dt.verified_at',
        'c.full_name as child_name',
        'c.slug as child_slug',
        'c.avatar_url as child_avatar',
        'org.name as org_name'
      )
      .orderBy('dt.verified_at', 'desc')
      .limit(10);

    const sanitized = certificates.map(c => ({
      ...c,
      donor_name: c.is_anonymous ? 'Nhà Hảo Tâm Ẩn Danh' : c.donor_name
    }));

    return res.status(200).json({
      status: 'success',
      data: sanitized
    });
  } catch (error) {
    console.error('[GET RECENT CERTS ERROR]', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi tải danh sách chứng nhận.' });
  }
};

module.exports = {
  submitProof,
  mockSandboxPay,
  getWallOfHonorByChild,
  getNationalWallOfHonor,
  getPendingDonations,
  verifyDonation,
  rejectDonation,
  verifyCertificatePublic,
  getRecentCertificates
};
