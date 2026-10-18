/**
 * Utility định dạng danh tính người dùng đa thành tố chuẩn hóa (Frontend SSR)
 * Tuân thủ Nghị định 13/2023/NĐ-CP, Luật Trẻ em 2016 và chuẩn hóa quốc tế (i18n)
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

function formatDisplayName(user, opts = {}) {
  if (!user) return 'Người dùng ẩn danh';

  const options = typeof opts === 'string' ? { viewerRole: opts } : (opts || {});
  const {
    viewerRole = null,
    locale = 'vi',
    includeHonorific = user.include_prefix_in_display || user.includePrefixInDisplay || false,
    includeTitle = user.include_title_in_display !== false && user.includeTitleInDisplay !== false,
    includeRelation = user.include_relation_in_display !== false && user.includeRelationInDisplay !== false,
    childName = user.child_name || user.childName || null,
    orgName = user.organization_name || user.orgName || (user.organization ? user.organization.name : null)
  } = options;

  const lastName = (user.last_name || user.lastName || '').trim();
  const middleName = (user.middle_name || user.middleName || '').trim();
  const firstName = (user.first_name || user.firstName || '').trim();
  const titlePrefix = (user.title_prefix || user.titlePrefix || '').trim();
  const familyRelation = (user.family_relation || user.familyRelation || '').trim();
  const jobTitle = (user.job_title || user.jobTitle || '').trim();
  const mode = user.display_mode || user.displayMode || 'FULL_NAME';

  const rawCoreName = [lastName, middleName, firstName].filter(Boolean).join(' ') || (user.full_name || user.fullName || '').trim() || 'Người dùng';

  // 1. Quản trị viên xem đầy đủ
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

  // 2. Chế độ Ẩn danh
  if (mode === 'ANONYMOUS') {
    if (user.role === 'FAMILY') return 'Gia đình chiến binh nhí ẩn danh';
    if (user.role === 'ORG_ADMIN') return 'Cán bộ y tế bảo mật';
    return 'Nhà hảo tâm ẩn danh';
  }

  // 3. Xử lý tên theo display_mode
  let formattedCoreName = rawCoreName;
  switch (mode) {
    case 'HIDE_LAST_NAME':
      const withoutLast = [middleName, firstName].filter(Boolean).join(' ');
      formattedCoreName = withoutLast || firstName || rawCoreName;
      break;

    case 'ABBREVIATED':
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

  // 4. Ghép Tiền tố (Ông/Bà/Mr/Mrs)
  let prefix = '';
  if (includeHonorific && user.gender) {
    prefix = getSalutation(user.gender, locale, true);
  }

  // 5. Ghép Học vị (BS., ThS., TS.)
  let title = '';
  if (includeTitle && titlePrefix) {
    title = titlePrefix;
  }

  let assembledName = [prefix, title, formattedCoreName].filter(Boolean).join(' ');

  // 6. Ghép Mối quan hệ hoặc chức vụ
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

function decomposeFullName(fullName) {
  let text = (fullName || '').trim();
  let titlePrefix = null;
  let familyRelation = null;
  let jobTitle = null;

  const titleMatch = text.match(/^(BS\.|ThS\.|TS\.|PGS\.TS\.|CN\.|Ths|Bs|Ts)\s+/i);
  if (titleMatch) {
    titlePrefix = titleMatch[1].toUpperCase();
    text = text.slice(titleMatch[0].length).trim();
  }

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
