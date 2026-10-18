const db = require('../../shared/database/knex');
const { logAudit } = require('../../shared/audit/auditLogger');
const { formatDisplayName } = require('../../shared/utils/nameFormatter');

/**
 * Lấy danh sách các Bệnh viện / Tổ chức (Hỗ trợ hiển thị Bản Đồ Hy Vọng và Bộ lọc)
 */
const getOrganizations = async (req, res) => {
  try {
    const organizations = await db('organizations as o')
      .leftJoin('children as c', function() {
        this.on('c.organization_id', '=', 'o.id')
          .andOn('c.is_published', '=', db.raw('true'))
          .andOnNull('c.deleted_at');
      })
      .where('o.is_active', true)
      .groupBy('o.id')
      .select(
        'o.id',
        'o.name',
        'o.code',
        'o.logo_url',
        'o.bank_name',
        'o.bank_code',
        'o.bank_account_number',
        'o.bank_account_name',
        'o.contact_person',
        'o.phone',
        'o.email',
        'o.address',
        'o.province',
        'o.lat',
        'o.lng',
        db.raw('COUNT(c.id)::int as warriors_count')
      )
      .orderBy('o.name', 'asc');

    return res.status(200).json({
      status: 'success',
      data: {
        total: organizations.length,
        organizations
      }
    });
  } catch (error) {
    console.error('[GET ORGANIZATIONS ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi lấy danh sách bệnh viện và tổ chức.'
    });
  }
};

/**
 * Lấy chi tiết một Bệnh viện / Tổ chức theo ID hoặc Code kèm danh sách bệnh nhi
 */
const getOrganizationByIdOrCode = async (req, res) => {
  try {
    const { identifier } = req.params;

    const org = await db('organizations')
      .where(function() {
        this.where({ id: isNaN(identifier) && identifier.includes('-') ? identifier : null })
          .orWhere({ code: identifier.toUpperCase() });
      })
      .first();

    if (!org) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy cơ sở y tế hoặc tổ chức này.'
      });
    }

    // Lấy danh sách chiến binh nhí đang điều trị tại cơ sở này
    const warriors = await db('children as c')
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
      .where({ 'c.organization_id': org.id, 'c.is_published': true })
      .whereNull('c.deleted_at')
      .select(
        'c.id',
        'c.full_name',
        'c.nickname',
        'c.slug',
        'c.status',
        'c.avatar_url',
        'c.hometown',
        'c.candle_count',
        'cat.name as category_name'
      )
      .orderBy('c.created_at', 'desc');

    return res.status(200).json({
      status: 'success',
      data: {
        organization: org,
        warriors
      }
    });
  } catch (error) {
    console.error('[GET ORG DETAIL ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi lấy thông tin chi tiết tổ chức.'
    });
  }
};

/**
 * Cập nhật thông tin Bệnh viện / Tổ chức (Chỉ dành cho ORG_ADMIN thuộc viện hoặc SUPER_ADMIN)
 */
const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      logo_url,
      bank_name,
      bank_code,
      bank_account_number,
      bank_account_name,
      contact_person,
      phone,
      email,
      address,
      province,
      lat,
      lng
    } = req.body;

    const existingOrg = await db('organizations').where({ id }).first();
    if (!existingOrg) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy tổ chức cần cập nhật.'
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (bank_name) updateData.bank_name = bank_name.trim();
    if (bank_code) updateData.bank_code = bank_code.trim().toUpperCase();
    if (bank_account_number) updateData.bank_account_number = bank_account_number.trim();
    if (bank_account_name) updateData.bank_account_name = bank_account_name.trim().toUpperCase();
    if (contact_person !== undefined) updateData.contact_person = contact_person;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (province !== undefined) updateData.province = province;
    if (lat !== undefined) updateData.lat = lat;
    if (lng !== undefined) updateData.lng = lng;
    updateData.updated_at = new Date();

    const [updatedOrg] = await db('organizations')
      .where({ id })
      .update(updateData)
      .returning('*');

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_ORGANIZATION',
      resourceType: 'ORGANIZATION',
      resourceId: id,
      metadata: updateData,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật thông tin cơ sở/tổ chức thành công.',
      data: { organization: updatedOrg }
    });
  } catch (error) {
    console.error('[UPDATE ORG ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi cập nhật thông tin tổ chức.'
    });
  }
};

/**
 * Lấy dữ liệu tổng hợp Dashboard dành riêng cho Bệnh viện (Dành cho ORG_ADMIN, ADMIN, SUPER_ADMIN)
 */
const getMyOrganizationPortal = async (req, res) => {
  try {
    let orgId = req.user.org_id;

    // Nếu là Admin/Super Admin và có truyền query org_id
    if ((!orgId || req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') && req.query.org_id) {
      orgId = req.query.org_id;
    }

    if (!orgId) {
      const firstOrg = await db('organizations').where('is_active', true).first();
      orgId = firstOrg ? firstOrg.id : null;
    }

    if (!orgId) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy cơ sở y tế tương ứng với tài khoản này.'
      });
    }

    const org = await db('organizations').where({ id: orgId }).first();
    if (!org) {
      return res.status(404).json({
        status: 'fail',
        message: 'Cơ sở y tế không tồn tại.'
      });
    }

    // 1. Thống kê số bệnh nhi
    const childrenCountRes = await db('children')
      .where({ organization_id: orgId })
      .whereNull('deleted_at')
      .count('id as count')
      .first();
    const totalChildren = parseInt(childrenCountRes.count, 10);

    // 2. Thống kê viện phí đã tiếp sức & số giao dịch
    const donationsStatsRes = await db('donations_transactions')
      .where({ organization_id: orgId, status: 'VERIFIED' })
      .select(
        db.raw('COUNT(*) as verified_count'),
        db.raw('COALESCE(SUM(amount), 0) as total_verified_amount')
      )
      .first();

    const pendingDonationsRes = await db('donations_transactions')
      .where({ organization_id: orgId, status: 'PENDING' })
      .count('id as count')
      .first();

    // 3. Thống kê điều ước
    const wishesStatsRes = await db('child_wishes as cw')
      .join('children as c', 'cw.child_id', 'c.id')
      .where({ 'c.organization_id': orgId })
      .select(
        db.raw('COUNT(cw.id) as total_wishes'),
        db.raw("COUNT(CASE WHEN cw.status = 'PENDING' THEN 1 END) as pending_wishes")
      )
      .first();

    // 4. Danh sách bệnh nhi thuộc viện
    const warriors = await db('children as c')
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
      .where({ 'c.organization_id': orgId })
      .whereNull('c.deleted_at')
      .select(
        'c.id',
        'c.full_name',
        'c.nickname',
        'c.slug',
        'c.status',
        'c.dob',
        'c.hometown',
        'c.avatar_url',
        'c.is_published',
        'c.candle_count',
        'c.created_at',
        'cat.name as category_name'
      )
      .orderBy('c.created_at', 'desc');

    // 5. Danh sách các giao dịch ủng hộ gần nhất của viện
    const recentDonations = await db('donations_transactions as dt')
      .join('children as c', 'dt.child_id', 'c.id')
      .where({ 'dt.organization_id': orgId })
      .select(
        'dt.id',
        'dt.transaction_code',
        'dt.donor_name',
        'dt.amount',
        'dt.status',
        'dt.certificate_code',
        'dt.certificate_qr_token',
        'dt.created_at',
        'dt.verified_at',
        'c.full_name as child_name',
        'c.slug as child_slug'
      )
      .orderBy('dt.created_at', 'desc')
      .limit(10);

    // 6. Danh sách cán bộ nhân viên y tế / điều phối viên thuộc viện
    const rawStaff = await db('users')
      .where({ org_id: orgId })
      .select(
        'id', 'full_name', 'last_name', 'middle_name', 'first_name',
        'gender', 'title_prefix', 'job_title', 'department', 'email',
        'phone_number', 'role', 'is_active', 'display_mode'
      )
      .orderBy('created_at', 'asc');

    const staff = rawStaff.map(s => ({
      ...s,
      displayName: formatDisplayName(s)
    }));

    return res.status(200).json({
      status: 'success',
      data: {
        organization: org,
        stats: {
          totalChildren,
          totalVerifiedAmount: parseFloat(donationsStatsRes.total_verified_amount) || 0,
          verifiedDonationCount: parseInt(donationsStatsRes.verified_count, 10) || 0,
          pendingDonationCount: parseInt(pendingDonationsRes.count, 10) || 0,
          totalWishes: parseInt(wishesStatsRes.total_wishes, 10) || 0,
          pendingWishes: parseInt(wishesStatsRes.pending_wishes, 10) || 0
        },
        warriors,
        recentDonations,
        staff
      }
    });
  } catch (error) {
    console.error('[GET ORG PORTAL ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tải trang tổng quan Bệnh viện.'
    });
  }
};

module.exports = {
  getOrganizations,
  getOrganizationByIdOrCode,
  updateOrganization,
  getMyOrganizationPortal
};
