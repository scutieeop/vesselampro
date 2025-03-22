const passport = require('passport');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Map = require('../models/Map');
const Comment = require('../models/Comment');

// Register page render
exports.getRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Kayıt Ol',
    activePage: 'register',
    serverData: res.locals.serverData || {}
  });
};

// Handle user registration
exports.postRegister = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/register', {
      title: 'Kayıt Ol',
      activePage: 'register',
      errors: errors.array(),
      formData: req.body,
      serverData: res.locals.serverData || {}
    });
  }

  try {
    // Check if username already exists
    const existingUser = await User.findOne({ 
      $or: [
        { username: req.body.username },
        { email: req.body.email }
      ]
    });
    
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        activePage: 'register',
        errors: [{ msg: 'Bu kullanıcı adı veya e-posta adresi zaten kullanılıyor.' }],
        formData: req.body,
        serverData: res.locals.serverData || {}
      });
    }

    // Create new user
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
    });

    await user.save();
    
    req.flash('success', 'Başarıyla kayıt oldunuz. Şimdi giriş yapabilirsiniz.');
    res.redirect('/login');
  } catch (error) {
    console.error('Kayıt olma hatası:', error);
    req.flash('error', 'Kayıt sırasında bir hata oluştu.');
    res.redirect('/register');
  }
};

// Login page render
exports.getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Giriş Yap',
    activePage: 'login',
    serverData: res.locals.serverData || {}
  });
};

// Handle user login
exports.postLogin = (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) { return next(err); }
    
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/login');
    }
    
    req.logIn(user, async (err) => {
      if (err) { return next(err); }
      
      try {
        // Kullanıcı verilerini güncelle - son giriş ve online durumu
        await User.findByIdAndUpdate(user._id, {
          'stats.lastLogin': new Date(),
          isOnline: true,
          lastActive: new Date()
        });
        
        return res.redirect('/profile');
      } catch (error) {
        console.error('Kullanıcı giriş verileri güncelleme hatası:', error);
        return res.redirect('/profile');
      }
    });
  })(req, res, next);
};

// Handle user logout
exports.logout = (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success', 'Başarıyla çıkış yaptınız.');
    res.redirect('/');
  });
};

// Profile page render
exports.getProfile = async (req, res) => {
  try {
    // Find user with their ID
    const user = await User.findById(req.user.id);
    
    res.render('auth/profile', {
      title: 'Profil',
      activePage: 'profile',
      user: user,
      serverData: res.locals.serverData || {}
    });
  } catch (error) {
    console.error('Profil görüntüleme hatası:', error);
    req.flash('error', 'Profil bilgileri yüklenirken bir hata oluştu.');
    res.redirect('/');
  }
};

// Edit profile page render
exports.getEditProfile = async (req, res) => {
  try {
    res.render('auth/edit-profile', {
      title: 'Profil Düzenle',
      activePage: 'profile',
      serverData: res.locals.serverData || {}
    });
  } catch (error) {
    console.error('Profil düzenleme sayfası hatası:', error);
    req.flash('error', 'Profil düzenleme sayfası yüklenirken bir hata oluştu.');
    res.redirect('/profile');
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email } = req.body;
    
    // Check if username or email is already in use
    const userWithUsername = await User.findOne({ username, _id: { $ne: userId } });
    if (userWithUsername) {
      req.flash('error', 'Bu kullanıcı adı zaten kullanılıyor.');
      return res.redirect('/edit-profile');
    }
    
    const userWithEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (userWithEmail) {
      req.flash('error', 'Bu e-posta adresi zaten kullanılıyor.');
      return res.redirect('/edit-profile');
    }
    
    const updateData = { 
      username, 
      email 
    };
    
    // Handle profile image upload
    if (req.file) {
      // Görseli MongoDB'ye kaydet
      updateData.profileImageData = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
      
      // Resim URL'sini özel bir rota olarak ayarla
      updateData.profileImage = `/profile-image/${userId}`;
    }
    
    // Update user in database
    await User.findByIdAndUpdate(userId, updateData);
    
    req.flash('success', 'Profil bilgileriniz güncellendi.');
    res.redirect('/profile');
  } catch (error) {
    console.error('Profile update error:', error);
    req.flash('error', 'Profil güncellenirken bir hata oluştu.');
    res.redirect('/edit-profile');
  }
};

// Change password
exports.changePassword = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/edit-profile', {
      title: 'Profil Düzenle',
      activePage: 'profile',
      errors: errors.array(),
      passwordTab: true,
      serverData: res.locals.serverData || {}
    });
  }

  try {
    // Find user with their ID
    const user = await User.findById(req.user.id);
    
    // Check current password
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.render('auth/edit-profile', {
        title: 'Profil Düzenle',
        activePage: 'profile',
        errors: [{ msg: 'Mevcut şifre yanlış.' }],
        passwordTab: true,
        serverData: res.locals.serverData || {}
      });
    }
    
    // Update password
    user.password = req.body.newPassword;
    await user.save();
    
    req.flash('success', 'Şifreniz başarıyla güncellendi.');
    res.redirect('/profile');
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    req.flash('error', 'Şifre değiştirilirken bir hata oluştu.');
    res.redirect('/edit-profile');
  }
};

// Get profile image from MongoDB
exports.getProfileImage = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    // Kullanıcı bulunamadıysa veya profil resmi yoksa varsayılan resmi göster
    if (!user || !user.profileImageData || !user.profileImageData.data) {
      return res.redirect('/img/default-avatar.png');
    }
    
    // Resim verisini ve içerik tipini ayarla
    res.contentType(user.profileImageData.contentType);
    res.send(user.profileImageData.data);
  } catch (error) {
    console.error('Profile image fetch error:', error);
    return res.redirect('/img/default-avatar.png');
  }
};

// Kullanıcı profilini dışarıdan görüntüle
exports.viewUserProfile = async (req, res) => {
  try {
    const username = req.params.username;
    
    // Kullanıcıyı getir
    const user = await User.findOne({ username }).select('-password -email');
    
    if (!user) {
      req.flash('error', 'Kullanıcı bulunamadı.');
      return res.redirect('/');
    }
    
    // Kullanıcı hesabını gizli yapmışsa ve giriş yapan kullanıcı kendisi veya yönetici değilse erişimi engelle
    if (!user.isPublic && 
        (!req.isAuthenticated() || 
        (req.user.username !== username && 
        !['site_admini', 'sunucu_sahibi', 'site_kurucusu'].includes(req.user.role)))) {
      req.flash('error', 'Bu kullanıcı profilini gizli yapmış.');
      return res.redirect('/');
    }
    
    // Kullanıcının harita yorumlarını getir
    const mapComments = await Comment.find({ author: user._id, map: { $ne: null }, isActive: true })
                                 .populate('map', 'name code')
                                 .sort({ createdAt: -1 });
    
    // Kullanıcının profil yorumlarını getir
    const profileComments = await Comment.find({ profile: user._id, isActive: true })
                                     .populate('author', 'username profileImage')
                                     .sort({ createdAt: -1 });
    
    res.render('user/profile', {
      title: `${user.username} Profili`,
      activePage: '',
      profile: user,
      mapComments,
      profileComments,
      isOwnProfile: req.isAuthenticated() && req.user.username === username,
      serverData: res.locals.serverData || {}
    });
  } catch (error) {
    console.error('Kullanıcı profili görüntüleme hatası:', error);
    req.flash('error', 'Kullanıcı profili yüklenirken bir hata oluştu.');
    res.redirect('/');
  }
};

// Hesap gizlilik ayarını değiştir
exports.toggleProfileVisibility = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Bu işlem için giriş yapmalısınız.' });
    }
    
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    // Gizlilik ayarını tersine çevir
    user.isPublic = !user.isPublic;
    await user.save();
    
    const statusMessage = user.isPublic 
      ? 'Profiliniz artık herkese açık.'
      : 'Profiliniz artık gizli.';
    
    return res.json({ 
      success: true, 
      isPublic: user.isPublic, 
      message: statusMessage 
    });
  } catch (error) {
    console.error('Profil gizlilik değiştirme hatası:', error);
    return res.status(500).json({ success: false, message: 'İşlem sırasında bir hata oluştu.' });
  }
}; 