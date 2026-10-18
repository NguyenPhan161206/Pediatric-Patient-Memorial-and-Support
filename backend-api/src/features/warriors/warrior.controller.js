const db = require('../../shared/database/knex');
const { sanitizeContent } = require('../../shared/security/xssSanitizer');
const { logAudit } = require('../../shared/audit/auditLogger');

// Helper sinh slug tiếng Việt không dấu
const generateSlug = (text) => {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  return `${normalized}-${Date.now().toString().slice(-4)}`;
};

/**
 * Lấy danh sách Chiến binh nhí (Phân trang Server-side, Filter đa chiều, Full-Text Search)
 */
const getWarriors = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const offset = (page - 1) * limit;

    const { category, status, hometown, organization, q } = req.query;

    // Base query: Chỉ lấy hồ sơ chưa bị xóa mềm và đã được xuất bản
    let baseQuery = db('children as c')
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
      .leftJoin('organizations as org', 'c.organization_id', 'org.id')
      .whereNull('c.deleted_at')
      .andWhere('c.is_published', true);

    // Lọc theo trạng thái (FIGHTER, URGENT, RECOVERED, ANGEL)
    if (status) {
      baseQuery = baseQuery.andWhere('c.status', status.toUpperCase());
    }

    // Lọc theo danh mục bệnh lý (id hoặc slug)
    if (category) {
      baseQuery = baseQuery.andWhere(function() {
        this.where('cat.slug', category).orWhere('cat.id', isNaN(category) ? 0 : Number(category));
      });
    }

    // Lọc theo cơ sở Bệnh viện / Tổ chức (code hoặc id)
    if (organization) {
      baseQuery = baseQuery.andWhere(function() {
        this.where('org.code', organization.toUpperCase())
          .orWhere('org.id', isNaN(organization) && organization.includes('-') ? organization : null);
      });
    }

    // Lọc theo quê quán
    if (hometown) {
      baseQuery = baseQuery.andWhereILike('c.hometown', `%${hometown}%`);
    }

    // Tìm kiếm toàn văn Full-Text Search qua PostgreSQL tsvector
    if (q && q.trim()) {
      baseQuery = baseQuery.whereRaw(
        "c.search_vector @@ plainto_tsquery('simple', ?)",
        [q.trim()]
      );
    }

    // 1. Đếm tổng số bản ghi thỏa mãn điều kiện
    const countResult = await baseQuery.clone().count('c.id as total').first();
    const total = parseInt(countResult.total, 10) || 0;
    const totalPages = Math.ceil(total / limit);

    // 2. Lấy dữ liệu theo trang với thứ tự ưu tiên: URGENT lên đầu -> Mới nhất
    const warriors = await baseQuery
      .select(
        'c.id',
        'c.full_name',
        'c.nickname',
        'c.slug',
        'c.dob',
        'c.hometown',
        'c.status',
        'c.dream_summary',
        'c.avatar_url',
        'c.candle_count',
        'c.sponsorship_type',
        'c.bank_verified',
        'c.bank_code',
        'cat.name as category_name',
        'cat.slug as category_slug',
        'org.name as organization_name',
        'org.code as organization_code',
        'org.logo_url as organization_logo',
        'org.province as organization_province'
      )
      .orderByRaw("CASE WHEN c.status = 'URGENT' THEN 1 ELSE 2 END ASC")
      .orderBy('c.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return res.status(200).json({
      status: 'success',
      data: warriors,
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
    console.error('[GET WARRIORS ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tải danh sách chiến binh nhí.'
    });
  }
};

/**
 * Lấy chi tiết hồ sơ bé theo slug (kèm gallery, tributes đã duyệt và mã VietQR)
 */
const getWarriorBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const warrior = await db('children as c')
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
      .leftJoin('organizations as org', 'c.organization_id', 'org.id')
      .where('c.slug', slug)
      .whereNull('c.deleted_at')
      .select(
        'c.*',
        'cat.name as category_name',
        'cat.slug as category_slug',
        'org.name as organization_name',
        'org.code as organization_code',
        'org.logo_url as organization_logo',
        'org.bank_name as org_bank_name',
        'org.bank_code as org_bank_code',
        'org.bank_account_number as org_bank_account_number',
        'org.bank_account_name as org_bank_account_name',
        'org.province as organization_province'
      )
      .first();

    if (!warrior) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ của chiến binh nhí này hoặc hồ sơ đã được ẩn.'
      });
    }

    // Lấy danh sách tranh vẽ và kỷ vật
    const gallery = await db('gallery_items')
      .where({ child_id: warrior.id })
      .orderBy('created_at', 'desc');

    // Lấy danh sách lời chúc đã được duyệt
    const tributes = await db('tributes')
      .where({ child_id: warrior.id, status: 'APPROVED' })
      .orderBy('created_at', 'desc');

    // Sinh link mã VietQR: Ưu tiên tài khoản riêng của bé, nếu không lấy tài khoản chính thức của Viện
    let vietqrUrl = null;
    const finalBankCode = warrior.bank_code || warrior.org_bank_code;
    const finalAccountNo = warrior.bank_account_number || warrior.org_bank_account_number;
    const finalAccountName = warrior.bank_account_name || warrior.org_bank_account_name;

    if (finalBankCode && finalAccountNo) {
      const bankCode = finalBankCode.trim();
      const accountNo = finalAccountNo.trim();
      const accountName = encodeURIComponent(finalAccountName || '');
      const addInfo = encodeURIComponent(`ChienBinhNhi ${warrior.slug}`);
      vietqrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=0&addInfo=${addInfo}&accountName=${accountName}`;
    }

    return res.status(200).json({
      status: 'success',
      data: {
        warrior,
        gallery,
        tributes,
        vietqrUrl
      }
    });
  } catch (error) {
    console.error('[GET WARRIOR BY SLUG ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tải chi tiết hồ sơ bé.'
    });
  }
};

/**
 * Tạo mới hồ sơ Chiến binh nhí (Chỉ Admin hoặc Coordinator)
 */
const createWarrior = async (req, res) => {
  try {
    const {
      full_name,
      nickname,
      dob,
      hometown,
      status,
      category_id,
      dream_summary,
      story_html,
      avatar_url,
      sponsorship_type,
      hospital_patient_code,
      bank_code,
      bank_account_number,
      bank_account_name
    } = req.body;

    if (!full_name || !story_html) {
      return res.status(400).json({
        status: 'fail',
        message: 'Họ tên bé và nội dung câu chuyện là bắt buộc.'
      });
    }

    const slug = generateSlug(full_name);
    const cleanStory = sanitizeContent(story_html);

    const [newChild] = await db('children').insert({
      full_name: full_name.trim(),
      nickname: nickname ? nickname.trim() : null,
      slug,
      dob: dob || null,
      hometown: hometown ? hometown.trim() : null,
      status: status || 'FIGHTER',
      category_id: category_id || null,
      dream_summary: dream_summary ? dream_summary.trim() : null,
      story_html: cleanStory,
      avatar_url: avatar_url || null,
      sponsorship_type: sponsorship_type || 'HOSPITAL',
      hospital_patient_code: hospital_patient_code || null,
      bank_code: bank_code ? bank_code.toUpperCase().trim() : null,
      bank_account_number: bank_account_number ? bank_account_number.trim() : null,
      bank_account_name: bank_account_name ? bank_account_name.toUpperCase().trim() : null,
      bank_verified: false, // Mặc định chưa thẩm định
      is_published: true,   // Cho phép hiển thị nếu Admin/Coordinator tạo
      created_by: req.user.id,
      organization_id: req.user.org_id || req.body.organization_id || null
    }).returning('*');

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_WARRIOR',
      resourceType: 'CHILDREN',
      resourceId: newChild.id,
      metadata: { fullName: newChild.full_name },
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: 'Tạo hồ sơ chiến binh nhí thành công.',
      data: newChild
    });
  } catch (error) {
    console.error('[CREATE WARRIOR ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tạo mới hồ sơ bé.'
    });
  }
};

/**
 * Cập nhật thông tin hồ sơ (Chỉ Admin hoặc Gia đình sở hữu bé này)
 */
const updateWarrior = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nickname,
      dream_summary,
      story_html,
      avatar_url,
      bank_code,
      bank_account_number,
      bank_account_name
    } = req.body;

    const updateData = {
      updated_at: db.fn.now()
    };

    if (nickname !== undefined) updateData.nickname = nickname.trim();
    if (dream_summary !== undefined) updateData.dream_summary = dream_summary.trim();
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (story_html !== undefined) updateData.story_html = sanitizeContent(story_html);

    // Nếu thay đổi thông tin ngân hàng, bắt buộc cờ bank_verified = false để Admin thẩm định lại
    if (bank_account_number !== undefined || bank_code !== undefined) {
      if (bank_code) updateData.bank_code = bank_code.toUpperCase().trim();
      if (bank_account_number) updateData.bank_account_number = bank_account_number.trim();
      if (bank_account_name) updateData.bank_account_name = bank_account_name.toUpperCase().trim();
      updateData.bank_verified = false;
    }

    const [updatedChild] = await db('children')
      .where({ id })
      .update(updateData)
      .returning('*');

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_WARRIOR',
      resourceType: 'CHILDREN',
      resourceId: id,
      metadata: updateData,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật hồ sơ thành công.',
      data: updatedChild
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi cập nhật hồ sơ bé.'
    });
  }
};

/**
 * Quyền Rút/Ẩn Hồ Sơ Khẩn Cấp (Emergency Unpublish / Right to be Forgotten)
 * Dành cho Cha mẹ bệnh nhi hoặc Admin: Ẩn hồ sơ ngay lập tức khỏi public và tìm kiếm
 */
const unpublishWarrior = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const child = await db('children').where({ id }).first();
    if (!child) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ của bé.'
      });
    }

    // Chuyển is_published = false và đánh dấu deleted_at (Soft-delete)
    await db('children').where({ id }).update({
      is_published: false,
      deleted_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    await logAudit({
      userId: req.user.id,
      action: 'EMERGENCY_UNPUBLISH_CHILD',
      resourceType: 'CHILDREN',
      resourceId: id,
      metadata: { reason: reason || 'Gia đình yêu cầu bảo mật thông tin theo Luật Trẻ em 2016' },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Hồ sơ đã được ẩn an toàn khỏi hệ thống theo yêu cầu của gia đình.'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi ẩn hồ sơ bé.'
    });
  }
};

/**
 * Lấy danh sách tất cả các nhóm danh mục bệnh lý
 */
const getCategories = async (req, res) => {
  try {
    const categories = await db('categories').select('*').orderBy('id', 'asc');
    return res.status(200).json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tải danh mục.'
    });
  }
};

module.exports = {
  getWarriors,
  getWarriorBySlug,
  createWarrior,
  updateWarrior,
  unpublishWarrior,
  getCategories
};
