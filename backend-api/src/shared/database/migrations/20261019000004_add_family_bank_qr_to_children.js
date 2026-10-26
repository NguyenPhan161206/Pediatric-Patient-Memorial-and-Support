/**
 * Migration bổ sung trường tiếp nhận và phê duyệt mã QR/tài khoản viện phí của gia đình
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('children', (table) => {
    table.string('family_bank_code', 20).nullable();
    table.string('family_bank_account_number', 50).nullable();
    table.string('family_bank_account_name', 150).nullable();
    table.text('family_qr_image_url').nullable(); // Ảnh mã QR do phụ huynh tải lên
    table.boolean('family_bank_verified').defaultTo(false);
    table.timestamp('family_bank_submitted_at').nullable();
    table.timestamp('family_bank_verified_at').nullable();
    table.text('family_bank_reject_reason').nullable();
  });
};

/**
 * Rollback hạ cấp CSDL
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('children', (table) => {
    table.dropColumn('family_bank_reject_reason');
    table.dropColumn('family_bank_verified_at');
    table.dropColumn('family_bank_submitted_at');
    table.dropColumn('family_bank_verified');
    table.dropColumn('family_qr_image_url');
    table.dropColumn('family_bank_account_name');
    table.dropColumn('family_bank_account_number');
    table.dropColumn('family_bank_code');
  });
};
