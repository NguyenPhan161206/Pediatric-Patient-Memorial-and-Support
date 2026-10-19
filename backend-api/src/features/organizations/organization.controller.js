const bcrypt = require('bcrypt');
const db = require('../../shared/database/knex');
const { logAudit } = require('../../shared/audit/auditLogger');
const { formatDisplayName, decomposeFullName } = require('../../shared/utils/nameFormatter');

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

    // 4. Danh sách bệnh nhi thuộc viện kèm thông tin người nhà & mã QR viện phí
    const warriors = await db('children as c')
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
      .leftJoin('users as fu', 'c.family_user_id', 'fu.id')
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
        'c.family_user_id',
        'c.family_bank_code',
        'c.family_bank_account_number',
        'c.family_bank_account_name',
        'c.family_qr_image_url',
        'c.family_bank_verified',
        'c.family_bank_submitted_at',
        'c.family_bank_reject_reason',
        'fu.email as family_user_email',
        'fu.full_name as family_user_name',
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

/**
 * Thêm mới Bệnh viện / Cơ sở điều trị động (Chỉ dành cho ADMIN, SUPER_ADMIN)
 * Tùy chọn tạo ngay tài khoản ORG_ADMIN trong một transaction
 */
const createOrganization = async (req, res) => {
  const trx = await db.transaction();
  try {
    const {
      name,
      code,
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
      lng,
      // Thông tin Org Admin tùy chọn
      admin_email,
      admin_password,
      admin_full_name,
      admin_phone,
      admin_job_title,
      admin_department,
      admin_gender,
      admin_title_prefix
    } = req.body;

    if (!name || !bank_name || !bank_code || !bank_account_number || !bank_account_name) {
      await trx.rollback();
      return res.status(400).json({
        status: 'fail',
        message: 'Tên cơ sở, Tên ngân hàng, Mã ngân hàng, Số tài khoản và Tên chủ tài khoản là bắt buộc.'
      });
    }

    const orgCode = (code && code.trim())
      ? code.trim().toUpperCase()
      : name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().substring(0, 30);

    const existingCode = await trx('organizations').where({ code: orgCode }).first();
    if (existingCode) {
      await trx.rollback();
      return res.status(409).json({
        status: 'fail',
        message: `Mã cơ sở "${orgCode}" đã tồn tại trên hệ thống.`
      });
    }

    const [newOrg] = await trx('organizations').insert({
      name: name.trim(),
      code: orgCode,
      logo_url: logo_url || null,
      bank_name: bank_name.trim(),
      bank_code: bank_code.trim().toUpperCase(),
      bank_account_number: bank_account_number.trim(),
      bank_account_name: bank_account_name.trim().toUpperCase(),
      contact_person: contact_person ? contact_person.trim() : null,
      phone: phone ? phone.trim() : null,
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      province: province ? province.trim() : null,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      is_active: true
    }).returning('*');

    let createdAdmin = null;
    if (admin_email && admin_email.trim()) {
      const normalizedEmail = admin_email.trim().toLowerCase();
      const existingUser = await trx('users').where({ email: normalizedEmail }).first();
      if (existingUser) {
        await trx.rollback();
        return res.status(409).json({
          status: 'fail',
          message: `Email "${normalizedEmail}" đã được sử dụng bởi một tài khoản khác.`
        });
      }

      const rawFullName = admin_full_name && admin_full_name.trim() ? admin_full_name.trim() : 'Quản Trị Bệnh Viện';
      const decomposed = decomposeFullName(rawFullName);
      const defaultPassword = admin_password && admin_password.trim() ? admin_password.trim() : 'Password@2026';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      const [adminUser] = await trx('users').insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        full_name: rawFullName,
        last_name: decomposed.lastName || 'Admin',
        middle_name: decomposed.middleName || null,
        first_name: decomposed.firstName || orgCode,
        gender: admin_gender || 'UNSPECIFIED',
        title_prefix: admin_title_prefix || decomposed.titlePrefix || 'BS.',
        job_title: admin_job_title || 'Quản lý Đơn vị Y tế',
        department: admin_department || 'Ban Giám đốc',
        phone_number: admin_phone ? admin_phone.trim() : null,
        role: 'ORG_ADMIN',
        org_id: newOrg.id,
        is_active: true
      }).returning('*');

      createdAdmin = {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.full_name,
        role: adminUser.role
      };
    }

    await trx.commit();

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_ORGANIZATION',
      resourceType: 'ORGANIZATION',
      resourceId: newOrg.id,
      metadata: { name: newOrg.name, code: newOrg.code, hasAdmin: Boolean(createdAdmin) },
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: `Đã tạo cơ sở điều trị "${newOrg.name}" thành công.${createdAdmin ? ` Kèm tài khoản quản trị viện ${createdAdmin.email}.` : ''}`,
      data: {
        organization: newOrg,
        adminUser: createdAdmin
      }
    });
  } catch (error) {
    await trx.rollback();
    console.error('[CREATE ORG ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi thêm mới cơ sở y tế.'
    });
  }
};

/**
 * Vô hiệu hóa hoặc kích hoạt lại Bệnh viện / Cơ sở (Chỉ dành cho ADMIN, SUPER_ADMIN)
 */
const toggleOrganizationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const org = await db('organizations').where({ id }).first();
    if (!org) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy cơ sở y tế.'
      });
    }

    const newStatus = !org.is_active;
    await db('organizations').where({ id }).update({
      is_active: newStatus,
      updated_at: new Date()
    });

    await logAudit({
      userId: req.user.id,
      action: newStatus ? 'ACTIVATE_ORGANIZATION' : 'DEACTIVATE_ORGANIZATION',
      resourceType: 'ORGANIZATION',
      resourceId: id,
      metadata: { orgName: org.name, isActive: newStatus },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: `Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} cơ sở "${org.name}" thành công.`,
      data: { id, isActive: newStatus }
    });
  } catch (error) {
    console.error('[TOGGLE ORG STATUS ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi cập nhật trạng thái cơ sở.'
    });
  }
};

/**
 * Cấp tài khoản Hộ gia đình (FAMILY) cho một bệnh nhi thuộc Bệnh viện
 * Thao tác thuộc thẩm quyền của ORG_ADMIN thuộc viện đó
 */
const createFamilyAccountForChild = async (req, res) => {
  try {
    const {
      child_id,
      email,
      password,
      full_name,
      last_name,
      first_name,
      middle_name,
      gender,
      title_prefix,
      family_relation,
      phone_number
    } = req.body;

    if (!child_id || !email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Mã hồ sơ bé (child_id) và Email là bắt buộc.'
      });
    }

    // Kiểm tra bé có thuộc viện của ORG_ADMIN không
    const child = await db('children').where({ id: child_id }).first();
    if (!child) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ bệnh nhi.'
      });
    }

    if (req.user.role === 'ORG_ADMIN' && child.organization_id !== req.user.org_id) {
      return res.status(403).json({
        status: 'fail',
        message: 'Bạn chỉ có quyền cấp tài khoản gia đình cho các bệnh nhi điều trị tại đơn vị của mình.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let existingUser = await db('users').where({ email: normalizedEmail }).first();

    let familyUser = existingUser;
    if (!existingUser) {
      const rawFullName = full_name && full_name.trim() ? full_name.trim() : `${last_name || ''} ${first_name || ''}`.trim() || 'Phụ Huynh';
      const decomposed = decomposeFullName(rawFullName);
      const defaultPassword = password && password.trim() ? password.trim() : 'Password@2026';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      const [newUser] = await db('users').insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        full_name: rawFullName,
        last_name: (last_name && last_name.trim()) || decomposed.lastName || 'Gia Đình',
        middle_name: (middle_name && middle_name.trim()) || decomposed.middleName || null,
        first_name: (first_name && first_name.trim()) || decomposed.firstName || child.full_name,
        gender: gender || 'UNSPECIFIED',
        title_prefix: title_prefix || decomposed.titlePrefix || null,
        family_relation: family_relation ? family_relation.trim() : 'Bố/Mẹ',
        phone_number: phone_number ? phone_number.trim() : null,
        role: 'FAMILY',
        is_active: true
      }).returning('*');

      familyUser = newUser;
    }

    // Liên kết family_user_id vào hồ sơ bé
    await db('children').where({ id: child_id }).update({
      family_user_id: familyUser.id,
      updated_at: db.fn.now()
    });

    await logAudit({
      userId: req.user.id,
      action: 'ORG_PROVISION_FAMILY',
      resourceType: 'CHILDREN',
      resourceId: child_id,
      metadata: {
        familyUserId: familyUser.id,
        familyEmail: familyUser.email,
        childName: child.full_name
      },
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: `Đã cấp và liên kết tài khoản gia đình (${familyUser.email}) với bé ${child.full_name} thành công.`,
      data: {
        user: {
          id: familyUser.id,
          email: familyUser.email,
          fullName: familyUser.full_name,
          role: familyUser.role
        },
        childId: child.id
      }
    });
  } catch (error) {
    console.error('[PROVISION FAMILY ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi cấp tài khoản gia đình.'
    });
  }
};

module.exports = {
  getOrganizations,
  getOrganizationByIdOrCode,
  updateOrganization,
  getMyOrganizationPortal,
  createOrganization,
  toggleOrganizationStatus,
  createFamilyAccountForChild
};

