const db = require('../../shared/database/knex');
const { logAudit } = require('../../shared/audit/auditLogger');

/**
 * Lấy thông tin tài khoản và Mã VietQR Napas247 của bé
 * Chỉ trả về thông tin đầy đủ và link ảnh VietQR khi bank_verified === TRUE
 */
const getVietQRInfo = async (req, res) => {
  try {
    const { childId } = req.params;

    const child = await db('children')
      .where({ id: childId })
      .whereNull('deleted_at')
      .first();

    if (!child) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ của chiến binh nhí này.'
      });
    }

    if (!child.bank_verified || !child.bank_code || !child.bank_account_number) {
      return res.status(200).json({
        status: 'success',
        data: {
          verified: false,
          message: 'Tài khoản bảo trợ chưa được thẩm định hoặc chưa khai báo thông tin theo Nghị định 93/2021/NĐ-CP.'
        }
      });
    }

    const bankCode = child.bank_code.trim();
    const accountNo = child.bank_account_number.trim();
    const accountName = encodeURIComponent(child.bank_account_name || '');
    const addInfo = encodeURIComponent(`ChienBinhNhi ${child.slug}`);

    const vietqrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=0&addInfo=${addInfo}&accountName=${accountName}`;

    let familyQR = null;
    if (child.family_bank_verified) {
      let familyVietqrUrl = null;
      if (child.family_bank_code && child.family_bank_account_number) {
        const fBankCode = child.family_bank_code.trim();
        const fAccountNo = child.family_bank_account_number.trim();
        const fAccountName = encodeURIComponent(child.family_bank_account_name || '');
        const fAddInfo = encodeURIComponent(`GiaDinh ${child.slug}`);
        familyVietqrUrl = `https://img.vietqr.io/image/${fBankCode}-${fAccountNo}-compact2.png?amount=0&addInfo=${fAddInfo}&accountName=${fAccountName}`;
      }
      familyQR = {
        verified: true,
        bankCode: child.family_bank_code,
        bankAccountNumber: child.family_bank_account_number,
        bankAccountName: child.family_bank_account_name,
        qrImageUrl: child.family_qr_image_url,
        vietqrUrl: familyVietqrUrl
      };
    }

    return res.status(200).json({
      status: 'success',
      data: {
        verified: true,
        sponsorshipType: child.sponsorship_type,
        hospitalPatientCode: child.hospital_patient_code,
        bankCode: child.bank_code,
        bankAccountNumber: child.bank_account_number,
        bankAccountName: child.bank_account_name,
        vietqrUrl,
        familyQR,
        disclaimer: 'Cổng Chiến Binh Nhí hoạt động phi lợi nhuận theo Nghị định 93/2021/NĐ-CP. Tiền ủng hộ được chuyển trực tiếp 100% đến người thụ hưởng. Nền tảng không thu phí và không giữ tiền trung gian.'
      }
    });
  } catch (error) {
    console.error('[VIETQR ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi lấy thông tin mã VietQR.'
    });
  }
};

/**
 * Thẩm định phê duyệt tài khoản ngân hàng (KYC Verification)
 * Chỉ Super Admin mới có quyền duyệt sau khi đối soát CCCD hoặc Giấy viện phí
 */
const verifySponsorshipBank = async (req, res) => {
  try {
    const { childId } = req.params;
    const { verified, note } = req.body;

    const isVerified = verified !== undefined ? Boolean(verified) : true;

    const child = await db('children').where({ id: childId }).first();
    if (!child) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ của bé.'
      });
    }

    await db('children').where({ id: childId }).update({
      bank_verified: isVerified,
      updated_at: db.fn.now()
    });

    await logAudit({
      userId: req.user.id,
      action: isVerified ? 'APPROVE_BANK_VERIFICATION' : 'REJECT_BANK_VERIFICATION',
      resourceType: 'CHILDREN',
      resourceId: childId,
      metadata: { note: note || 'Đối soát chứng từ ngân hàng hợp lệ theo NĐ 93/2021' },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: isVerified 
        ? 'Đã thẩm định và kích hoạt hiển thị mã VietQR thành công.'
        : 'Đã hủy kích hoạt hiển thị tài khoản ngân hàng của bé.',
      data: {
        childId,
        bankVerified: isVerified
      }
    });
  } catch (error) {
    console.error('[VERIFY BANK ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi thẩm định tài khoản ngân hàng.'
    });
  }
};

module.exports = {
  getVietQRInfo,
  verifySponsorshipBank
};
