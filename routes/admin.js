const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Admin dashboard
router.get('/', isAdmin, adminController.getAdminDashboard);

// User management
router.get('/users', isAdmin, adminController.getUserManagement);

// Change user role
router.post('/change-role', isAdmin, adminController.changeUserRole);

// Toggle user status
router.post('/toggle-status', isAdmin, adminController.toggleUserStatus);

// Diğer kullanıcıları silme işlemi
router.post('/delete-other-users', isAdmin, adminController.deleteOtherUsers);

module.exports = router; 