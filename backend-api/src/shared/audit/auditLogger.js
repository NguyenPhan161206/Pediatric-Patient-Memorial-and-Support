const db = require('../database/knex');

/**
 * Ghi vết lịch sử kiểm toán tự động vào bảng audit_logs
 */
const logAudit = async ({ userId, action, resourceType, resourceId, metadata = {}, ipAddress = '127.0.0.1' }) => {
  try {
    await db('audit_logs').insert({
      user_id: userId || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: JSON.stringify(metadata),
      ip_address: ipAddress
    });
  } catch (error) {
    console.error('[AUDIT LOG ERROR]', error.message);
  }
};

module.exports = {
  logAudit
};
