const db = require('../../shared/database/knex');
const { logAudit } = require('../../shared/audit/auditLogger');

/**
 * Lấy toàn bộ danh sách điều ước trên toàn quốc kèm filter theo category, status, organization_id
 */
const getAllWishes = async (req, res) => {
  try {
    const { category, status, organization_id, page = 1, limit = 20 } = req.query;

    let query = db('child_wishes as cw')
      .join('children as c', 'cw.child_id', 'c.id')
      .leftJoin('organizations as org', 'c.organization_id', 'org.id');

    if (category) {
      query = query.where('cw.category', category);
    }

    if (status) {
      query = query.where('cw.status', status);
    }

    if (organization_id) {
      query = query.where('c.organization_id', organization_id);
    }

    const totalCountRes = await query.clone().count('cw.id as count').first();
    const totalWishes = parseInt(totalCountRes.count, 10);

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const wishes = await query
      .select(
        'cw.id',
        'cw.title',
        'cw.description',
        'cw.category',
        'cw.estimated_cost',
        'cw.status',
        'cw.sponsor_name',
        'cw.sponsor_message',
        'cw.promised_at',
        'cw.fulfilled_at',
        'cw.created_at',
        'c.id as child_id',
        'c.full_name as child_name',
        'c.nickname as child_nickname',
        'c.slug as child_slug',
        'c.avatar_url as child_avatar_url',
        'c.hometown as child_hometown',
        'org.id as org_id',
        'org.name as org_name',
        'org.address as org_address'
      )
      .orderByRaw("CASE WHEN cw.status = 'PENDING' THEN 1 WHEN cw.status = 'PROMISED' THEN 2 ELSE 3 END ASC")
      .orderBy('cw.created_at', 'desc')
      .limit(parseInt(limit, 10))
      .offset(offset);

    // Thống kê tổng quan cây điều ước
    const stats = await db('child_wishes')
      .select(
        db.raw("COUNT(*) as total"),
        db.raw("COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count"),
        db.raw("COUNT(CASE WHEN status = 'PROMISED' THEN 1 END) as promised_count"),
        db.raw("COUNT(CASE WHEN status = 'FULFILLED' THEN 1 END) as fulfilled_count")
      )
      .first();

    return res.status(200).json({
      status: 'success',
      data: {
        totalWishes,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalWishes / parseInt(limit, 10)) || 1,
        stats: {
          total: parseInt(stats.total, 10) || 0,
          pending: parseInt(stats.pending_count, 10) || 0,
          promised: parseInt(stats.promised_count, 10) || 0,
          fulfilled: parseInt(stats.fulfilled_count, 10) || 0
        },
        wishes
      }
    });
  } catch (error) {
    console.error('[GET ALL WISHES ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tải danh mục điều ước.'
    });
  }
};

/**
 * Lấy danh sách điều ước của một chiến binh nhí
 */
const getWishesByWarrior = async (req, res) => {
  try {
    const { slugOrId } = req.params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    let childQuery = db('children as c')
      .leftJoin('organizations as org', 'c.organization_id', 'org.id');

    if (isUuid) {
      childQuery = childQuery.where(function() {
        this.where('c.id', slugOrId).orWhere('c.slug', slugOrId);
      });
    } else {
      childQuery = childQuery.where('c.slug', slugOrId);
    }

    const child = await childQuery
      .select('c.id', 'c.full_name', 'c.slug', 'org.name as org_name', 'org.address as org_address', 'org.contact_person as org_contact', 'org.phone as org_phone')
      .first();

    if (!child) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy hồ sơ của bé.'
      });
    }

    const wishes = await db('child_wishes')
      .where({ child_id: child.id })
      .orderByRaw("CASE WHEN status = 'PENDING' THEN 1 WHEN status = 'PROMISED' THEN 2 ELSE 3 END ASC")
      .orderBy('created_at', 'desc');

    return res.status(200).json({
      status: 'success',
      data: {
        warrior: child,
        totalWishes: wishes.length,
        wishes
      }
    });
  } catch (error) {
    console.error('[GET WISHES ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tải danh sách điều ước.'
    });
  }
};

/**
 * Đăng ký điều ước mới cho bé (Family, Coordinator, Admin)
 */
const createWish = async (req, res) => {
  try {
    const { child_id, title, description, category, estimated_cost } = req.body;

    if (!child_id || !title) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp ID bé và tên điều ước.'
      });
    }

    const [newWish] = await db('child_wishes').insert({
      child_id,
      title: title.trim(),
      description: description ? description.trim() : null,
      category: category || 'TOY',
      estimated_cost: estimated_cost ? parseFloat(estimated_cost) : null,
      status: 'PENDING'
    }).returning('*');

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_CHILD_WISH',
      resourceType: 'WISHES',
      resourceId: newWish.id,
      metadata: { childId: child_id, title },
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: 'Đã gửi điều ước của bé thành công.',
      data: newWish
    });
  } catch (error) {
    console.error('[CREATE WISH ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi tạo điều ước.'
    });
  }
};

/**
 * Nhà hảo tâm nhận trao tặng điều ước (Sponsor Wish)
 */
const sponsorWish = async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsor_name, sponsor_phone, sponsor_message } = req.body;

    if (!sponsor_name || !sponsor_phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng để lại họ tên và số điện thoại liên lạc để điều phối tiếp nhận quà.'
      });
    }

    const wish = await db('child_wishes as cw')
      .join('children as c', 'cw.child_id', 'c.id')
      .leftJoin('organizations as org', 'c.organization_id', 'org.id')
      .where('cw.id', id)
      .select('cw.*', 'c.full_name as child_name', 'org.name as org_name', 'org.address as org_address', 'org.contact_person', 'org.phone as org_phone')
      .first();

    if (!wish) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy điều ước này.'
      });
    }

    if (wish.status === 'FULFILLED') {
      return res.status(400).json({
        status: 'fail',
        message: 'Điều ước này đã được trao tặng hoàn tất trước đó.'
      });
    }

    const [updatedWish] = await db('child_wishes')
      .where({ id })
      .update({
        status: 'PROMISED',
        sponsor_name: sponsor_name.trim(),
        sponsor_phone: sponsor_phone.trim(),
        sponsor_message: sponsor_message ? sponsor_message.trim() : null,
        promised_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return res.status(200).json({
      status: 'success',
      message: `Cảm ơn bạn đã nhận trao điều ước "${wish.title}" cho bé ${wish.child_name}!`,
      data: {
        wish: updatedWish,
        deliveryGuide: {
          recipientOrg: wish.org_name || 'Phòng Công tác Xã hội Bệnh viện',
          address: wish.org_address || 'Liên hệ Điều phối viên viện',
          contactPerson: wish.contact_person || 'Ban Tiếp nhận Quà tặng',
          contactPhone: wish.org_phone || '02462738532',
          note: `Ghi chú ngoài gói bưu gửi: "Tặng điều ước bé ${wish.child_name} - Mã ước: ${wish.id.slice(0, 8)}"`
        }
      }
    });
  } catch (error) {
    console.error('[SPONSOR WISH ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi nhận trao điều ước.'
    });
  }
};

/**
 * Xác nhận quà đã trao tận tay bé (Fulfill Wish)
 */
const fulfillWish = async (req, res) => {
  try {
    const { id } = req.params;

    const [updatedWish] = await db('child_wishes')
      .where({ id })
      .update({
        status: 'FULFILLED',
        fulfilled_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    if (!updatedWish) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy điều ước.'
      });
    }

    await logAudit({
      userId: req.user.id,
      action: 'FULFILL_CHILD_WISH',
      resourceType: 'WISHES',
      resourceId: id,
      metadata: { title: updatedWish.title },
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Đã xác nhận trao tặng điều ước cho bé thành công!',
      data: updatedWish
    });
  } catch (error) {
    console.error('[FULFILL WISH ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi xác nhận hoàn thành điều ước.'
    });
  }
};

module.exports = {
  getAllWishes,
  getWishesByWarrior,
  createWish,
  sponsorWish,
  fulfillWish
};
