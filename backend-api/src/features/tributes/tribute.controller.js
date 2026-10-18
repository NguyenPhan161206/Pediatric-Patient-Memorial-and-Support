const fs = require('fs');
const path = require('path');
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
 * Gửi một lời nhắn tri ân / động viên (kèm văn bản hoặc tin nhắn thoại / voice message)
 */
const sendTribute = async (req, res) => {
  try {
    const { id } = req.params;
    const { sender_name, sender_email, content, base64Audio, duration_seconds } = req.body;
    let audio_url = req.body.audio_url || null;

    if (!sender_name || (!content && !base64Audio && !audio_url)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng nhập tên người gửi và nội dung lời chúc hoặc thu âm lời nhắn.'
      });
    }

    const child = await db('children').where({ id }).whereNull('deleted_at').first();
    if (!child) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ bé.'
      });
    }

    // Xử lý lưu file âm thanh nếu gửi base64 data URL
    if (base64Audio) {
      const match = base64Audio.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (match) {
        const ext = match[1].includes('wav') ? 'wav' : (match[1].includes('mp3') ? 'mp3' : 'webm');
        const buffer = Buffer.from(match[2], 'base64');
        const uploadDir = path.join(__dirname, '../../../uploads/voice_notes');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        audio_url = `/uploads/voice_notes/${filename}`;
      }
    }

    const cleanContent = content ? sanitizeContent(content.trim()) : '🎙️ [Lời nhắn thoại được đính kèm]';

    const [newTribute] = await db('tributes').insert({
      child_id: id,
      sender_name: sender_name.trim(),
      sender_email: sender_email ? sender_email.trim() : null,
      content: cleanContent,
      audio_url,
      duration_seconds: duration_seconds ? parseInt(duration_seconds, 10) : null,
      status: 'PENDING' // Bắt buộc qua kiểm duyệt
    }).returning('*');

    return res.status(201).json({
      status: 'success',
      message: 'Lời nhắn của bạn đã được gửi thành công và đang chờ kiểm duyệt trước khi hiển thị công khai.',
      data: {
        id: newTribute.id,
        status: newTribute.status,
        audioUrl: newTribute.audio_url,
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
        't.audio_url',
        't.duration_seconds',
        't.status',
        't.created_at',
        'c.id as child_id',
        'c.full_name as child_name',
        'c.slug as child_slug',
        'c.family_user_id'
      )
      .orderBy('t.created_at', 'desc');

    if (currentUser.role === 'FAMILY') {
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
