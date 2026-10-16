const bcrypt = require('bcrypt');

/**
 * Seed dữ liệu mẫu cho hệ thống Courageous Little Warriors Hub
 * Mật khẩu chung cho tất cả tài khoản mẫu là: Password@2026
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Xóa sạch dữ liệu cũ theo thứ tự khóa ngoại
  await knex('audit_logs').del();
  await knex('tributes').del();
  await knex('gallery_items').del();
  await knex('guardianship_consents').del();
  await knex('children').del();
  await knex('categories').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('Password@2026', 10);

  // 1. Chèn người dùng mẫu (5-Tier RBAC)
  const [adminUser] = await knex('users').insert({
    email: 'admin@warrior.org',
    password_hash: passwordHash,
    full_name: 'Nguyễn Văn Quản Trị',
    phone_number: '0901234567',
    role: 'ADMIN'
  }).returning('*');

  const [coordinatorUser] = await knex('users').insert({
    email: 'coordinator@warrior.org',
    password_hash: passwordHash,
    full_name: 'Trần Thị Thu Hà (Điều Phối Viên BV Nhi TW)',
    phone_number: '0912345678',
    role: 'COORDINATOR'
  }).returning('*');

  const [familyMinhAn] = await knex('users').insert({
    email: 'family.minhan@gmail.com',
    password_hash: passwordHash,
    full_name: 'Nguyễn Thị Lan (Mẹ Bé Minh An)',
    phone_number: '0987654321',
    role: 'FAMILY'
  }).returning('*');

  const [familyMaiChi] = await knex('users').insert({
    email: 'family.maichi@gmail.com',
    password_hash: passwordHash,
    full_name: 'Lê Văn Hải (Bố Bé Mai Chi)',
    phone_number: '0977889900',
    role: 'FAMILY'
  }).returning('*');

  const [supporterUser] = await knex('users').insert({
    email: 'supporter@gmail.com',
    password_hash: passwordHash,
    full_name: 'Phạm Minh Hùng (Nhà Hảo Tâm)',
    phone_number: '0933445566',
    role: 'MEMBER'
  }).returning('*');

  // 2. Chèn danh mục bệnh lý
  const categories = await knex('categories').insert([
    {
      name: 'Ung Thư Máu (Bạch Cầu Cấp)',
      slug: 'ung-thu-mau',
      description: 'Nhóm bệnh lý tế bào bạch cầu ác tính (ALL, AML) phổ biến ở trẻ em'
    },
    {
      name: 'U Nguyên Bào Thần Kinh & U Não',
      slug: 'u-nao-than-kinh',
      description: 'Các khối u đặc hệ thần kinh trung ương và ngoại vi'
    },
    {
      name: 'U Nguyên Bào Thận (Wilms)',
      slug: 'u-nguyen-bao-than',
      description: 'Khối u ác tính tại thận, có tỷ lệ điều trị khỏi cao nếu phát hiện sớm'
    },
    {
      name: 'Bệnh Lý Hiếm & Tan Máu Bẩm Sinh',
      slug: 'benh-ly-hiem',
      description: 'Thalassemia, suy tủy xương và các hội chứng hiếm gặp'
    }
  ]).returning('*');

  const catUngThuMau = categories.find(c => c.slug === 'ung-thu-mau').id;
  const catUNguyenBaoThan = categories.find(c => c.slug === 'u-nguyen-bao-than').id;
  const catUNao = categories.find(c => c.slug === 'u-nao-than-kinh').id;

  // 3. Chèn hồ sơ các chiến binh nhí
  // Bé 1: Minh An (FIGHTER - Tài khoản Bệnh viện)
  const [childMinhAn] = await knex('children').insert({
    full_name: 'Nguyễn Minh An',
    nickname: 'Bé Bo',
    slug: 'nguyen-minh-an-bo',
    dob: '2018-05-12',
    hometown: 'Hà Nội',
    status: 'FIGHTER',
    category_id: catUngThuMau,
    dream_summary: 'Con ước mơ sau này khỏi bệnh sẽ làm chú cảnh sát giao thông để giúp đỡ các em nhỏ qua đường',
    story_html: `
      <p>Minh An được phát hiện mắc bạch cầu cấp dòng lympho (ALL) vào tháng 10 năm 2023 khi con vừa bước vào lớp 1. Những ngày đầu truyền hóa chất, những cơn sốt cao và đau nhức xương khiến cậu bé 6 tuổi kiệt sức.</p>
      <p>Thế nhưng Bo chưa từng bỏ cuộc. Trong phòng bệnh cách ly, con luôn say mê vẽ những chú công an áo vàng và dặn mẹ: <em>"Mẹ ơi, con tiêm xong là con sắp khỏe để đi bắt cướp rồi đúng không mẹ?"</em></p>
      <p>Hiện nay con đang bước vào phác đồ duy trì, sức khỏe dần ổn định với sự chăm sóc tận tụy của các bác sĩ Viện Nhi Trung Ương.</p>
    `,
    avatar_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    candle_count: 142,
    created_by: coordinatorUser.id,
    family_user_id: familyMinhAn.id,
    sponsorship_type: 'HOSPITAL',
    hospital_patient_code: 'BVNTW-2024-8891',
    bank_code: 'BIDV',
    bank_account_number: '12010000088999',
    bank_account_name: 'BENH VIEN NHI TRUNG UONG',
    bank_verified: true,
    is_published: true
  }).returning('*');

  // Bé 2: Mai Chi (URGENT - Tài khoản Gia Đình Bố ruột)
  const [childMaiChi] = await knex('children').insert({
    full_name: 'Lê Mai Chi',
    nickname: 'Bé Bông',
    slug: 'le-mai-chi-bong',
    dob: '2020-09-18',
    hometown: 'Nghệ An',
    status: 'URGENT',
    category_id: catUngThuMau,
    dream_summary: 'Bông thích vẽ những bức tranh hoa hướng dương rực rỡ và mong sớm được về nhà đi học mầm non',
    story_html: `
      <p>Bé Bông mới 4 tuổi, quê ở vùng quê nghèo huyện Diễn Châu, Nghệ An. Bố làm phụ hồ, mẹ làm nông, gia đình lâm vào cảnh kiệt quệ khi hay tin con mắc ung thư máu thể nặng tái phát.</p>
      <p>Con đang cần thực hiện ghép tủy và truyền hóa chất liều cao. Rất mong các nhà hảo tâm cùng chung tay tiếp thêm hy vọng và viện phí để gia đình níu giữ nụ cười hồn nhiên của Bông.</p>
    `,
    avatar_url: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=600&auto=format&fit=crop&q=80',
    candle_count: 320,
    created_by: coordinatorUser.id,
    family_user_id: familyMaiChi.id,
    sponsorship_type: 'FAMILY_GUARDIAN',
    bank_code: 'VCB',
    bank_account_number: '101889966554',
    bank_account_name: 'LE VAN HAI',
    bank_verified: true,
    is_published: true
  }).returning('*');

  // Bé 3: Tuấn Kiệt (RECOVERED)
  const [childTuanKiet] = await knex('children').insert({
    full_name: 'Trần Tuấn Kiệt',
    nickname: 'Kiệt Dũng Cảm',
    slug: 'tran-tuan-kiet',
    dob: '2016-11-04',
    hometown: 'Đà Nẵng',
    status: 'RECOVERED',
    category_id: catUNguyenBaoThan,
    dream_summary: 'Sau 3 năm chiến đấu bền bỉ cùng bố mẹ, con đã chính thức chiến thắng bệnh tật và trở lại lớp học',
    story_html: `
      <p>Phát hiện u Wilms giai đoạn 3 khi mới 5 tuổi, Tuấn Kiệt đã trải qua 1 ca phẫu thuật cắt bỏ thận trái và 18 đợt xạ trị - hóa chất kéo dài.</p>
      <p>Tháng 8/2024 vừa qua, chỉ số tế bào của con hoàn toàn âm tính. Bác sĩ xác nhận con đã hồi phục hoàn toàn. Tuấn Kiệt là biểu tượng sống cho niềm tin: Ung thư nhi hoàn toàn có thể chữa khỏi!</p>
    `,
    avatar_url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&auto=format&fit=crop&q=80',
    candle_count: 580,
    created_by: adminUser.id,
    is_published: true
  }).returning('*');

  // Bé 4: Thiên Ân (ANGEL)
  const [childThienAn] = await knex('children').insert({
    full_name: 'Phạm Thiên Ân',
    nickname: 'Thiên Thần Nhỏ',
    slug: 'pham-thien-an',
    dob: '2017-03-21',
    hometown: 'TP. Hồ Chí Minh',
    status: 'ANGEL',
    category_id: catUNao,
    dream_summary: 'Thiên thần nhỏ đã hoàn thành sứ mệnh yêu thương và bay về trời bình yên',
    story_html: `
      <p>Thiên Ân đã chiến đấu dũng cảm cùng gia đình suốt 4 năm ròng rã. Dù đôi chân không còn đi được vì khối u chèn ép, ánh mắt con luôn ánh lên sự ấm áp và lạc quan.</p>
      <p>Con đã thanh thản bay về miền mây trắng vào một sớm mùa thu. Trang ký ức này lưu giữ nụ cười và trái tim nhân hậu của con mãi mãi trong lòng gia đình và những người yêu thương.</p>
    `,
    avatar_url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&auto=format&fit=crop&q=80',
    candle_count: 890,
    created_by: adminUser.id,
    is_published: true
  }).returning('*');

  // 4. Minh chứng Giám hộ (Luật Trẻ Em 2016)
  await knex('guardianship_consents').insert([
    {
      child_id: childMinhAn.id,
      guardian_user_id: familyMinhAn.id,
      document_proof_url: 'https://placehold.co/800x600/e2e8f0/1e293b?text=Giay+Khai+Sinh+Minh+An',
      child_consent_verified: false,
      legal_terms_agreed: true,
      ip_address: '127.0.0.1'
    },
    {
      child_id: childMaiChi.id,
      guardian_user_id: familyMaiChi.id,
      document_proof_url: 'https://placehold.co/800x600/e2e8f0/1e293b?text=Giay+Khai+Sinh+Mai+Chi',
      child_consent_verified: false,
      legal_terms_agreed: true,
      ip_address: '127.0.0.1'
    }
  ]);

  // 5. Kỷ vật & Tranh vẽ của bé
  await knex('gallery_items').insert([
    {
      child_id: childMaiChi.id,
      media_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80',
      media_type: 'DRAWING',
      caption: 'Bức tranh "Cánh đồng hoa hướng dương và mặt trời" do Bông vẽ tại viện'
    },
    {
      child_id: childMinhAn.id,
      media_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80',
      media_type: 'IMAGE',
      caption: 'Chiếc xe cảnh sát đồ chơi - món quà con yêu thích nhất'
    }
  ]);

  // 6. Lời chúc tri ân (Tributes)
  await knex('tributes').insert([
    {
      child_id: childMinhAn.id,
      sender_name: 'Cô Mai Lan (CLB Nụ Cười Em)',
      sender_email: 'mailan@gmail.com',
      content: 'Bo ngoan ơi, cô chúc Bo thật mạnh mẽ vượt qua đợt truyền này nhé! Các cô chú luôn bên cạnh con!',
      status: 'APPROVED',
      approved_by: adminUser.id
    },
    {
      child_id: childMaiChi.id,
      sender_name: 'Chú Minh Hùng',
      sender_email: 'supporter@gmail.com',
      content: 'Chúc con gái bé nhỏ sớm khỏe để về quê đi học mầm non. Chú đã gửi một chút viện phí ủng hộ con!',
      status: 'APPROVED',
      approved_by: adminUser.id
    },
    {
      child_id: childMinhAn.id,
      sender_name: 'Bạn giấu tên',
      sender_email: 'anonymous@gmail.com',
      content: 'Cố lên nhé người bạn nhỏ dũng cảm!',
      status: 'PENDING' // Chờ duyệt
    }
  ]);

  // 7. Nhật ký kiểm toán (Audit Logs)
  await knex('audit_logs').insert([
    {
      user_id: adminUser.id,
      action: 'APPROVE_BANK_VERIFICATION',
      resource_type: 'CHILDREN',
      resource_id: childMinhAn.id,
      metadata: { note: 'Đã đối soát số tài khoản viện phí Bệnh viện Nhi TW hợp lệ' },
      ip_address: '127.0.0.1'
    },
    {
      user_id: adminUser.id,
      action: 'APPROVE_BANK_VERIFICATION',
      resource_type: 'CHILDREN',
      resource_id: childMaiChi.id,
      metadata: { note: 'Đã đối soát CCCD bố ruột trùng khớp chủ tài khoản Vietcombank' },
      ip_address: '127.0.0.1'
    }
  ]);

  console.log('✅ [KNEX SEED] Nạp dữ liệu mẫu hoàn tất thành công!');
};
