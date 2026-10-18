const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../shared/database/knex');
const { JWT_SECRET } = require('../../shared/middlewares/authMiddleware');
const { logAudit } = require('../../shared/audit/auditLogger');
const { formatDisplayName, decomposeFullName } = require('../../shared/utils/nameFormatter');

/**
 * Đăng nhập người dùng (hỗ trợ tất cả 5 vai trò)
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp đầy đủ email và mật khẩu.'
      });
    }

    const user = await db('users').where({ email: email.toLowerCase().trim() }).first();

    if (!user || !user.is_active) {
      return res.status(401).json({
        status: 'fail',
        message: 'Email hoặc mật khẩu không chính xác, hoặc tài khoản đã bị vô hiệu hóa.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 'fail',
        message: 'Email hoặc mật khẩu không chính xác.'
      });
    }

    const displayName = formatDisplayName(user);

    // Ký JWT Token có hạn 7 ngày
    const tokenPayload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      lastName: user.last_name,
      middleName: user.middle_name,
      firstName: user.first_name,
      gender: user.gender,
      titlePrefix: user.title_prefix,
      familyRelation: user.family_relation,
      jobTitle: user.job_title,
      department: user.department,
      displayMode: user.display_mode,
      displayName,
      role: user.role,
      org_id: user.org_id || null
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Lấy thông tin tổ chức nếu tài khoản trực thuộc bệnh viện/quỹ
    let organization = null;
    if (user.org_id) {
      organization = await db('organizations')
        .where({ id: user.org_id })
        .select('id', 'name', 'code', 'logo_url', 'province')
        .first();
    }

    return res.status(200).json({
      status: 'success',
      message: 'Đăng nhập thành công.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          lastName: user.last_name,
          middleName: user.middle_name,
          firstName: user.first_name,
          gender: user.gender,
          titlePrefix: user.title_prefix,
          familyRelation: user.family_relation,
          jobTitle: user.job_title,
          department: user.department,
          displayMode: user.display_mode,
          displayName,
          phoneNumber: user.phone_number,
          role: user.role,
          org_id: user.org_id || null,
          organization
        }
      }
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi xử lý đăng nhập hệ thống.'
    });
  }
};

/**
 * Đăng ký tài khoản Thành viên cộng đồng (Role: MEMBER)
 */
const register = async (req, res) => {
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
      phone_number
    } = req.body;

    // Nếu gửi full_name gộp, tự động phân tách
    if ((!last_name || !first_name) && full_name) {
      const decomposed = decomposeFullName(full_name);
      last_name = last_name || decomposed.lastName;
      middle_name = middle_name || decomposed.middleName;
      first_name = first_name || decomposed.firstName;
      title_prefix = title_prefix || decomposed.titlePrefix;
      family_relation = family_relation || decomposed.familyRelation;
      job_title = job_title || decomposed.jobTitle;
    }

    if (!email || !password || !last_name || !first_name) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email, mật khẩu, họ và tên chính là các trường bắt buộc.'
      });
    }

    const computedFullName = [last_name.trim(), middle_name ? middle_name.trim() : null, first_name.trim()].filter(Boolean).join(' ');

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db('users').where({ email: normalizedEmail }).first();

    if (existing) {
      return res.status(409).json({
        status: 'fail',
        message: 'Email này đã được sử dụng trên hệ thống.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db('users').insert({
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: computedFullName,
      last_name: last_name.trim(),
      middle_name: middle_name ? middle_name.trim() : null,
      first_name: first_name.trim(),
      gender: gender || 'UNSPECIFIED',
      title_prefix: title_prefix ? title_prefix.trim() : null,
      family_relation: family_relation ? family_relation.trim() : null,
      job_title: job_title ? job_title.trim() : null,
      department: department ? department.trim() : null,
      include_prefix_in_display: !!include_prefix_in_display,
      include_title_in_display: include_title_in_display !== false,
      include_relation_in_display: include_relation_in_display !== false,
      display_mode: display_mode || 'FULL_NAME',
      phone_number: phone_number ? phone_number.trim() : null,
      role: 'MEMBER'
    }).returning('*');

    const displayName = formatDisplayName(newUser);

    const token = jwt.sign({
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.full_name,
      lastName: newUser.last_name,
      middleName: newUser.middle_name,
      firstName: newUser.first_name,
      gender: newUser.gender,
      titlePrefix: newUser.title_prefix,
      familyRelation: newUser.family_relation,
      jobTitle: newUser.job_title,
      department: newUser.department,
      displayMode: newUser.display_mode,
      displayName,
      role: newUser.role
    }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      status: 'success',
      message: 'Đăng ký tài khoản thành viên thành công.',
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          lastName: newUser.last_name,
          middleName: newUser.middle_name,
          firstName: newUser.first_name,
          gender: newUser.gender,
          titlePrefix: newUser.title_prefix,
          familyRelation: newUser.family_relation,
          jobTitle: newUser.job_title,
          department: newUser.department,
          displayMode: newUser.display_mode,
          displayName,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi đăng ký tài khoản.'
    });
  }
};

/**
 * Lấy thông tin tài khoản hiện tại từ Token
 */
const getMe = async (req, res) => {
  try {
    const user = await db('users')
      .where({ id: req.user.id })
      .select(
        'id', 'email', 'full_name', 'last_name', 'middle_name', 'first_name',
        'gender', 'title_prefix', 'family_relation', 'job_title', 'department',
        'include_prefix_in_display', 'include_title_in_display', 'include_relation_in_display',
        'display_mode', 'phone_number', 'role', 'org_id', 'created_at'
      )
      .first();

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy thông tin tài khoản.'
      });
    }

    const displayName = formatDisplayName(user);

    // Lấy thông tin tổ chức nếu có
    let organization = null;
    if (user.org_id) {
      organization = await db('organizations')
        .where({ id: user.org_id })
        .first();
    }

    // Nếu là vai trò FAMILY, lấy thêm danh sách các bé thuộc quyền quản lý của gia đình
    let myChildren = [];
    if (user.role === 'FAMILY') {
      myChildren = await db('children')
        .where({ family_user_id: user.id })
        .select('id', 'full_name', 'nickname', 'slug', 'status', 'is_published', 'candle_count');
    }

    // Nếu là vai trò ORG_ADMIN, lấy danh sách các bé thuộc bệnh viện quản lý
    let orgChildren = [];
    if (user.role === 'ORG_ADMIN' && user.org_id) {
      orgChildren = await db('children')
        .where({ organization_id: user.org_id })
        .whereNull('deleted_at')
        .select('id', 'full_name', 'nickname', 'slug', 'status', 'is_published', 'candle_count');
    }

    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          ...user,
          displayName,
          organization
        },
        myChildren,
        orgChildren
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi lấy thông tin cá nhân.'
    });
  }
};

/**
 * Cấp tài khoản đóng cho Hộ Gia Đình (Admin-Provisioned Account)
 * Chỉ Admin hoặc Coordinator mới có quyền thực hiện sau khi đã đối soát CCCD và Giấy khai sinh
 */
const provisionFamily = async (req, res) => {
  try {
    let { email, password, full_name, last_name, middle_name, first_name, gender, family_relation, display_mode, phone_number, child_id } = req.body;

    if ((!last_name || !first_name) && full_name) {
      const decomposed = decomposeFullName(full_name);
      last_name = last_name || decomposed.lastName;
      middle_name = middle_name || decomposed.middleName;
      first_name = first_name || decomposed.firstName;
      family_relation = family_relation || decomposed.familyRelation;
    }

    if (!email || !password || !last_name || !first_name || !child_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp đầy đủ email, mật khẩu, họ tên phụ huynh và mã hồ sơ bé (child_id).'
      });
    }

    const computedFullName = [last_name.trim(), middle_name ? middle_name.trim() : null, first_name.trim()].filter(Boolean).join(' ');

    const child = await db('children').where({ id: child_id }).first();
    if (!child) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ bé để gán tài khoản gia đình.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let familyUser = await db('users').where({ email: normalizedEmail }).first();

    if (!familyUser) {
      const passwordHash = await bcrypt.hash(password, 10);
      const [createdUser] = await db('users').insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        full_name: computedFullName,
        last_name: last_name.trim(),
        middle_name: middle_name ? middle_name.trim() : null,
        first_name: first_name.trim(),
        gender: gender || 'UNSPECIFIED',
        family_relation: family_relation ? family_relation.trim() : 'Người giám hộ',
        display_mode: display_mode || 'FULL_NAME',
        phone_number: phone_number ? phone_number.trim() : null,
        role: 'FAMILY'
      }).returning('*');
      familyUser = createdUser;
    } else {
      // Nếu user đã tồn tại, cập nhật role thành FAMILY và họ tên nếu có
      await db('users').where({ id: familyUser.id }).update({
        role: 'FAMILY',
        full_name: computedFullName,
        last_name: last_name.trim(),
        middle_name: middle_name ? middle_name.trim() : null,
        first_name: first_name.trim(),
        gender: gender || familyUser.gender || 'UNSPECIFIED',
        family_relation: family_relation ? family_relation.trim() : familyUser.family_relation || 'Người giám hộ',
        display_mode: display_mode || familyUser.display_mode || 'FULL_NAME'
      });
    }

    // Gán family_user_id vào hồ sơ của bé
    await db('children').where({ id: child_id }).update({
      family_user_id: familyUser.id,
      updated_at: db.fn.now()
    });

    // Ghi nhật ký kiểm toán
    await logAudit({
      userId: req.user.id,
      action: 'PROVISION_FAMILY_ACCOUNT',
      resourceType: 'USERS',
      resourceId: familyUser.id,
      metadata: { childId: child.id, childName: child.full_name },
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: `Đã cấp tài khoản Hộ Gia Đình cho bé ${child.full_name} thành công.`,
      data: {
        familyUser: {
          id: familyUser.id,
          email: familyUser.email,
          fullName: familyUser.full_name,
          role: 'FAMILY'
        },
        child: {
          id: child.id,
          fullName: child.full_name,
          slug: child.slug
        }
      }
    });
  } catch (error) {
    console.error('[PROVISION ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi cấp tài khoản gia đình.'
    });
  }
};

/**
 * Cập nhật thông tin hồ sơ danh tính và tùy chọn hiển thị cá nhân
 */
const updateProfile = async (req, res) => {
  try {
    const {
      last_name,
      middle_name,
      first_name,
      gender,
      title_prefix,
      family_relation,
      job_title,
      department,
      display_mode,
      include_prefix_in_display,
      include_title_in_display,
      include_relation_in_display,
      phone_number
    } = req.body;

    const existing = await db('users').where({ id: req.user.id }).first();
    if (!existing) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy thông tin tài khoản.'
      });
    }

    const updatedLastName = last_name !== undefined ? (last_name ? last_name.trim() : null) : existing.last_name;
    const updatedMiddleName = middle_name !== undefined ? (middle_name ? middle_name.trim() : null) : existing.middle_name;
    const updatedFirstName = first_name !== undefined ? (first_name ? first_name.trim() : null) : existing.first_name;

    const computedFullName = [updatedLastName, updatedMiddleName, updatedFirstName].filter(Boolean).join(' ');

    const updates = {
      full_name: computedFullName || existing.full_name,
      last_name: updatedLastName,
      middle_name: updatedMiddleName,
      first_name: updatedFirstName,
      gender: gender !== undefined ? gender : existing.gender,
      title_prefix: title_prefix !== undefined ? (title_prefix ? title_prefix.trim() : null) : existing.title_prefix,
      family_relation: family_relation !== undefined ? (family_relation ? family_relation.trim() : null) : existing.family_relation,
      job_title: job_title !== undefined ? (job_title ? job_title.trim() : null) : existing.job_title,
      department: department !== undefined ? (department ? department.trim() : null) : existing.department,
      display_mode: display_mode !== undefined ? display_mode : existing.display_mode,
      include_prefix_in_display: include_prefix_in_display !== undefined ? (include_prefix_in_display === true || include_prefix_in_display === 'true' || include_prefix_in_display === '1') : existing.include_prefix_in_display,
      include_title_in_display: include_title_in_display !== undefined ? (include_title_in_display === true || include_title_in_display === 'true' || include_title_in_display === '1') : existing.include_title_in_display,
      include_relation_in_display: include_relation_in_display !== undefined ? (include_relation_in_display === true || include_relation_in_display === 'true' || include_relation_in_display === '1') : existing.include_relation_in_display,
      phone_number: phone_number !== undefined ? (phone_number ? phone_number.trim() : null) : existing.phone_number
    };

    const [updatedUser] = await db('users').where({ id: req.user.id }).update(updates).returning('*');
    const displayName = formatDisplayName(updatedUser);

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật thông tin danh tính thành công.',
      data: {
        user: {
          ...updatedUser,
          displayName
        }
      }
    });
  } catch (error) {
    console.error('[UPDATE PROFILE ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi cập nhật hồ sơ cá nhân.'
    });
  }
};

module.exports = {
  login,
  register,
  getMe,
  provisionFamily,
  updateProfile
};
