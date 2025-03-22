const Comment = require('../models/Comment');
const Map = require('../models/Map');
const User = require('../models/User');

// Yorumu sil
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    
    // Yorumu bul
    const comment = await Comment.findById(commentId)
      .populate('map')
      .populate('profile');

    if (!comment) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(404).json({ success: false, message: 'Yorum bulunamadı.' });
      }
      req.flash('error', 'Yorum bulunamadı.');
      return res.redirect('back');
    }
    
    // Yetki kontrolü (kendi yorumu veya yetkili rol veya profil sahibi)
    const isProfileOwner = comment.profile && req.user && comment.profile.equals(req.user._id);
    if (!comment.author.equals(req.user._id) && 
        !['site_admini', 'sunucu_sahibi', 'site_kurucusu'].includes(req.user.role) &&
        !isProfileOwner) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(403).json({ success: false, message: 'Bu yorumu silmek için yetkiniz yok.' });
      }
      req.flash('error', 'Bu yorumu silmek için yetkiniz yok.');
      return res.redirect('back');
    }
    
    // Yorumu sil
    await Comment.findByIdAndDelete(commentId);
    
    // AJAX isteği ise JSON cevabı döndür
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(200).json({ success: true, message: 'Yorum başarıyla silindi.' });
    }
    
    // Yönlendirme - harita yorumu ise harita sayfasına, profil yorumu ise profile yönlendir
    if (comment.map) {
      req.flash('success', 'Yorum başarıyla silindi.');
      res.redirect(`/maps/${comment.map.code}`);
    } else if (comment.profile) {
      const profileUser = await User.findById(comment.profile);
      req.flash('success', 'Yorum başarıyla silindi.');
      res.redirect(`/user/${profileUser.username}`);
    } else if (comment.isAboutComment) {
      req.flash('success', 'Yorum başarıyla silindi.');
      res.redirect('/about');
    } else {
      req.flash('success', 'Yorum başarıyla silindi.');
      res.redirect('back');
    }
  } catch (error) {
    console.error('Yorum silme hatası:', error);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ success: false, message: 'Yorum silinirken bir hata oluştu.' });
    }
    
    req.flash('error', 'Yorum silinirken bir hata oluştu.');
    res.redirect('back');
  }
};

// Profil yorumu ekle
exports.addProfileComment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;
    
    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
      }
      req.flash('error', 'Kullanıcı bulunamadı.');
      return res.redirect('back');
    }
    
    // Kullanıcı profilini gizli yapmışsa yorum eklemeyi engelle
    if (!user.isPublic && 
        req.user.username !== user.username && 
        !['site_admini', 'sunucu_sahibi', 'site_kurucusu'].includes(req.user.role)) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(403).json({ success: false, message: 'Bu kullanıcı profili gizli, yorum eklenemez.' });
      }
      req.flash('error', 'Bu kullanıcı profili gizli, yorum eklenemez.');
      return res.redirect('back');
    }
    
    // Yeni yorum oluştur
    const newComment = new Comment({
      content,
      author: req.user._id,
      profile: userId
    });
    
    await newComment.save();
    
    // AJAX isteği ise JSON cevabı döndür
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      const populatedComment = await Comment.findById(newComment._id)
        .populate('author', 'username profileImage');
      
      return res.status(201).json({ 
        success: true, 
        message: 'Yorum başarıyla eklendi.',
        comment: populatedComment
      });
    }
    
    // Normal istek ise yönlendir
    req.flash('success', 'Yorum başarıyla eklendi.');
    res.redirect(`/user/${user.username}`);
  } catch (error) {
    console.error('Profil yorumu ekleme hatası:', error);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ success: false, message: 'Yorum eklenirken bir hata oluştu.' });
    }
    
    req.flash('error', 'Yorum eklenirken bir hata oluştu.');
    res.redirect('back');
  }
};

// Profil yorumlarını getir
exports.getProfileComments = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }
    
    // Kullanıcı profilini gizli yapmışsa ve giriş yapan kullanıcı kendisi veya yönetici değilse erişimi engelle
    if (!user.isPublic && 
        (!req.isAuthenticated() || 
         (req.user.username !== user.username && 
          !['site_admini', 'sunucu_sahibi', 'site_kurucusu'].includes(req.user.role)))) {
      return res.status(403).json({ success: false, message: 'Bu kullanıcı profilini gizli yapmış.' });
    }
    
    // Profil yorumlarını getir
    const comments = await Comment.find({ profile: userId, isActive: true })
      .populate('author', 'username profileImage')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error('Profil yorumlarını getirme hatası:', error);
    return res.status(500).json({ success: false, message: 'Yorumlar yüklenirken bir hata oluştu.' });
  }
};

// Hakkımızda sayfası yorumu ekle
exports.addAboutComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    // Yeni yorum oluştur
    const newComment = new Comment({
      content,
      author: req.user._id,
      isAboutComment: true
    });
    
    await newComment.save();
    
    // AJAX isteği ise JSON cevabı döndür
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      const populatedComment = await Comment.findById(newComment._id)
        .populate('author', 'username profileImage role');
      
      return res.status(201).json({ 
        success: true, 
        message: 'Yorum başarıyla eklendi.',
        comment: populatedComment
      });
    }
    
    // Normal istek ise yönlendir
    req.flash('success', 'Yorum başarıyla eklendi.');
    res.redirect('/about');
  } catch (error) {
    console.error('Hakkımızda sayfası yorumu ekleme hatası:', error);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ success: false, message: 'Yorum eklenirken bir hata oluştu.' });
    }
    
    req.flash('error', 'Yorum eklenirken bir hata oluştu.');
    res.redirect('back');
  }
};

// Hakkımızda sayfası yorumlarını getir
exports.getAboutComments = async (req, res) => {
  try {
    // Hakkımızda sayfası yorumlarını getir
    const comments = await Comment.find({ isAboutComment: true, isActive: true })
      .populate('author', 'username profileImage role')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error('Hakkımızda sayfası yorumlarını getirme hatası:', error);
    return res.status(500).json({ success: false, message: 'Yorumlar yüklenirken bir hata oluştu.' });
  }
}; 