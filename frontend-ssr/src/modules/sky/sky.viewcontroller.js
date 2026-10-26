const apiClient = require('../../shared/utils/apiClient');

/**
 * Hiển thị không gian 3D Bầu Trời Ngàn Sao Tưởng Niệm (Three.js Virtual Memorial Sky)
 */
const renderMemorialSky = async (req, res) => {
  let warriors = [];
  try {
    const response = await apiClient.get('/warriors', { params: { limit: 100 } });
    warriors = response.data || [];
  } catch (err) {
    console.warn('[FRONTEND SKY WARNING] Không thể nạp hồ sơ từ Backend, sử dụng danh sách mô phỏng hạt sao:', err.message);
  }

  // Fallback dữ liệu mẫu sống động nếu Backend API chưa chạy hoặc CSDL chưa có dữ liệu
  if (!warriors || warriors.length === 0) {
    warriors = [
      {
        id: '1',
        full_name: 'Nguyễn Minh An',
        nickname: 'Bé Bo',
        slug: 'nguyen-minh-an-bo',
        status: 'FIGHTER',
        dob: '2018-05-12',
        hometown: 'Hà Nội',
        category_name: 'Ung Thư Máu (Bạch Cầu Cấp)',
        organization_name: 'Bệnh Viện Nhi Trung Ương',
        dream_summary: 'Con ước mơ sau này khỏi bệnh sẽ làm chú cảnh sát giao thông để bảo vệ mọi người.',
        total_candles: 142,
        avatar_url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=300&auto=format&fit=crop&q=80'
      },
      {
        id: '2',
        full_name: 'Trần Bảo Nam',
        nickname: 'Bé Bắp',
        slug: 'tran-bao-nam-bap',
        status: 'ANGEL',
        dob: '2019-08-20',
        hometown: 'TP. Hồ Chí Minh',
        category_name: 'U Nguyên Bào Thần Kinh',
        organization_name: 'Bệnh Viện Nhi Đồng 1',
        dream_summary: 'Ước mơ được vẽ một bức tranh thật to gửi tặng các bạn nhỏ cùng phòng bệnh.',
        total_candles: 368,
        avatar_url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&auto=format&fit=crop&q=80'
      },
      {
        id: '3',
        full_name: 'Lê Tuệ Mẫn',
        nickname: 'Mẫn Nhi',
        slug: 'le-tue-man-man-nhi',
        status: 'FIGHTER',
        dob: '2017-11-03',
        hometown: 'Đà Nẵng',
        category_name: 'U Nguyên Bào Thận (Wilms)',
        organization_name: 'Bệnh Viện K Tân Triều',
        dream_summary: 'Ước mơ trở thành cô giáo dạy vẽ và múa ba lê cho các em thơ.',
        total_candles: 95,
        avatar_url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=300&auto=format&fit=crop&q=80'
      },
      {
        id: '4',
        full_name: 'Phạm Thiên Ân',
        nickname: 'Bé Thỏ',
        slug: 'pham-thien-an-tho',
        status: 'ANGEL',
        dob: '2020-02-14',
        hometown: 'Cần Thơ',
        category_name: 'Tan Máu Bẩm Sinh (Thalassemia)',
        organization_name: 'Bệnh Viện Nhi Đồng 2',
        dream_summary: 'Con ước được một lần ngắm hoàng hôn trên biển cùng ba và mẹ.',
        total_candles: 520,
        avatar_url: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=300&auto=format&fit=crop&q=80'
      },
      {
        id: '5',
        full_name: 'Đặng Khang Nguyên',
        nickname: 'Bé Tít',
        slug: 'dang-khang-nguyen-tit',
        status: 'FIGHTER',
        dob: '2018-09-09',
        hometown: 'Hải Phòng',
        category_name: 'U Xương Khối Ác Tính',
        organization_name: 'Bệnh Viện Nhi Trung Ương',
        dream_summary: 'Ước mơ chân khỏi đau để có thể chạy đá bóng trong sân trường cùng các bạn.',
        total_candles: 210,
        avatar_url: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=300&auto=format&fit=crop&q=80'
      },
      {
        id: '6',
        full_name: 'Vũ Ngọc Khánh Vy',
        nickname: 'Bé Dâu',
        slug: 'vu-ngoc-khanh-vy-dau',
        status: 'FIGHTER',
        dob: '2019-12-25',
        hometown: 'Quảng Ninh',
        category_name: 'Bệnh Bạch Cầu Cấp Dòng Tủy',
        organization_name: 'Viện Huyết Học - Truyền Máu TW',
        dream_summary: 'Con ước có một bộ váy công chúa Elsa thật đẹp để dự lễ Giáng Sinh.',
        total_candles: 185,
        avatar_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&auto=format&fit=crop&q=80'
      }
    ];
  }

  const angelCount = warriors.filter(w => w.status === 'ANGEL').length;
  const fighterCount = warriors.filter(w => w.status === 'FIGHTER').length;
  const totalCandlesAll = warriors.reduce((sum, w) => sum + (Number(w.total_candles) || 0), 0);

  res.render('sky/views/index', {
    title: 'Bầu Trời Ngàn Sao 3D',
    description: 'Không gian 3D tương tác mô phỏng bầu trời đêm tưởng niệm các chiến binh nhí dũng cảm',
    warriors,
    warriorsJson: JSON.stringify(warriors),
    stats: {
      total: warriors.length,
      angelCount,
      fighterCount,
      totalCandlesAll
    },
    activeMenu: 'memorial-sky'
  });
};

module.exports = {
  renderMemorialSky
};
