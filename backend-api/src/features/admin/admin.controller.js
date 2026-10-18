const bcrypt = require('bcrypt');
const db = require('../../shared/database/knex');
const { logAudit } = require('../../shared/audit/auditLogger');
const { formatDisplayName, decomposeFullName } = require('../../shared/utils/nameFormatter');

/**
 * Lấy chỉ số tổng hợp toàn hệ thống cho Admin Dashboard
 */
const getDashboardMetrics = async (req, res) => {
  try {
    // 1. Thống kê người dùng theo Vai trò (Role) và Giới tính
    const usersByRole = await db('users')
      .select('role')
      .count('id as count')
      .groupBy('role');

    const usersByGender = await db('users')
      .select('gender')
      .count('id as count')
      .groupBy('gender');

    const totalUsersCount = await db('users').count('id as count').first();
    const totalUsers = parseInt(totalUsersCount.count, 10) || 0;

    // 2. Thống kê Chiến binh nhí theo Trạng thái (FIGHTER, URGENT, RECOVERED, ANGEL)
    const childrenByStatus = await db('children')
      .whereNull('deleted_at')
      .select('status')
      .count('id as count')
      .groupBy('status');

    const totalChildrenCount = await db('children').whereNull('deleted_at').count('id as count').first();
    const totalChildren = parseInt(totalChildrenCount.count, 10) || 0;

    // 3. Thống kê Dòng tiền minh bạch Zero-touch (Napas247)
    const donationsStats = await db('donations_transactions')
      .whereIn('status', ['VERIFIED', 'PAID_CONFIRMED'])
      .select(
        db.raw('COUNT(id) as total_tx'),
        db.raw('COALESCE(SUM(amount), 0) as total_amount')
      )
      .first();

    const totalDonatedAmount = parseFloat(donationsStats ? donationsStats.total_amount : 0) || 0;
    const totalDonatedTx = parseInt(donationsStats ? donationsStats.total_tx : 0, 10) || 0;

    // 4. Hàng đợi chờ duyệt (Pending Moderation Queue)
    const [pendingTributes, pendingDonations, pendingWishes] = await Promise.all([
      db('tributes').where({ status: 'PENDING' }).count('id as count').first(),
      db('donations_transactions').where({ status: 'PENDING' }).count('id as count').first(),
      db('child_wishes').where({ status: 'PENDING' }).count('id as count').first()
    ]);

    // 5. Phân bổ Bệnh nhi theo Bệnh viện / Tổ chức y tế
    const hospitalDistribution = await db('organizations as org')
      .leftJoin('children as c', function() {
        this.on('c.organization_id', '=', 'org.id').andOnNull('c.deleted_at');
      })
      .select(
        'org.id',
        'org.name',
        'org.code',
        'org.province',
        'org.bank_name',
        'org.bank_account_number'
      )
      .count('c.id as child_count')
      .groupBy('org.id', 'org.name', 'org.code', 'org.province', 'org.bank_name', 'org.bank_account_number')
      .orderBy('child_count', 'desc');

    // 6. Top 10 Nhật ký kiểm toán gần nhất (Audit Trail)
    const recentAuditLogs = await db('audit_logs as a')
      .leftJoin('users as u', 'a.user_id', 'u.id')
      .select(
        'a.id',
        'a.action',
        'a.resource_type',
        'a.resource_id',
        'a.metadata',
        'a.created_at',
        'u.email as actor_email',
        'u.full_name as actor_name',
        'u.role as actor_role'
      )
      .orderBy('a.created_at', 'desc')
      .limit(10);

    return res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          byRole: usersByRole.reduce((acc, r) => ({ ...acc, [r.role]: parseInt(r.count, 10) }), {}),
          byGender: usersByGender.reduce((acc, g) => ({ ...acc, [g.gender]: parseInt(g.count, 10) }), {})
        },
        children: {
          total: totalChildren,
          byStatus: childrenByStatus.reduce((acc, s) => ({ ...acc, [s.status]: parseInt(s.count, 10) }), {})
        },
        finances: {
          totalAmount: totalDonatedAmount,
          totalTransactions: totalDonatedTx
        },
        pendingQueues: {
          tributes: parseInt(pendingTributes.count, 10) || 0,
          donations: parseInt(pendingDonations.count, 10) || 0,
          wishes: parseInt(pendingWishes.count, 10) || 0
        },
        hospitalDistribution,
        recentAuditLogs
      }
    });
  } catch (error) {
    console.error('[ADMIN METRICS ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tải chỉ số tổng hợp quản trị.'
    });
  }
};

/**
 * Lấy danh sách người dùng phân trang kèm bộ lọc đa chiều
 */
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;

    const { role, org_id, gender, is_active, q } = req.query;

    let baseQuery = db('users as u')
      .leftJoin('organizations as org', 'u.org_id', 'org.id')
      .leftJoin('children as c', 'c.family_user_id', 'u.id');

    if (role) {
      baseQuery = baseQuery.where('u.role', role.toUpperCase());
    }

    if (org_id) {
      baseQuery = baseQuery.where('u.org_id', org_id);
    }

    if (gender) {
      baseQuery = baseQuery.where('u.gender', gender.toUpperCase());
    }

    if (is_active !== undefined && is_active !== '') {
      baseQuery = baseQuery.where('u.is_active', is_active === 'true' || is_active === true);
    }

    if (q && q.trim()) {
      const kw = `%${q.trim()}%`;
      baseQuery = baseQuery.where((builder) => {
        builder.whereILike('u.full_name', kw)
          .orWhereILike('u.email', kw)
          .orWhereILike('u.phone_number', kw)
          .orWhereILike('u.last_name', kw)
          .orWhereILike('u.first_name', kw)
          .orWhereILike('u.job_title', kw);
      });
    }

    const countResult = await baseQuery.clone().countDistinct('u.id as total').first();
    const total = parseInt(countResult.total, 10) || 0;
    const totalPages = Math.ceil(total / limit);

    const users = await baseQuery
      .select(
        'u.id',
        'u.email',
        'u.full_name',
        'u.last_name',
        'u.middle_name',
        'u.first_name',
        'u.gender',
        'u.title_prefix',
        'u.family_relation',
        'u.job_title',
        'u.department',
        'u.display_mode',
        'u.include_prefix_in_display',
        'u.include_title_in_display',
        'u.include_relation_in_display',
        'u.phone_number',
        'u.role',
        'u.is_active',
        'u.created_at',
        'u.org_id',
        'org.name as organization_name',
        'org.code as organization_code',
        'c.id as child_id',
        'c.full_name as child_name',
        'c.slug as child_slug'
      )
      .groupBy(
        'u.id', 'u.email', 'u.full_name', 'u.last_name', 'u.middle_name', 'u.first_name',
        'u.gender', 'u.title_prefix', 'u.family_relation', 'u.job_title', 'u.department',
        'u.display_mode', 'u.include_prefix_in_display', 'u.include_title_in_display',
        'u.include_relation_in_display', 'u.phone_number', 'u.role', 'u.is_active',
        'u.created_at', 'u.org_id', 'org.name', 'org.code', 'c.id', 'c.full_name', 'c.slug'
      )
      .orderBy('u.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Bổ sung displayName chuẩn hóa cho từng user
    const formattedUsers = users.map(u => ({
      ...u,
      displayName: formatDisplayName(u, {
        childName: u.child_name,
        orgName: u.organization_name
      }),
      legalFullName: [u.title_prefix, u.last_name, u.middle_name, u.first_name].filter(Boolean).join(' ') || u.full_name
    }));

    return res.status(200).json({
      status: 'success',
      data: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: totalPages > 0 ? totalPages : 1,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('[ADMIN GET USERS ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tải danh sách người dùng.'
    });
  }
};

/**
 * Cấp tài khoản và phân quyền người dùng mới (Role Provisioning)
 */
const provisionUser = async (req, res) => {
  try {
    let {
      email,
      password,
      full_name,
      last_name,
      middle_name,
      first_name,
      gender,
      title_prefix,
      family_relation,
      job_title,
      department,
      include_prefix_in_display,
      include_title_in_display,
      include_relation_in_display,
      display_mode,
      phone_number,
      role,
      org_id,
      child_id
    } = req.body;

    // Tự động phân tách nếu gửi full_name gộp
    if ((!last_name || !first_name) && full_name) {
      const decomposed = decomposeFullName(full_name);
      last_name = last_name || decomposed.lastName;
      middle_name = middle_name || decomposed.middleName;
      first_name = first_name || decomposed.firstName;
      title_prefix = title_prefix || decomposed.titlePrefix;
      family_relation = family_relation || decomposed.familyRelation;
      job_title = job_title || decomposed.jobTitle;
    }

    if (!email || !last_name || !first_name || !role) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email, Họ, Tên chính và Vai trò là các trường bắt buộc.'
      });
    }

    const validRoles = ['MEMBER', 'COORDINATOR', 'FAMILY', 'ADMIN', 'ORG_ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'fail',
        message: `Vai trò không hợp lệ: ${role}`
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db('users').where({ email: normalizedEmail }).first();
    if (existing) {
      return res.status(409).json({
        status: 'fail',
        message: 'Email này đã tồn tại trên hệ thống.'
      });
    }

    // Nếu không nhập mật khẩu, tự động dùng Password@2026
    const plainPassword = password && password.trim() ? password.trim() : 'Password@2026';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const computedFullName = [last_name.trim(), middle_name ? middle_name.trim() : null, first_name.trim()].filter(Boolean).join(' ');

    const [newUser] = await db('users').insert({
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: computedFullName,
      last_name: last_name.trim(),
      middle_name: middle_name ? middle_name.trim() : null,
      first_name: first_name.trim(),
      gender: gender || 'UNSPECIFIED',
      title_prefix: title_prefix ? title_prefix.trim() : null,
      family_relation: family_relation ? family_relation.trim() : (role === 'FAMILY' ? 'Người giám hộ' : null),
      job_title: job_title ? job_title.trim() : null,
      department: department ? department.trim() : null,
      include_prefix_in_display: !!include_prefix_in_display,
      include_title_in_display: include_title_in_display !== false,
      include_relation_in_display: include_relation_in_display !== false,
      display_mode: display_mode || 'FULL_NAME',
      phone_number: phone_number ? phone_number.trim() : null,
      role,
      org_id: (role === 'ORG_ADMIN' || role === 'COORDINATOR') ? (org_id || null) : null,
      is_active: true
    }).returning('*');

    // Nếu là vai trò FAMILY và có chọn bé, gán family_user_id vào hồ sơ của bé
    if (role === 'FAMILY' && child_id) {
      await db('children').where({ id: child_id }).update({
        family_user_id: newUser.id,
        updated_at: db.fn.now()
      });
    }

    // Ghi nhật ký kiểm toán
    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_PROVISION_USER',
      resourceType: 'USERS',
      resourceId: newUser.id,
      metadata: {
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.full_name,
        orgId: newUser.org_id,
        childId: child_id || null
      },
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: `Đã cấp tài khoản thành công cho ${newUser.full_name} (${newUser.role}).`,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          role: newUser.role,
          displayName: formatDisplayName(newUser)
        },
        initialPassword: plainPassword
      }
    });
  } catch (error) {
    console.error('[ADMIN PROVISION ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi cấp tài khoản người dùng.'
    });
  }
};

/**
 * Khóa hoặc Mở khóa tài khoản người dùng
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await db('users').where({ id }).first();

    if (!targetUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy người dùng.'
      });
    }

    // Không cho phép tự khóa chính mình
    if (targetUser.id === req.user.id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Bạn không thể vô hiệu hóa chính tài khoản của mình.'
      });
    }

    // Không cho phép Admin thường khóa Super Admin
    if (targetUser.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        status: 'fail',
        message: 'Chỉ Super Admin mới có quyền thao tác trên tài khoản Super Admin.'
      });
    }

    const newStatus = !targetUser.is_active;
    await db('users').where({ id }).update({ is_active: newStatus });

    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_TOGGLE_USER_STATUS',
      resourceType: 'USERS',
      resourceId: targetUser.id,
      metadata: { oldStatus: targetUser.is_active, newStatus, targetEmail: targetUser.email },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: `Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản ${targetUser.email} thành công.`,
      data: {
        id: targetUser.id,
        isActive: newStatus
      }
    });
  } catch (error) {
    console.error('[TOGGLE STATUS ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi cập nhật trạng thái tài khoản.'
    });
  }
};

/**
 * Đặt lại mật khẩu về mặc định Password@2026
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await db('users').where({ id }).first();

    if (!targetUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy người dùng.'
      });
    }

    if (targetUser.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        status: 'fail',
        message: 'Chỉ Super Admin mới có quyền đặt lại mật khẩu cho Super Admin.'
      });
    }

    const defaultPassword = 'Password@2026';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await db('users').where({ id }).update({ password_hash: passwordHash });

    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_RESET_PASSWORD',
      resourceType: 'USERS',
      resourceId: targetUser.id,
      metadata: { targetEmail: targetUser.email },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: `Đã đặt lại mật khẩu cho ${targetUser.email} về mặc định (${defaultPassword}).`,
      data: {
        id: targetUser.id,
        email: targetUser.email
      }
    });
  } catch (error) {
    console.error('[RESET PASSWORD ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi đặt lại mật khẩu.'
    });
  }
};

module.exports = {
  getDashboardMetrics,
  getUsers,
  provisionUser,
  toggleUserStatus,
  resetUserPassword
};
