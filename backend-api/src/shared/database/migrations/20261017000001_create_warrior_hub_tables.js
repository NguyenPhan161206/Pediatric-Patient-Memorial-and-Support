/**
 * Migration tạo trọn bộ 8 bảng CSDL chuẩn 3NF và Full-Text Search cho Courageous Little Warriors Hub
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 0. Đảm bảo extension pgcrypto đã sẵn sàng (để sinh UUID tự động)
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  // 1. Bảng Users (5-Tier RBAC)
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('full_name', 150).notNullable();
    table.string('phone_number', 20).nullable();
    table.string('role', 50).defaultTo('MEMBER');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.raw(`
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('MEMBER', 'COORDINATOR', 'FAMILY', 'ADMIN'));
  `);

  // 2. Bảng Categories (Nhóm bệnh lý ung thư/hiểm nghèo)
  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('slug', 120).notNullable().unique();
    table.text('description').nullable();
  });

  // 3. Bảng Children (Hồ sơ chiến binh nhí)
  await knex.schema.createTable('children', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('full_name', 150).notNullable();
    table.string('nickname', 100).nullable();
    table.string('slug', 200).notNullable().unique();
    table.date('dob').nullable();
    table.string('hometown', 150).nullable();
    table.string('status', 50).defaultTo('FIGHTER');
    table.integer('category_id').references('id').inTable('categories').onDelete('SET NULL');
    table.string('dream_summary', 500).nullable();
    table.text('story_html').notNullable();
    table.string('avatar_url', 500).nullable();
    table.integer('candle_count').defaultTo(0);
    table.specificType('search_vector', 'tsvector').nullable();

    // Phân quyền sở hữu & kết nối gia đình
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('family_user_id').references('id').inTable('users').onDelete('SET NULL');

    // Thông tin Bảo trợ & VietQR Napas247 (Nghị định 93/2021/NĐ-CP)
    table.string('sponsorship_type', 30).defaultTo('HOSPITAL');
    table.string('hospital_patient_code', 100).nullable();
    table.string('bank_code', 20).nullable();
    table.string('bank_account_number', 50).nullable();
    table.string('bank_account_name', 150).nullable();
    table.boolean('bank_verified').defaultTo(false);

    // Trạng thái xuất bản & Quyền được quên (Right to be Forgotten - Soft Delete)
    table.boolean('is_published').defaultTo(false);
    table.timestamp('deleted_at', { useTz: true }).nullable().defaultTo(null);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.raw(`
    ALTER TABLE children ADD CONSTRAINT children_status_check 
    CHECK (status IN ('FIGHTER', 'ANGEL', 'URGENT', 'RECOVERED'));
    
    ALTER TABLE children ADD CONSTRAINT children_sponsorship_check 
    CHECK (sponsorship_type IN ('HOSPITAL', 'FAMILY_GUARDIAN'));
  `);

  // 4. Bảng Guardianship Consents (Minh chứng Giám hộ & Cam kết Pháp lý)
  await knex.schema.createTable('guardianship_consents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('child_id').notNullable().references('id').inTable('children').onDelete('CASCADE');
    table.uuid('guardian_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('document_proof_url', 500).notNullable();
    table.boolean('child_consent_verified').defaultTo(false);
    table.boolean('legal_terms_agreed').defaultTo(true);
    table.string('ip_address', 45).notNullable();
    table.timestamp('agreed_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 5. Bảng Gallery Items (Kỷ vật / Tranh vẽ / Ảnh sinh hoạt)
  await knex.schema.createTable('gallery_items', (table) => {
    table.increments('id').primary();
    table.uuid('child_id').notNullable().references('id').inTable('children').onDelete('CASCADE');
    table.string('media_url', 500).notNullable();
    table.string('media_type', 20).defaultTo('IMAGE');
    table.string('caption', 255).nullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.raw(`
    ALTER TABLE gallery_items ADD CONSTRAINT gallery_media_type_check 
    CHECK (media_type IN ('IMAGE', 'DRAWING', 'DOCUMENT'));
  `);

  // 6. Bảng Tributes (Lời nhắn tri ân & Bức tường hy vọng)
  await knex.schema.createTable('tributes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('child_id').notNullable().references('id').inTable('children').onDelete('CASCADE');
    table.string('sender_name', 100).notNullable();
    table.string('sender_email', 255).nullable();
    table.text('content').notNullable();
    table.string('status', 20).defaultTo('PENDING');
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.raw(`
    ALTER TABLE tributes ADD CONSTRAINT tributes_status_check 
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
  `);

  // 7. Bảng Audit Logs (Nhật ký kiểm toán hệ thống)
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('resource_type', 50).notNullable();
    table.uuid('resource_id').notNullable();
    table.jsonb('metadata').nullable();
    table.string('ip_address', 45).nullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 8. Bảng Session (Lưu trữ phiên làm việc tập trung cho connect-pg-simple)
  await knex.schema.createTable('session', (table) => {
    table.string('sid').primary();
    table.json('sess').notNullable();
    table.timestamp('expire', { precision: 6 }).notNullable();
  });
  await knex.raw('CREATE INDEX "IDX_session_expire" ON "session" ("expire");');

  // 9. Tự động cập nhật Full-Text Search Vector (PostgreSQL Trigger)
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_children_search_vector() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('simple', coalesce(NEW.full_name, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(NEW.nickname, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(NEW.hometown, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(NEW.dream_summary, '')), 'C');
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_children_search_vector
    BEFORE INSERT OR UPDATE OF full_name, nickname, hometown, dream_summary
    ON children
    FOR EACH ROW
    EXECUTE FUNCTION update_children_search_vector();
  `);

  // 10. Tối ưu hóa Chỉ mục (Indexes)
  await knex.raw('CREATE INDEX idx_children_search_vector ON children USING GIN(search_vector);');
  await knex.raw('CREATE INDEX idx_children_category ON children(category_id);');
  await knex.raw('CREATE INDEX idx_children_family_user ON children(family_user_id);');
  await knex.raw('CREATE INDEX idx_children_status_published ON children(status, is_published) WHERE deleted_at IS NULL;');
  await knex.raw('CREATE INDEX idx_tributes_child_status ON tributes(child_id, status);');
  await knex.raw('CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);');
};

/**
 * Rollback xóa toàn bộ các bảng và trigger
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_children_search_vector ON children;');
  await knex.raw('DROP FUNCTION IF EXISTS update_children_search_vector;');
  await knex.schema.dropTableIfExists('session');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('tributes');
  await knex.schema.dropTableIfExists('gallery_items');
  await knex.schema.dropTableIfExists('guardianship_consents');
  await knex.schema.dropTableIfExists('children');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('users');
};
