/**
 * Migration mở rộng toàn diện kiến trúc danh tính người dùng:
 * 1. gender: Giới tính ('MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED') - phục vụ tiền tố xưng hô Ông/Bà/Mr/Mrs
 * 2. title_prefix: Học vị, học hàm, danh xưng chuyên môn ('BS.', 'ThS.', 'TS.', 'PGS.TS.', ...)
 * 3. family_relation: Mối quan hệ với bé ('Bố', 'Mẹ', 'Ông', 'Bà', 'Người giám hộ'...)
 * 4. job_title: Chức vụ / Vị trí công tác ('Trưởng khoa Ung bướu', 'Điều phối viên', 'Quản trị viên')
 * 5. department: Khoa / Phòng ban tiếp quản ('Khoa Huyết học Ung bướu', 'Phòng Công tác Xã hội')
 * 6. Tùy chọn ẩn/hiện thành tố:
 *    - include_prefix_in_display (Ông/Bà/Mr/Mrs)
 *    - include_title_in_display (BS./ThS.)
 *    - include_relation_in_display (Mối quan hệ bé / Chức vụ viện)
 * 7. Làm sạch và phân bổ chính xác 11 tài khoản đã seed: tách rời chức vị/học vị khỏi tên thật.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Thêm các cột danh tính mới vào bảng users
  await knex.schema.alterTable('users', (table) => {
    table.string('gender', 15).defaultTo('UNSPECIFIED');
    table.string('title_prefix', 50).nullable();
    table.string('family_relation', 50).nullable();
    table.string('job_title', 100).nullable();
    table.string('department', 100).nullable();
    table.boolean('include_prefix_in_display').defaultTo(false);
    table.boolean('include_title_in_display').defaultTo(true);
    table.boolean('include_relation_in_display').defaultTo(true);
  });

  // Thêm ràng buộc kiểm tra giới tính
  await knex.raw(`
    ALTER TABLE users ADD CONSTRAINT users_gender_check 
    CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED'));
  `);

  // 2. Làm sạch và chuẩn hóa danh tính cho 11 tài khoản kiểm thử
  const accountUpdates = [
    {
      email: 'superadmin@warrior.org',
      gender: 'MALE',
      title_prefix: null,
      last_name: 'Đặng',
      middle_name: 'Quốc',
      first_name: 'Anh',
      job_title: 'Tổng Quản Trị Hệ Thống',
      department: 'Ban Điều Hành Trung Tâm',
      family_relation: null,
      full_name: 'Đặng Quốc Anh'
    },
    {
      email: 'admin@warrior.org',
      gender: 'MALE',
      title_prefix: null,
      last_name: 'Nguyễn',
      middle_name: 'Văn',
      first_name: 'Trị',
      job_title: 'Quản Trị Viên Vận Hành',
      department: 'Ban Vận Hành & Hỗ Trợ',
      family_relation: null,
      full_name: 'Nguyễn Văn Trị'
    },
    {
      email: 'coordinator@warrior.org',
      gender: 'FEMALE',
      title_prefix: 'CN.',
      last_name: 'Trần',
      middle_name: 'Thị Thu',
      first_name: 'Hà',
      job_title: 'Điều Phối Viên Mạng Lưới',
      department: 'Tổ Công Tác Xã Hội BV Nhi TW',
      family_relation: null,
      full_name: 'Trần Thị Thu Hà'
    },
    {
      email: 'orgadmin.nhi@warriorhub.vn',
      gender: 'MALE',
      title_prefix: 'BS.',
      last_name: 'Lê',
      middle_name: 'Minh',
      first_name: 'Hoàng',
      job_title: 'Bác Sĩ Điều Trị & Quản Trị Đơn Vị',
      department: 'Trung Tâm Ung Thư Trẻ Em',
      family_relation: null,
      full_name: 'Lê Minh Hoàng'
    },
    {
      email: 'orgadmin.k@warriorhub.vn',
      gender: 'FEMALE',
      title_prefix: 'ThS.',
      last_name: 'Nguyễn',
      middle_name: 'Thị',
      first_name: 'Mai',
      job_title: 'Quản Trị Viên Đơn Vị Y Tế',
      department: 'Cơ Sở Tân Triều',
      family_relation: null,
      full_name: 'Nguyễn Thị Mai'
    },
    {
      email: 'orgadmin.nucuoiem@warriorhub.vn',
      gender: 'FEMALE',
      title_prefix: null,
      last_name: 'Đặng',
      middle_name: 'Thùy',
      first_name: 'Dương',
      job_title: 'Giám Đốc Quỹ & Điều Phối',
      department: 'Ban Dự Án Thiện Nguyện',
      family_relation: null,
      full_name: 'Đặng Thùy Dương'
    },
    {
      email: 'family.minhan@gmail.com',
      gender: 'FEMALE',
      title_prefix: null,
      last_name: 'Nguyễn',
      middle_name: 'Thị',
      first_name: 'Lan',
      job_title: null,
      department: null,
      family_relation: 'Mẹ',
      full_name: 'Nguyễn Thị Lan'
    },
    {
      email: 'family.maichi@gmail.com',
      gender: 'MALE',
      title_prefix: null,
      last_name: 'Lê',
      middle_name: 'Văn',
      first_name: 'Hải',
      job_title: null,
      department: null,
      family_relation: 'Bố',
      full_name: 'Lê Văn Hải'
    },
    {
      email: 'family.tuankiet@gmail.com',
      gender: 'MALE',
      title_prefix: null,
      last_name: 'Trần',
      middle_name: 'Văn',
      first_name: 'Đức',
      job_title: null,
      department: null,
      family_relation: 'Bố',
      full_name: 'Trần Văn Đức'
    },
    {
      email: 'family.thienan@gmail.com',
      gender: 'FEMALE',
      title_prefix: null,
      last_name: 'Phạm',
      middle_name: 'Thu',
      first_name: 'Trang',
      job_title: null,
      department: null,
      family_relation: 'Mẹ',
      full_name: 'Phạm Thu Trang'
    },
    {
      email: 'supporter@gmail.com',
      gender: 'MALE',
      title_prefix: null,
      last_name: 'Phạm',
      middle_name: 'Minh',
      first_name: 'Hùng',
      job_title: null,
      department: null,
      family_relation: null,
      full_name: 'Phạm Minh Hùng'
    }
  ];

  for (const acc of accountUpdates) {
    await knex('users')
      .where({ email: acc.email })
      .update({
        gender: acc.gender,
        title_prefix: acc.title_prefix,
        last_name: acc.last_name,
        middle_name: acc.middle_name,
        first_name: acc.first_name,
        job_title: acc.job_title,
        department: acc.department,
        family_relation: acc.family_relation,
        full_name: acc.full_name,
        display_mode: 'FULL_NAME',
        include_prefix_in_display: false,
        include_title_in_display: true,
        include_relation_in_display: true
      });
  }
};

/**
 * Rollback hoàn tác migration
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;');
  await knex.schema.alterTable('users', (table) => {
    table.dropColumns(
      'gender',
      'title_prefix',
      'family_relation',
      'job_title',
      'department',
      'include_prefix_in_display',
      'include_title_in_display',
      'include_relation_in_display'
    );
  });
};
