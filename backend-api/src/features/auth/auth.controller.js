const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../shared/database/knex');
const { JWT_SECRET } = require('../../shared/middlewares/authMiddleware');
const { logAudit } = require('../../shared/audit/auditLogger');

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

    // Ký JWT Token có hạn 7 ngày
    const tokenPayload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      status: 'success',
      message: 'Đăng nhập thành công.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phoneNumber: user.phone_number,
          role: user.role
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
    const { email, password, full_name, phone_number } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email, mật khẩu và họ tên là các trường bắt buộc.'
      });
    }

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
      full_name: full_name.trim(),
      phone_number: phone_number ? phone_number.trim() : null,
      role: 'MEMBER'
    }).returning('*');

    const token = jwt.sign({
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.full_name,
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
      .select('id', 'email', 'full_name', 'phone_number', 'role', 'created_at')
      .first();

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy thông tin tài khoản.'
      });
    }

    // Nếu là vai trò FAMILY, lấy thêm danh sách các bé thuộc quyền quản lý của gia đình
    let myChildren = [];
    if (user.role === 'FAMILY') {
      myChildren = await db('children')
        .where({ family_user_id: user.id })
        .select('id', 'full_name', 'nickname', 'slug', 'status', 'is_published', 'candle_count');
    }

    return res.status(200).json({
      status: 'success',
      data: {
        user,
        myChildren
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
    const { email, password, full_name, phone_number, child_id } = req.body;

    if (!email || !password || !full_name || !child_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp đầy đủ email, mật khẩu, họ tên phụ huynh và mã hồ sơ bé (child_id).'
      });
    }

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
        full_name: full_name.trim(),
        phone_number: phone_number ? phone_number.trim() : null,
        role: 'FAMILY'
      }).returning('*');
      familyUser = createdUser;
    } else {
      // Nếu user đã tồn tại, cập nhật role thành FAMILY
      await db('users').where({ id: familyUser.id }).update({ role: 'FAMILY' });
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

module.exports = {
  login,
  register,
  getMe,
  provisionFamily
};
