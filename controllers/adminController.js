const User = require('../models/User');

// Admin dashboard page
exports.getAdminDashboard = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const siteKurucusuCount = await User.countDocuments({ role: 'site_kurucusu' });
    const sunucuSahibiCount = await User.countDocuments({ role: 'sunucu_sahibi' });
    const siteAdminiCount = await User.countDocuments({ role: 'site_admini' });
    const sunucuAdminiCount = await User.countDocuments({ role: 'sunucu_admini' });
    
    res.render('admin/dashboard', {
      title: 'Admin Panel',
      activePage: 'admin',
      serverData: res.locals.serverData || {},
      userCount,
      siteKurucusuCount,
      sunucuSahibiCount,
      siteAdminiCount,
      sunucuAdminiCount
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    req.flash('error', 'Admin paneli yüklenirken bir hata oluştu.');
    res.redirect('/');
  }
};

// User management page
exports.getUserManagement = async (req, res) => {
  try {
    const users = await User.find().sort({ username: 1 });
    
    res.render('admin/users', {
      title: 'Kullanıcı Yönetimi',
      activePage: 'admin',
      serverData: res.locals.serverData || {},
      users
    });
  } catch (error) {
    console.error('User management error:', error);
    req.flash('error', 'Kullanıcı listesi yüklenirken bir hata oluştu.');
    res.redirect('/admin');
  }
};

// Change user role
exports.changeUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    // Check if role is valid
    if (!['uye', 'sunucu_admini', 'site_admini', 'sunucu_sahibi', 'site_kurucusu'].includes(role)) {
      req.flash('error', 'Geçersiz rol.');
      return res.redirect('/admin/users');
    }
    
    // Find user and update role
    const user = await User.findById(userId);
    
    if (!user) {
      req.flash('error', 'Kullanıcı bulunamadı.');
      return res.redirect('/admin/users');
    }
    
    // Role hierarchy permission check
    const roleHierarchy = {
      'uye': 0,
      'sunucu_admini': 1,
      'site_admini': 2,
      'sunucu_sahibi': 3,
      'site_kurucusu': 4
    };
    
    const currentUserRoleLevel = roleHierarchy[req.user.role];
    const targetUserRoleLevel = roleHierarchy[user.role];
    const newRoleLevel = roleHierarchy[role];
    
    // Check if current user can change the target user's role
    if (currentUserRoleLevel <= targetUserRoleLevel) {
      req.flash('error', 'Kendinizle aynı veya daha yüksek yetkiye sahip kullanıcıların rollerini değiştiremezsiniz.');
      return res.redirect('/admin/users');
    }
    
    // Check if current user can assign the requested role level
    if (currentUserRoleLevel <= newRoleLevel) {
      req.flash('error', 'Kendinizle aynı veya daha yüksek yetkideki bir rolü atayamazsınız.');
      return res.redirect('/admin/users');
    }
    
    // Update the user's role
    user.role = role;
    await user.save();
    
    // Get the display name for the role
    const roleDisplayNames = {
      'uye': 'Üye', 
      'sunucu_admini': 'Sunucu Admini', 
      'site_admini': 'Site Admini', 
      'sunucu_sahibi': 'Sunucu Sahibi', 
      'site_kurucusu': 'Site Kurucusu'
    };
    
    req.flash('success', `${user.username} kullanıcısının rolü ${roleDisplayNames[role]} olarak güncellendi.`);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Change user role error:', error);
    req.flash('error', 'Kullanıcı rolü değiştirilirken bir hata oluştu.');
    res.redirect('/admin/users');
  }
};

// Toggle user active status
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Find user and update status
    const user = await User.findById(userId);
    
    if (!user) {
      req.flash('error', 'Kullanıcı bulunamadı.');
      return res.redirect('/admin/users');
    }
    
    // Role hierarchy for permissions
    const roleHierarchy = {
      'uye': 0,
      'sunucu_admini': 1,
      'site_admini': 2,
      'sunucu_sahibi': 3,
      'site_kurucusu': 4
    };
    
    const currentUserRoleLevel = roleHierarchy[req.user.role];
    const targetUserRoleLevel = roleHierarchy[user.role];
    
    // Check if current user can modify the target user's status
    if (currentUserRoleLevel <= targetUserRoleLevel) {
      req.flash('error', 'Kendinizle aynı veya daha yüksek yetkiye sahip kullanıcıların durumunu değiştiremezsiniz.');
      return res.redirect('/admin/users');
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    const statusMessage = user.isActive ? 'aktifleştirildi' : 'devre dışı bırakıldı';
    req.flash('success', `${user.username} kullanıcısı ${statusMessage}.`);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Toggle user status error:', error);
    req.flash('error', 'Kullanıcı durumu değiştirilirken bir hata oluştu.');
    res.redirect('/admin/users');
  }
};

// Kendisi hariç diğer tüm kullanıcıları sil
exports.deleteOtherUsers = async (req, res) => {
  try {
    // Site kurucusu kontrolü
    if (req.user.role !== 'site_kurucusu') {
      req.flash('error', 'Bu işlemi sadece site kurucusu yapabilir.');
      return res.redirect('/admin/users');
    }
    
    // Kullanıcının kendi e-posta adresi dışındaki tüm kullanıcıları sil
    const result = await User.deleteMany({ 
      email: { $ne: 'ofof2467yo@gmail.com' } 
    });
    
    req.flash('success', `${result.deletedCount} kullanıcı başarıyla silindi.`);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Delete other users error:', error);
    req.flash('error', 'Kullanıcılar silinirken bir hata oluştu.');
    res.redirect('/admin/users');
  }
}; 