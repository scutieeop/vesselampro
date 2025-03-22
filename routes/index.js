const express = require('express');
const router = express.Router();
const { isAuthenticated, redirectIfAuthenticated } = require('../middleware/auth');
const authController = require('../controllers/authController');
const mapController = require('../controllers/mapController');
const { registerValidation, loginValidation, profileUpdateValidation, passwordChangeValidation } = require('../middleware/validators');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const commentController = require('../controllers/commentController');

// MongoDB'ye kaydetmek için bellekte depolama kullanacağız
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Sadece resim dosyaları yüklenebilir (jpeg, jpg, png, gif)'));
  }
});

// Authentication Routes
router.get('/register', redirectIfAuthenticated, authController.getRegister);
router.post('/register', registerValidation, authController.postRegister);

router.get('/login', redirectIfAuthenticated, authController.getLogin);
router.post('/login', loginValidation, authController.postLogin);

router.get('/logout', authController.logout);

// Profile Routes
router.get('/profile', isAuthenticated, authController.getProfile);
router.get('/edit-profile', isAuthenticated, authController.getEditProfile);
router.post('/update-profile', isAuthenticated, upload.single('profileImage'), profileUpdateValidation, authController.updateProfile);
router.post('/change-password', isAuthenticated, passwordChangeValidation, authController.changePassword);

// Profil resimlerini MongoDB'den sun
router.get('/profile-image/:userId', authController.getProfileImage);

// Kullanıcı profilini görüntüleme
router.get('/user/:username', authController.viewUserProfile);

// Hesap gizliliği ayarını değiştir
router.post('/toggle-profile-visibility', isAuthenticated, authController.toggleProfileVisibility);

// Harita Rotaları - ana /maps rotasını kaldırıyoruz (server.js'de tanımlandı)
// router.get('/maps', mapController.getMapsList);
router.get('/maps/:code', mapController.getMapDetails);
router.post('/maps/:code/comment', isAuthenticated, mapController.addComment);
router.get('/maps/:code/modal', mapController.getMapModal);

// Yorum işlemleri
router.delete('/comments/:id', isAuthenticated, commentController.deleteComment);

// Profil yorum işlemleri
router.post('/user/:userId/comment', isAuthenticated, commentController.addProfileComment);
router.get('/user/:userId/comments', commentController.getProfileComments);

// Hakkımızda sayfası yorum işlemleri
router.post('/about/comment', isAuthenticated, commentController.addAboutComment);
router.get('/about/comments', commentController.getAboutComments);

module.exports = router; 