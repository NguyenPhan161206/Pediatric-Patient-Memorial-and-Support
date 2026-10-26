/**
 * Migration mở rộng Multi-Tenancy và Phân quyền 6 cấp ORG_ADMIN
 * Bổ sung bảng organizations, mở rộng bảng users và children
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Tạo bảng organizations (Bệnh viện / Cơ sở điều trị / Quỹ thiện nguyện)
  await knex.schema.createTable('organizations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 200).notNullable();
    table.string('code', 50).notNullable().unique(); // VD: BV_NHI_TW, BV_K_TANTRIEU, QUY_NU_CUOI_EM
    table.string('logo_url', 500).nullable();
    table.string('bank_name', 150).notNullable();
    table.string('bank_code', 20).notNullable();
    table.string('bank_account_number', 50).notNullable();
    table.string('bank_account_name', 150).notNullable();
    table.string('contact_person', 150).nullable();
    table.string('phone', 20).nullable();
    table.string('email', 255).nullable();
    table.string('address', 300).nullable();
    table.string('province', 100).nullable();
    table.decimal('lat', 10, 7).nullable(); // Tọa độ hiển thị Bản đồ Hy vọng (Leaflet)
    table.decimal('lng', 10, 7).nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // 2. Mở rộng ENUM vai trò và bổ sung org_id cho bảng users
  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
  await knex.raw(`
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('MEMBER', 'COORDINATOR', 'FAMILY', 'ADMIN', 'ORG_ADMIN', 'SUPER_ADMIN'));
  `);

  await knex.schema.alterTable('users', (table) => {
    table.uuid('org_id').nullable().references('id').inTable('organizations').onDelete('SET NULL');
    table.index('org_id', 'idx_users_org_id');
  });

  // 3. Bổ sung organization_id cho bảng children
  await knex.schema.alterTable('children', (table) => {
    table.uuid('organization_id').nullable().references('id').inTable('organizations').onDelete('SET NULL');
    table.index('organization_id', 'idx_children_organization_id');
  });
};

/**
 * Rollback hạ cấp CSDL
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Gỡ bỏ khóa ngoại và cột trên children
  await knex.schema.alterTable('children', (table) => {
    table.dropIndex('organization_id', 'idx_children_organization_id');
    table.dropColumn('organization_id');
  });

  // Gỡ bỏ khóa ngoại và cột trên users
  await knex.schema.alterTable('users', (table) => {
    table.dropIndex('org_id', 'idx_users_org_id');
    table.dropColumn('org_id');
  });

  // Khôi phục ràng buộc vai trò ban đầu
  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
  await knex.raw(`
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('MEMBER', 'COORDINATOR', 'FAMILY', 'ADMIN'));
  `);

  // Xóa bảng organizations
  await knex.schema.dropTableIfExists('organizations');
};
