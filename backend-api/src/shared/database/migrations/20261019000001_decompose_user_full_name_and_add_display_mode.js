/**
 * Migration phân tách cột full_name thành 3 thành tố:
 * - last_name (Họ)
 * - middle_name (Tên đệm / Tên lót)
 * - first_name (Tên chính)
 * Và bổ sung cấu hình quyền riêng tư hiển thị:
 * - display_mode ('FULL_NAME', 'HIDE_LAST_NAME', 'ABBREVIATED', 'FIRST_NAME_ONLY', 'ANONYMOUS')
 * 
 * Tuân thủ Nghị định 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân) & Luật Trẻ em 2016
 * Duy trì tính tương thích ngược 100% cho cột full_name.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Bổ sung các cột mới vào bảng users
  await knex.schema.alterTable('users', (table) => {
    table.string('last_name', 50).nullable();
    table.string('middle_name', 50).nullable();
    table.string('first_name', 50).nullable();
    table.string('display_mode', 30).defaultTo('FULL_NAME');
  });

  // 2. Thêm ràng buộc kiểm tra chế độ hiển thị
  await knex.raw(`
    ALTER TABLE users ADD CONSTRAINT users_display_mode_check 
    CHECK (display_mode IN ('FULL_NAME', 'HIDE_LAST_NAME', 'ABBREVIATED', 'FIRST_NAME_ONLY', 'ANONYMOUS'));
  `);

  // 3. Phân tách và backfill dữ liệu cho tất cả người dùng hiện hữu
  const users = await knex('users').select('id', 'full_name');
  for (const user of users) {
    const rawName = (user.full_name || '').trim();
    const parts = rawName.split(/\s+/).filter(Boolean);

    let lastName = '';
    let middleName = null;
    let firstName = '';

    if (parts.length === 0) {
      lastName = 'Người';
      firstName = 'Dùng';
    } else if (parts.length === 1) {
      lastName = parts[0];
      firstName = parts[0];
    } else if (parts.length === 2) {
      lastName = parts[0];
      firstName = parts[1];
    } else {
      lastName = parts[0];
      firstName = parts[parts.length - 1];
      middleName = parts.slice(1, -1).join(' ');
    }

    await knex('users')
      .where({ id: user.id })
      .update({
        last_name: lastName,
        middle_name: middleName,
        first_name: firstName,
        display_mode: 'FULL_NAME'
      });
  }

  // 4. Đặt NOT NULL cho last_name và first_name sau khi đã backfill
  await knex.raw(`
    ALTER TABLE users 
    ALTER COLUMN last_name SET NOT NULL,
    ALTER COLUMN first_name SET NOT NULL;
  `);
};

/**
 * Rollback hoàn tác migration
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_display_mode_check;');
  await knex.schema.alterTable('users', (table) => {
    table.dropColumns('last_name', 'middle_name', 'first_name', 'display_mode');
  });
};
