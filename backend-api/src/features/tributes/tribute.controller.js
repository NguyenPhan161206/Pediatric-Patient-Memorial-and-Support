const db = require('../../shared/database/knex');
const { sanitizeContent } = require('../../shared/security/xssSanitizer');
const { logAudit } = require('../../shared/audit/auditLogger');

/**
 * Thắp một ngọn nến hy vọng (Digital Candle)
 * Tăng biến đếm nguyên tử trong SQL
 */
const lightCandle = async (req, res) => {
  try {
    const { id } = req.params;

    const child = await db('children').where({ id }).whereNull('deleted_at').first();
    if (!child) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ của chiến binh nhí này.'
      });
    }

    // Tăng biến đếm nguyên tử
    await db('children').where({ id }).increment('candle_count', 1);

    const updated = await db('children').where({ id }).select('candle_count').first();

    return res.status(200).json({
      status: 'success',
      message: `Cảm ơn bạn đã thắp sáng một ngọn nến hy vọng cho bé ${child.full_name}!`,
      data: {
        childId: id,
        candleCount: updated.candle_count
      }
    });
  } catch (error) {
    console.error('[CANDLE ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi thắp nến hy vọng.'
    });
  }
};

/**
 * Gửi một lời nhắn tri ân / động viên (Mặc định trạng thái PENDING)
 */
const sendTribute = async (req, res) => {
  try {
    const { id } = req.params;
    const { sender_name, sender_email, content } = req.body;

    if (!sender_name || !content) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng nhập tên người gửi và nội dung lời chúc.'
      });
    }

    const child = await db('children').where({ id }).whereNull('deleted_at').first();
    if (!child) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ bé.'
      });
    }

    const cleanContent = sanitizeContent(content.trim());

    const [newTribute] = await db('tributes').insert({
      child_id: id,
      sender_name: sender_name.trim(),
      sender_email: sender_email ? sender_email.trim() : null,
      content: cleanContent,
      status: 'PENDING' // Bắt buộc qua kiểm duyệt theo Nghị định 147/2024
    }).returning('*');

    return res.status(201).json({
      status: 'success',
      message: 'Lời nhắn của bạn đã được gửi thành công và đang chờ kiểm duyệt trước khi hiển thị công khai.',
      data: {
        id: newTribute.id,
        status: newTribute.status,
        createdAt: newTribute.created_at
      }
    });
  } catch (error) {
    console.error('[TRIBUTE ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi gửi lời nhắn tri ân.'
    });
  }
};

/**
 * Lấy danh sách lời chúc chờ duyệt (Pending Tributes)
 * Admin xem toàn bộ, Gia đình chỉ xem lời chúc gửi tới con mình
 */
const getPendingTributes = async (req, res) => {
  try {
    const currentUser = req.user;

    let query = db('tributes as t')
      .join('children as c', 't.child_id', 'c.id')
      .where('t.status', 'PENDING')
      .select(
        't.id',
        't.sender_name',
        't.sender_email',
        't.content',
        't.status',
        't.created_at',
        'c.id as child_id',
        'c.full_name as child_name',
        'c.slug as child_slug',
        'c.family_user_id'
      )
      .orderBy('t.created_at', 'desc');

    if (currentUser.role === 'FAMILY') {
      // Chỉ xem lời chúc gửi tới bé của gia đình mình
      query = query.andWhere('c.family_user_id', currentUser.id);
    }

    const pendingList = await query;

    return res.status(200).json({
      status: 'success',
      data: pendingList
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tải danh sách kiểm duyệt.'
    });
  }
};

/**
 * Duyệt lời chúc (Phê duyệt công khai: APPROVED)
 */
const approveTribute = async (req, res) => {
  try {
    const { id } = req.params;

    const tribute = await db('tributes').where({ id }).first();
    if (!tribute) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy lời chúc này.'
      });
    }

    const [updated] = await db('tributes')
      .where({ id })
      .update({
        status: 'APPROVED',
        approved_by: req.user.id
      })
      .returning('*');

    await logAudit({
      userId: req.user.id,
      action: 'APPROVE_TRIBUTE',
      resourceType: 'TRIBUTES',
      resourceId: id,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Đã duyệt lời chúc thành công.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi phê duyệt lời chúc.'
    });
  }
};

/**
 * Từ chối lời chúc (REJECTED)
 */
const rejectTribute = async (req, res) => {
  try {
    const { id } = req.params;

    await db('tributes').where({ id }).update({
      status: 'REJECTED',
      approved_by: req.user.id
    });

    await logAudit({
      userId: req.user.id,
      action: 'REJECT_TRIBUTE',
      resourceType: 'TRIBUTES',
      resourceId: id,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Đã từ chối hiển thị lời chúc này.'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi từ chối lời chúc.'
    });
  }
};

module.exports = {
  lightCandle,
  sendTribute,
  getPendingTributes,
  approveTribute,
  rejectTribute
};
