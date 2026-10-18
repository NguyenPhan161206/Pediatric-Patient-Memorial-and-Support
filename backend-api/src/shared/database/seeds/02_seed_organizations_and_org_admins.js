const bcrypt = require('bcrypt');

/**
 * Seed dữ liệu mẫu cho các Bệnh viện / Tổ chức và Tài khoản ORG_ADMIN
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  const passwordHash = await bcrypt.hash('Password@2026', 10);

  // 1. Tạo hoặc cập nhật 3 Bệnh viện / Tổ chức mẫu
  const [nhiTW] = await knex('organizations')
    .insert({
      name: 'Bệnh viện Nhi Trung Ương',
      code: 'BV_NHI_TW',
      logo_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150',
      bank_name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)',
      bank_code: 'BIDV',
      bank_account_number: '12210000889988',
      bank_account_name: 'BENH VIEN NHI TRUNG UONG - CTXH',
      contact_person: 'BS. Lê Minh Hoàng (Trưởng phòng CTXH)',
      phone: '02462738532',
      email: 'ctxh@nhitw.org.vn',
      address: 'Số 18/879 La Thành, Phường Láng Thượng, Quận Đống Đa, Hà Nội',
      province: 'Hà Nội',
      lat: 21.0227,
      lng: 105.8094,
      is_active: true
    })
    .onConflict('code')
    .merge()
    .returning('*');

  const [kTanTrieu] = await knex('organizations')
    .insert({
      name: 'Bệnh viện K - Cơ sở Tân Triều',
      code: 'BV_K_TANTRIEU',
      logo_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=150',
      bank_name: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)',
      bank_code: 'VCB',
      bank_account_number: '0011004455667',
      bank_account_name: 'QUY NGAY MAI TUOI SANG - BV K',
      contact_person: 'ThS. Nguyễn Thị Mai',
      phone: '02437850555',
      email: 'hotro@benhvienk.vn',
      address: 'Số 30 đường Cầu Bươu, Thanh Trì, Hà Nội',
      province: 'Hà Nội',
      lat: 20.9634,
      lng: 105.7946,
      is_active: true
    })
    .onConflict('code')
    .merge()
    .returning('*');

  const [nuCuoiEm] = await knex('organizations')
    .insert({
      name: 'Quỹ Thiện Nguyện Nụ Cười Em',
      code: 'QUY_NU_CUOI_EM',
      logo_url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=150',
      bank_name: 'Ngân hàng Quân Đội (MBBank)',
      bank_code: 'MB',
      bank_account_number: '088899998888',
      bank_account_name: 'QUY NU CUOI EM VIET NAM',
      contact_person: 'Chị Đặng Thùy Dương',
      phone: '02839300000',
      email: 'contact@nucuoiem.org.vn',
      address: 'Số 120 Hai Bà Trưng, Quận 1, TP. Hồ Chí Minh',
      province: 'TP. Hồ Chí Minh',
      lat: 10.7769,
      lng: 106.7009,
      is_active: true
    })
    .onConflict('code')
    .merge()
    .returning('*');

  // 2. Tạo hoặc cập nhật tài khoản ORG_ADMIN cho từng viện
  await knex('users')
    .insert([
      {
        email: 'orgadmin.nhi@warriorhub.vn',
        password_hash: passwordHash,
        full_name: 'BS. Lê Minh Hoàng (Admin BV Nhi TW)',
        phone_number: '0908881122',
        role: 'ORG_ADMIN',
        org_id: nhiTW.id,
        is_active: true
      },
      {
        email: 'orgadmin.k@warriorhub.vn',
        password_hash: passwordHash,
        full_name: 'ThS. Nguyễn Thị Mai (Admin BV K Tân Triều)',
        phone_number: '0908883344',
        role: 'ORG_ADMIN',
        org_id: kTanTrieu.id,
        is_active: true
      },
      {
        email: 'orgadmin.nucuoiem@warriorhub.vn',
        password_hash: passwordHash,
        full_name: 'Chị Đặng Thùy Dương (Admin Quỹ Nụ Cười Em)',
        phone_number: '0908885566',
        role: 'ORG_ADMIN',
        org_id: nuCuoiEm.id,
        is_active: true
      }
    ])
    .onConflict('email')
    .merge();

  // 3. Cập nhật phân bổ Coordinator và các Chiến binh nhí vào các Bệnh viện
  // Coordinator thuộc BV Nhi TW
  await knex('users')
    .where({ email: 'coordinator@warrior.org' })
    .update({ org_id: nhiTW.id });

  // Bé Minh An và Bé Mai Chi thuộc BV Nhi TW
  await knex('children')
    .where('full_name', 'ilike', '%Minh An%')
    .orWhere('full_name', 'ilike', '%Mai Chi%')
    .update({ organization_id: nhiTW.id });

  // Bé Tuấn Kiệt thuộc BV K Tân Triều
  await knex('children')
    .where('full_name', 'ilike', '%Tuấn Kiệt%')
    .update({ organization_id: kTanTrieu.id });

  // Bé Thiên Ân thuộc Quỹ Nụ Cười Em
  await knex('children')
    .where('full_name', 'ilike', '%Thiên Ân%')
    .update({ organization_id: nuCuoiEm.id });
};
