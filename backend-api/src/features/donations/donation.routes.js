const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const donationController = require('./donation.controller');
const { authenticateToken } = require('../../shared/middlewares/authMiddleware');
const { requireRoles } = require('../../shared/middlewares/roleMiddleware');

// Cấu hình Multer lưu ảnh biên lai
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/receipts'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Tối đa 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP!'));
    }
  }
});

// 1. Gửi minh chứng chuyển khoản (Public)
router.post('/submit-proof', upload.single('proof_image'), donationController.submitProof);

// 2. Cổng Ngân Hàng Mô Phỏng Sandbox (Public demo)
router.post('/mock-sandbox-pay', donationController.mockSandboxPay);

// 3. Lấy Bức Tường Vinh Danh Toàn Quốc (Public)
router.get('/wall', donationController.getNationalWallOfHonor);

// 4. Lấy Bức Tường Vinh Danh của một bé (Public)
router.get('/warrior/:slugOrId', donationController.getWallOfHonorByChild);

// 4. Lấy danh sách biên lai chờ duyệt (Yêu cầu đăng nhập: ORG_ADMIN, FAMILY, ADMIN)
router.get(
  '/pending',
  authenticateToken,
  requireRoles('ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN', 'FAMILY'),
  donationController.getPendingDonations
);

// 5. Duyệt biên lai & Cấp Chứng Nhận Số (Yêu cầu đăng nhập)
router.patch(
  '/:id/verify',
  authenticateToken,
  requireRoles('ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN', 'FAMILY'),
  donationController.verifyDonation
);

// 6. Từ chối biên lai (Yêu cầu đăng nhập)
router.patch(
  '/:id/reject',
  authenticateToken,
  requireRoles('ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN', 'FAMILY'),
  donationController.rejectDonation
);

// 7. Tra cứu công khai tính hợp lệ của Chứng Nhận Số qua Mã QR
router.get('/verify/:qrToken', donationController.verifyCertificatePublic);

// 8. Danh sách chứng nhận cấp gần đây
router.get('/recent-certs', donationController.getRecentCertificates);

module.exports = router;
