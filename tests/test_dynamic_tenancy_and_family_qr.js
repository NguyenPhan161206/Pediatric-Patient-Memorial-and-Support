// Script kiểm thử tự động toàn diện dùng native fetch của Node.js 22 (Zero dependency)

const API_BASE = 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;
  
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    ok: res.ok,
    data
  };
}

async function runTests() {
  console.log('🚀 [START] Automated Test Suite: Dynamic Multi-Tenancy & Family QR Workflow\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // 1. Đăng nhập tài khoản System Admin
    console.log('--- BƯỚC 1: Đăng nhập System Admin & Kiểm tra Giới hạn Quyền (Least Privilege) ---');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@warrior.org',
        password: 'Password@2026'
      }
    });
    const adminToken = adminLoginRes.data?.data?.token || adminLoginRes.data?.token;
    assert(Boolean(adminToken), 'System Admin đăng nhập thành công.');

    // 1.1 Thử tạo bé bằng System Admin (Phải bị chặn 403)
    const adminCreateChildRes = await request('/warriors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        full_name: 'Bé Test Admin Tạo',
        story_html: 'Câu chuyện test...'
      }
    });
    assert(adminCreateChildRes.status === 403, `System Admin bị chặn tạo bé thành công với HTTP 403 (${adminCreateChildRes.data?.message})`);

    // 1.2 Thử sửa bé bằng System Admin (Phải bị chặn 403)
    const adminUpdateChildRes = await request('/warriors/1', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { nickname: 'Tên sửa thử' }
    });
    assert(adminUpdateChildRes.status === 403, `System Admin bị chặn sửa bé thành công với HTTP 403 (${adminUpdateChildRes.data?.message})`);

    // 1.3 Thử cấp role FAMILY bằng System Admin (Phải bị chặn 403)
    const adminCreateFamilyRes = await request('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        email: 'family.test.blocked@gmail.com',
        last_name: 'Nguyễn',
        first_name: 'Test',
        role: 'FAMILY'
      }
    });
    assert(adminCreateFamilyRes.status === 403, `System Admin bị chặn cấp role FAMILY thành công với HTTP 403 (${adminCreateFamilyRes.data?.message})`);

    // 2. System Admin tạo mới một Bệnh viện động kèm tài khoản ORG_ADMIN
    console.log('\n--- BƯỚC 2: System Admin Tạo Bệnh Viện Động & Cấp Tài Khoản ORG_ADMIN ---');
    const orgCode = `BV_NHI_DONG_${Date.now().toString().slice(-4)}`;
    const adminEmail = `orgadmin.test.${Date.now()}@warriorhub.vn`;

    const createOrgRes = await request('/organizations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Bệnh Viện Nhi Đồng 1 TP.HCM (Cơ Sở Mới)',
        code: orgCode,
        province: 'TP. Hồ Chí Minh',
        address: '341 Sư Vạn Hạnh, Phường 10, Quận 10',
        lat: 10.768689,
        lng: 106.669891,
        bank_name: 'Ngân hàng Ngoại thương Việt Nam',
        bank_code: 'VCB',
        bank_account_number: '0071000889988',
        bank_account_name: 'BENH VIEN NHI DONG 1',
        contact_person: 'BS. Lê Thị Kim Anh',
        phone: '02839271119',
        email: 'nhidong1@warriorhub.vn',
        // Cấp luôn tài khoản Org Admin
        admin_email: adminEmail,
        admin_password: 'Password@2026',
        admin_full_name: 'BS. Lê Thị Kim Anh',
        admin_title_prefix: 'BS.',
        admin_job_title: 'Trưởng Khoa Ung Bướu Huyết Học',
        admin_department: 'Khoa Ung Bướu',
        admin_gender: 'FEMALE'
      }
    });

    assert(createOrgRes.status === 201, `Tạo cơ sở y tế thành công: ${createOrgRes.data.data.organization.name}`);
    const newOrgId = createOrgRes.data.data.organization.id;
    assert(Boolean(createOrgRes.data.data.adminUser), `Tạo kèm tài khoản ORG_ADMIN thành công: ${adminEmail}`);

    // Kiểm tra danh sách organizations
    const listOrgsRes = await request('/organizations');
    const foundNewOrg = listOrgsRes.data.data.organizations.find(o => o.id === newOrgId);
    assert(Boolean(foundNewOrg), 'Cơ sở mới xuất hiện ngay trên API công khai mà không cần khởi động lại server.');

    // 3. Đăng nhập bằng tài khoản ORG_ADMIN vừa tạo và tiếp nhận bệnh nhi
    console.log('\n--- BƯỚC 3: ORG_ADMIN Đăng Nhập & Tiếp Nhận Bệnh Nhi Trực Thuộc Viện ---');
    const orgAdminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: adminEmail,
        password: 'Password@2026'
      }
    });
    const orgAdminToken = orgAdminLoginRes.data?.data?.token || orgAdminLoginRes.data?.token;
    assert(Boolean(orgAdminToken), 'ORG_ADMIN mới đăng nhập thành công bằng JWT.');

    const createChildRes = await request('/warriors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${orgAdminToken}` },
      body: {
        full_name: `Bé Trần Hoàng Long ${Date.now().toString().slice(-4)}`,
        nickname: 'Bé Rồng Con',
        dob: '2020-05-15',
        hometown: 'Long An',
        status: 'FIGHTER',
        hospital_patient_code: 'ND1-2026-88',
        dream_summary: 'Ước mơ làm phi công lái máy bay cứu hộ',
        story_html: '<p>Bé Long được phát hiện bệnh từ tháng 1/2026 và đang điều trị tích cực tại Khoa Ung Bướu Bệnh viện Nhi Đồng 1.</p>'
      }
    });

    assert(createChildRes.status === 201, `ORG_ADMIN tạo hồ sơ bệnh nhi thành công: ${createChildRes.data.data.full_name}`);
    const childId = createChildRes.data.data.id;
    const childSlug = createChildRes.data.data.slug;
    assert(createChildRes.data.data.organization_id === newOrgId, 'Hồ sơ bé tự động liên kết chính xác với cơ sở y tế của ORG_ADMIN.');

    // 4. ORG_ADMIN cấp tài khoản Hộ gia đình (FAMILY) cho bệnh nhi này
    console.log('\n--- BƯỚC 4: ORG_ADMIN Cấp & Gán Tài Khoản Hộ Gia Đình (FAMILY) ---');
    const familyEmail = `me.be.long.${Date.now()}@gmail.com`;
    const provisionFamilyRes = await request('/organizations/family-user', {
      method: 'POST',
      headers: { Authorization: `Bearer ${orgAdminToken}` },
      body: {
        child_id: childId,
        email: familyEmail,
        password: 'Password@2026',
        last_name: 'Trần Thị',
        first_name: 'Thanh Hằng',
        full_name: 'Trần Thị Thanh Hằng',
        family_relation: 'Mẹ ruột',
        gender: 'FEMALE',
        phone_number: '0988776655'
      }
    });

    assert(provisionFamilyRes.status === 201, `Cấp tài khoản Hộ gia đình thành công: ${familyEmail}`);

    // 5. Phụ huynh (FAMILY) đăng nhập và nộp thông tin / mã QR ngân hàng
    console.log('\n--- BƯỚC 5: Phụ Huynh Đăng Nhập & Nộp Mã QR Viện Phí ---');
    const familyLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: familyEmail,
        password: 'Password@2026'
      }
    });
    const familyToken = familyLoginRes.data?.data?.token || familyLoginRes.data?.token;
    assert(Boolean(familyToken), 'Tài khoản Phụ huynh đăng nhập thành công.');

    // Gửi thông tin ngân hàng & ảnh QR giả lập (Data URL)
    const mockQrBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const submitQRRes = await request(`/warriors/${childId}/family-bank`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${familyToken}` },
      body: {
        bank_code: 'VCB',
        bank_account_number: '0071000999888',
        bank_account_name: 'TRAN THI THANH HANG',
        qr_image_data: mockQrBase64,
        note: 'Đã nộp CCCD và Giấy khai sinh cho phòng CTXH Bệnh viện Nhi Đồng 1'
      }
    });

    assert(submitQRRes.status === 200, 'Phụ huynh gửi thông tin mã QR viện phí thành công.');
    assert(submitQRRes.data.data.familyBankVerified === false, 'Mã QR ở trạng thái CHỜ THẨM ĐỊNH (verified = false) theo Nghị định 93/2021/NĐ-CP.');

    // Kiểm tra trang public: Chưa được hiển thị công khai mã gia đình
    const publicChildResBefore = await request(`/warriors/${childSlug}`);
    assert(!publicChildResBefore.data.data.warrior.family_bank_verified, 'Mã QR gia đình CHƯA xuất hiện ngoài trang công cộng khi viện chưa duyệt.');

    // 6. Cán bộ y tế (ORG_ADMIN) thẩm định và phê duyệt mã QR của gia đình
    console.log('\n--- BƯỚC 6: ORG_ADMIN Thẩm Định & Kích Hoạt Mã QR Gia Đình ---');
    const verifyQRRes = await request(`/warriors/${childId}/family-bank/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${orgAdminToken}` },
      body: {
        approved: true
      }
    });

    assert(verifyQRRes.status === 200, 'ORG_ADMIN duyệt mã QR của gia đình thành công.');
    assert(verifyQRRes.data.data.familyBankVerified === true, 'Trạng thái chuyển thành ĐÃ DUYỆT (verified = true).');

    // Kiểm tra lại trang công khai: Đã kích hoạt hiển thị kèm link VietQR
    const publicChildResAfter = await request(`/warriors/${childSlug}`);
    assert(publicChildResAfter.data.data.warrior.family_bank_verified === true, 'Mã QR gia đình ĐÃ hiển thị công khai sau khi Bệnh viện duyệt.');
    assert(Boolean(publicChildResAfter.data.data.familyVietqrUrl), `Link mã VietQR gia đình được sinh tự động: ${publicChildResAfter.data.data.familyVietqrUrl}`);

    // 7. System Admin tạm khóa và kích hoạt lại Cơ sở y tế
    console.log('\n--- BƯỚC 7: System Admin Tạm Khóa & Mở Khóa Cơ Sở Điều Trị ---');
    const toggleRes1 = await request(`/organizations/${newOrgId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(toggleRes1.data.data.isActive === false, 'System Admin tạm khóa cơ sở y tế thành công.');

    const toggleRes2 = await request(`/organizations/${newOrgId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(toggleRes2.data.data.isActive === true, 'System Admin mở khóa kích hoạt lại cơ sở y tế thành công.');

    // KẾT QUẢ TỔNG HỢP
    console.log('\n======================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passCount} PASSED / ${failCount} FAILED`);
    console.log('======================================================');

    if (failCount === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('Lỗi ngoại lệ trong bài kiểm thử:', error);
    process.exit(1);
  }
}

runTests();
