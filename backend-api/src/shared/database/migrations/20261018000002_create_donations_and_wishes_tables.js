/**
 * Migration tạo bảng donations_transactions và child_wishes
 * Phục vụ Bức tường vinh danh, Đối soát minh chứng sao kê theo NĐ 93/2021,
 * Cổng Sandbox mô phỏng thanh toán và Cây điều ước trực tuyến.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Bảng donations_transactions (Lưu vết giao dịch ủng hộ & Bức tường vinh danh)
  await knex.schema.createTable('donations_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('child_id').notNullable().references('id').inTable('children').onDelete('CASCADE');
    table.uuid('organization_id').nullable().references('id').inTable('organizations').onDelete('SET NULL');
    table.uuid('donor_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');

    // Thông tin tài chính & người ủng hộ
    table.string('transaction_code', 100).nullable().unique();
    table.string('donor_name', 150).notNullable();
    table.string('donor_email', 255).nullable();
    table.string('donor_phone', 20).nullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('transfer_message', 255).nullable();
    table.string('payment_method', 50).defaultTo('NAPAS247_VIETQR');
    table.string('proof_image_url', 500).nullable();
    table.boolean('is_anonymous').defaultTo(false);

    // Trạng thái & Cơ chế đối soát (Reconciliation)
    table.string('status', 20).defaultTo('PENDING');
    table.string('verification_type', 30).defaultTo('MANUAL_PROOF');
    table.uuid('verified_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('verified_at', { useTz: true }).nullable();
    table.string('reject_reason', 255).nullable();

    // Chứng nhận tri ân số & Mã QR tra cứu công khai
    table.string('certificate_code', 50).nullable().unique();
    table.string('certificate_qr_token', 100).nullable().unique();
    table.text('certificate_qr_data').nullable(); // Base64 DataURL của ảnh QR

    table.timestamps(true, true);
  });

  await knex.raw(`
    ALTER TABLE donations_transactions ADD CONSTRAINT chk_donation_status 
    CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED'));

    ALTER TABLE donations_transactions ADD CONSTRAINT chk_verification_type 
    CHECK (verification_type IN ('MANUAL_PROOF', 'MOCK_INSTANT', 'AUTO_WEBHOOK'));

    CREATE INDEX idx_donations_child ON donations_transactions(child_id);
    CREATE INDEX idx_donations_org ON donations_transactions(organization_id);
    CREATE INDEX idx_donations_status ON donations_transactions(status);
    CREATE INDEX idx_donations_qr_token ON donations_transactions(certificate_qr_token);
  `);

  // 2. Bảng child_wishes (Cây điều ước trực tuyến)
  await knex.schema.createTable('child_wishes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('child_id').notNullable().references('id').inTable('children').onDelete('CASCADE');
    table.string('title', 200).notNullable();
    table.text('description').nullable();
    table.string('category', 50).defaultTo('TOY');
    table.decimal('estimated_cost', 12, 2).nullable();
    table.string('status', 20).defaultTo('PENDING');

    // Thông tin nhà hảo tâm nhận trao điều ước
    table.string('sponsor_name', 150).nullable();
    table.string('sponsor_phone', 20).nullable();
    table.text('sponsor_message').nullable();
    table.timestamp('promised_at', { useTz: true }).nullable();
    table.timestamp('fulfilled_at', { useTz: true }).nullable();

    table.timestamps(true, true);
  });

  await knex.raw(`
    ALTER TABLE child_wishes ADD CONSTRAINT chk_wish_status 
    CHECK (status IN ('PENDING', 'PROMISED', 'FULFILLED'));

    ALTER TABLE child_wishes ADD CONSTRAINT chk_wish_category 
    CHECK (category IN ('TOY', 'BOOK', 'CLOTHES', 'EXPERIENCE', 'OTHER'));

    CREATE INDEX idx_wishes_child ON child_wishes(child_id);
    CREATE INDEX idx_wishes_status ON child_wishes(status);
  `);
};

/**
 * Rollback xóa bảng
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('child_wishes');
  await knex.schema.dropTableIfExists('donations_transactions');
};
