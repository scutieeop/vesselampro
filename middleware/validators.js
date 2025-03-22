const { body } = require('express-validator');

// Registration form validations
exports.registerValidation = [
  // Username validation
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Kullanıcı adı 3-30 karakter arasında olmalıdır')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi (_) içerebilir'),
  
  // Email validation
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz'),
  
  // Password validation
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır'),
  
  // Password confirmation validation
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Şifreler eşleşmiyor');
      }
      return true;
    })
];

// Login form validations
exports.loginValidation = [
  // Username validation
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Kullanıcı adı boş olamaz'),
  
  // Password validation
  body('password')
    .notEmpty()
    .withMessage('Şifre boş olamaz')
];

// Profile update validations
exports.profileUpdateValidation = [
  // Email validation
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz'),
  
  // Bio validation
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Biyografi en fazla 500 karakter olabilir'),
  
  // Steam ID validation
  body('steamId')
    .optional()
    .trim()
];

// Password change validations
exports.passwordChangeValidation = [
  // Current password validation
  body('currentPassword')
    .notEmpty()
    .withMessage('Mevcut şifrenizi girmelisiniz'),
  
  // New password validation
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Yeni şifre en az 6 karakter olmalıdır'),
  
  // Password confirmation validation
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Yeni şifreler eşleşmiyor');
      }
      return true;
    })
]; 