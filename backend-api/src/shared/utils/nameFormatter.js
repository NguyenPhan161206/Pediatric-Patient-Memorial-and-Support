/**
 * Utility định dạng danh tính người dùng đa thành tố chuẩn hóa
 * Tuân thủ Nghị định 13/2023/NĐ-CP, Luật Trẻ em 2016 và chuẩn hóa quốc tế (i18n)
 * 
 * Các thành tố:
 * - gender: MALE, FEMALE, OTHER, UNSPECIFIED
 * - title_prefix: BS., ThS., TS., PGS.TS., CN., ...
 * - last_name, middle_name, first_name
 * - family_relation: Bố, Mẹ, Ông, Bà, Người giám hộ...
 * - job_title: Chức vụ / Vị trí công tác
 * - department: Khoa / Phòng ban tiếp quản
 * - display_mode: FULL_NAME, HIDE_LAST_NAME, ABBREVIATED, FIRST_NAME_ONLY, ANONYMOUS
 */

/**
 * Lấy tiền tố xưng hô theo giới tính và ngôn ngữ
 * @param {string} gender 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED'
 * @param {string} [locale='vi'] 'vi' | 'en'
 * @param {boolean} [formal=true] Trang trọng (Ông/Bà) hay Thân mật (Anh/Chị)
 * @returns {string}
 */
function getSalutation(gender, locale = 'vi', formal = true) {
  const g = (gender || '').toUpperCase();
  if (locale === 'en') {
    if (g === 'MALE') return 'Mr.';
    if (g === 'FEMALE') return 'Mrs.';
    if (g === 'OTHER') return 'Mx.';
    return '';
  }

  // Tiếng Việt
  if (g === 'MALE') return formal ? 'Ông' : 'Anh';
  if (g === 'FEMALE') return formal ? 'Bà' : 'Chị';
  if (g === 'OTHER') return 'Bạn';
  return '';
}

/**
 * Định dạng danh tính hiển thị toàn diện của người dùng
 * @param {Object} user Đối tượng user
 * @param {Object|string} [opts] Tùy chọn hiển thị hoặc viewerRole
 * @returns {string} Chuỗi danh tính hoàn chỉnh đã format
 */
function formatDisplayName(user, opts = {}) {
  if (!user) return 'Người dùng ẩn danh';

  // Hỗ trợ truyền tham số kiểu cũ: formatDisplayName(user, 'ADMIN')
  const options = typeof opts === 'string' ? { viewerRole: opts } : (opts || {});
  const {
    viewerRole = null,
    locale = 'vi',
    includeHonorific = user.include_prefix_in_display || false,
    includeTitle = user.include_title_in_display !== false,
    includeRelation = user.include_relation_in_display !== false,
    childName = user.child_name || user.childName || null,
    orgName = user.organization_name || user.orgName || (user.organization ? user.organization.name : null)
  } = options;

  const lastName = (user.last_name || '').trim();
  const middleName = (user.middle_name || '').trim();
  const firstName = (user.first_name || '').trim();
  const titlePrefix = (user.title_prefix || '').trim();
  const familyRelation = (user.family_relation || '').trim();
  const jobTitle = (user.job_title || '').trim();
  const mode = user.display_mode || 'FULL_NAME';

  // Họ tên gốc
  const rawCoreName = [lastName, middleName, firstName].filter(Boolean).join(' ') || (user.full_name || '').trim() || 'Người dùng';

  // 1. Quản trị viên (ADMIN / SUPER_ADMIN) xem tên pháp lý đầy đủ kèm chức vụ/quan hệ
  if (viewerRole === 'ADMIN' || viewerRole === 'SUPER_ADMIN') {
    let adminResult = rawCoreName;
    if (titlePrefix) adminResult = `${titlePrefix} ${adminResult}`;
    if (familyRelation) {
      adminResult += ` (${familyRelation}${childName ? ' Bé ' + childName : ''})`;
    } else if (jobTitle) {
      adminResult += ` (${jobTitle}${orgName ? ' - ' + orgName : ''})`;
    }
    return adminResult;
  }

  // 2. Chế độ Ẩn danh hoàn toàn
  if (mode === 'ANONYMOUS') {
    if (user.role === 'FAMILY') return 'Gia đình chiến binh nhí ẩn danh';
    if (user.role === 'ORG_ADMIN') return 'Cán bộ y tế bảo mật';
    return 'Nhà hảo tâm ẩn danh';
  }

  // 3. Xử lý phần họ tên theo display_mode
  let formattedCoreName = rawCoreName;
  switch (mode) {
    case 'HIDE_LAST_NAME':
      // Ẩn họ, chỉ hiện Đệm + Tên
      const withoutLast = [middleName, firstName].filter(Boolean).join(' ');
      formattedCoreName = withoutLast || firstName || rawCoreName;
      break;

    case 'ABBREVIATED':
      // Viết tắt bảo mật theo Nghị định 13: "Nguyễn P. M. A."
      const middleInitials = middleName
        ? middleName.split(/\s+/).map(w => w[0].toUpperCase() + '.').join(' ')
        : '';
      const firstInitial = firstName ? firstName[0].toUpperCase() + '.' : '';
      formattedCoreName = [lastName, middleInitials, firstInitial].filter(Boolean).join(' ') || rawCoreName;
      break;

    case 'FIRST_NAME_ONLY':
      formattedCoreName = firstName || rawCoreName;
      break;

    case 'FULL_NAME':
    default:
      formattedCoreName = rawCoreName;
      break;
  }

  // 4. Ghép Tiền tố xưng hô (Ông/Bà/Mr/Mrs) nếu được bật
  let prefix = '';
  if (includeHonorific && user.gender) {
    prefix = getSalutation(user.gender, locale, true);
  }

  // 5. Ghép Học vị (BS., ThS., TS.) nếu được bật
  let title = '';
  if (includeTitle && titlePrefix) {
    title = titlePrefix;
  }

  // Ghép phần đầu: [Tiền tố] [Học vị] [Họ tên]
  let assembledName = [prefix, title, formattedCoreName].filter(Boolean).join(' ');

  // 6. Ghép Hậu tố (Mối quan hệ với bé hoặc Chức vụ & Đơn vị) nếu được bật
  if (includeRelation) {
    if (familyRelation) {
      const relLabel = `${familyRelation}${childName ? ' Bé ' + childName : ''}`;
      assembledName += ` (${relLabel})`;
    } else if (jobTitle) {
      const jobLabel = `${jobTitle}${orgName ? ' - ' + orgName : ''}`;
      assembledName += ` (${jobLabel})`;
    }
  }

  return assembledName || rawCoreName;
}

/**
 * Phân tích chuỗi tự do thành các thành tố (Helper cho backward compatibility)
 */
function decomposeFullName(fullName) {
  let text = (fullName || '').trim();
  let titlePrefix = null;
  let familyRelation = null;
  let jobTitle = null;

  // Tách học vị nếu có tiền tố: ThS., BS., TS., PGS.TS., CN.
  const titleMatch = text.match(/^(BS\.|ThS\.|TS\.|PGS\.TS\.|CN\.|Ths|Bs|Ts)\s+/i);
  if (titleMatch) {
    titlePrefix = titleMatch[1].toUpperCase();
    text = text.slice(titleMatch[0].length).trim();
  }

  // Tách ngoặc đơn chứa mối quan hệ hoặc chức vụ
  const parenMatch = text.match(/\((.*?)\)$/);
  if (parenMatch) {
    const inside = parenMatch[1].trim();
    if (inside.includes('Bố') || inside.includes('Mẹ') || inside.includes('Gia đình')) {
      familyRelation = inside;
    } else {
      jobTitle = inside;
    }
    text = text.replace(/\(.*?\)$/, '').trim();
  }

  const parts = text.split(/\s+/).filter(Boolean);
  let lastName = 'Người', middleName = null, firstName = 'Dùng';
  if (parts.length === 1) {
    lastName = parts[0];
    firstName = parts[0];
  } else if (parts.length === 2) {
    lastName = parts[0];
    firstName = parts[1];
  } else if (parts.length > 2) {
    lastName = parts[0];
    firstName = parts[parts.length - 1];
    middleName = parts.slice(1, -1).join(' ');
  }

  return {
    titlePrefix,
    lastName,
    middleName,
    firstName,
    familyRelation,
    jobTitle
  };
}

module.exports = {
  getSalutation,
  formatDisplayName,
  decomposeFullName
};
