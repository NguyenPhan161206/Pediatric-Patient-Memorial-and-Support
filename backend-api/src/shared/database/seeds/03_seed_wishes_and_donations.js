/**
 * Seed dữ liệu mẫu cho Cây điều ước và Bức tường vinh danh
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Xóa sạch dữ liệu cũ của 2 bảng này trước khi seed
  await knex('child_wishes').del();
  await knex('donations_transactions').del();

  // Lấy ID các bé mẫu
  const minhan = await knex('children').whereILike('full_name', '%Minh An%').first();
  const maichi = await knex('children').whereILike('full_name', '%Mai Chi%').first();
  const tuankiet = await knex('children').whereILike('full_name', '%Tuấn Kiệt%').first();
  const thienan = await knex('children').whereILike('full_name', '%Thiên Ân%').first();

  // Lấy tài khoản admin duyệt
  const adminUser = await knex('users').where({ email: 'admin@warrior.org' }).first();
  const nhiAdmin = await knex('users').where({ email: 'orgadmin.nhi@warriorhub.vn' }).first();

  // 1. Nạp Cây Điều Ước Mẫu (Child Wishes)
  if (minhan) {
    await knex('child_wishes').insert({
      child_id: minhan.id,
      title: 'Hộp màu sáp 36 màu Faber-Castell để vẽ bầu trời',
      description: 'Em muốn vẽ một bức tranh có bầu trời thật trong xanh và tặng lại các bác sĩ ở viện.',
      category: 'TOY',
      estimated_cost: 150000,
      status: 'FULFILLED',
      sponsor_name: 'Phạm Minh Hùng',
      sponsor_phone: '0933445566',
      sponsor_message: 'Chúc bé Bo luôn vui vẻ và mau khỏe để vẽ thật nhiều tranh đẹp nhé!',
      promised_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      fulfilled_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });
  }

  if (maichi) {
    await knex('child_wishes').insert({
      child_id: maichi.id,
      title: 'Con gấu bông thỏ trắng để ôm mỗi khi truyền hóa chất',
      description: 'Những lúc con bị sốt hay đau khi truyền thuốc, con muốn có chú thỏ bông nằm cạnh.',
      category: 'TOY',
      estimated_cost: 200000,
      status: 'PROMISED',
      sponsor_name: 'Nguyễn Thu Thủy',
      sponsor_phone: '0912998877',
      sponsor_message: 'Món quà đã được gửi tới Phòng CTXH BV Nhi Trung Ương sáng nay, mong con sẽ thích!',
      promised_at: new Date(Date.now() - 12 * 60 * 60 * 1000)
    });
  }

  if (tuankiet) {
    await knex('child_wishes').insert({
      child_id: tuankiet.id,
      title: 'Bộ đồ chơi xếp hình đoàn tàu hỏa chạy đường ray',
      description: 'Em thích sau này lớn lên làm chú lái tàu hỏa đưa mọi người đi khắp đất nước.',
      category: 'TOY',
      estimated_cost: 350000,
      status: 'PENDING'
    });
  }

  if (thienan) {
    await knex('child_wishes').insert({
      child_id: thienan.id,
      title: 'Bộ truyện tranh Dế Mèn Phiêu Lưu Ký có tranh vẽ màu',
      description: 'Cuốn sách em hằng yêu thích để đọc những buổi chiều ở hành lang viện.',
      category: 'BOOK',
      estimated_cost: 120000,
      status: 'PENDING'
    });
  }

  // 2. Nạp Bức Tường Vinh Danh & Giao Dịch Mẫu (Donations Transactions)
  // Giao dịch 1: Đã duyệt (VERIFIED) - Minh An
  if (minhan) {
    await knex('donations_transactions').insert({
      child_id: minhan.id,
      organization_id: minhan.organization_id,
      transaction_code: 'FT2610168892',
      donor_name: 'Phạm Minh Hùng',
      donor_email: 'hung.pham@gmail.com',
      donor_phone: '0933445566',
      amount: 500000,
      transfer_message: `ChienBinhNhi ${minhan.slug}`,
      payment_method: 'NAPAS247_VIETQR',
      proof_image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600',
      status: 'VERIFIED',
      verification_type: 'MANUAL_PROOF',
      verified_by: nhiAdmin ? nhiAdmin.id : (adminUser ? adminUser.id : null),
      verified_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      certificate_code: 'CERT-2026-NHI-00145',
      certificate_qr_token: 'qr-minhan-cert-001'
    });
  }

  // Giao dịch 2: Đã duyệt (VERIFIED) - Tuấn Kiệt
  if (tuankiet) {
    await knex('donations_transactions').insert({
      child_id: tuankiet.id,
      organization_id: tuankiet.organization_id,
      transaction_code: 'MB2610174411',
      donor_name: 'Công ty Cổ phần Công nghệ Hy Vọng',
      donor_email: 'contact@hyvongtech.vn',
      donor_phone: '0243998877',
      amount: 1000000,
      transfer_message: `ChienBinhNhi ${tuankiet.slug}`,
      payment_method: 'NAPAS247_VIETQR',
      proof_image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600',
      status: 'VERIFIED',
      verification_type: 'MANUAL_PROOF',
      verified_by: adminUser ? adminUser.id : null,
      verified_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      certificate_code: 'CERT-2026-BVK-00088',
      certificate_qr_token: 'qr-tuankiet-cert-002'
    });
  }

  // Giao dịch 3: Chờ duyệt (PENDING) - Mai Chi
  if (maichi) {
    await knex('donations_transactions').insert({
      child_id: maichi.id,
      organization_id: maichi.organization_id,
      transaction_code: 'VCB2610189920',
      donor_name: 'Trần Bảo Ngọc',
      donor_email: 'ngoc.tran@yahoo.com',
      donor_phone: '0988776655',
      amount: 200000,
      transfer_message: `ChienBinhNhi ${maichi.slug}`,
      payment_method: 'NAPAS247_VIETQR',
      proof_image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600',
      status: 'PENDING',
      verification_type: 'MANUAL_PROOF'
    });
  }
};
