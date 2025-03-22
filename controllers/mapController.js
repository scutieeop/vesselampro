const Map = require('../models/Map');
const Comment = require('../models/Comment');
const User = require('../models/User');

// Ana haritalar sayfası
exports.getMapsList = async (req, res) => {
  try {
    const maps = await Map.find({ isActive: true }).sort({ name: 1 });
    
    res.render('maps/index', {
      title: 'Haritalar',
      activePage: 'maps',
      maps,
      serverData: res.locals.serverData || {}
    });
  } catch (error) {
    console.error('Harita listeleme hatası:', error);
    req.flash('error', 'Haritalar yüklenirken bir hata oluştu.');
    res.redirect('/');
  }
};

// Tek harita detay sayfası
exports.getMapDetails = async (req, res) => {
  try {
    const mapCode = req.params.code;
    
    // Harita bilgilerini getir
    const map = await Map.findOne({ code: mapCode, isActive: true });
    
    if (!map) {
      req.flash('error', 'Harita bulunamadı.');
      return res.redirect('/maps');
    }
    
    // Haritanın yorumlarını getir
    const comments = await Comment.find({ map: map._id, isActive: true })
                                 .populate('author', 'username profileImage')
                                 .sort({ createdAt: -1 });
    
    res.render('maps/details', {
      title: `${map.name} (${map.code})`,
      activePage: 'maps',
      map,
      comments,
      serverData: res.locals.serverData || {}
    });
  } catch (error) {
    console.error('Harita detay hatası:', error);
    req.flash('error', 'Harita detayları yüklenirken bir hata oluştu.');
    res.redirect('/maps');
  }
};

// Modal için harita detayları (AJAX ile çağrılacak)
exports.getMapModal = async (req, res) => {
  try {
    const mapCode = req.params.code;
    const activeTab = req.query.tab || 'details'; // Varsayılan sekme
    
    // Harita bilgilerini getir
    const map = await Map.findOne({ code: mapCode, isActive: true });
    
    if (!map) {
      return res.status(404).send('<div class="p-8 text-center"><p class="text-red-500">Harita bulunamadı</p></div>');
    }
    
    // Haritanın yorumlarını getir
    const comments = await Comment.find({ map: map._id, isActive: true })
                                 .populate('author', 'username profileImage')
                                 .sort({ createdAt: -1 });
    
    // Modal içeriği HTML olarak render edilecek
    res.render('maps/modal', {
      map,
      comments,
      user: req.user || null,
      isAuthenticated: req.isAuthenticated(),
      activeTab,
      layout: false // Layout'u kullanma
    }, (err, html) => {
      if (err) {
        console.error('Modal render hatası:', err);
        return res.status(500).send('<div class="p-8 text-center"><p class="text-red-500">Bir hata oluştu</p></div>');
      }
      res.send(html);
    });
  } catch (error) {
    console.error('Harita modal hatası:', error);
    res.status(500).send('<div class="p-8 text-center"><p class="text-red-500">Bir hata oluştu</p></div>');
  }
};

// Haritaya yorum ekle
exports.addComment = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(401).json({ success: false, message: 'Bu işlem için giriş yapmalısınız.' });
      }
      req.flash('error', 'Yorum eklemek için giriş yapmalısınız.');
      return res.redirect(`/maps/${req.params.code}`);
    }
    
    const { content } = req.body;
    const mapCode = req.params.code;
    
    if (!content || content.trim().length === 0) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({ success: false, message: 'Yorum içeriği boş olamaz.' });
      }
      req.flash('error', 'Yorum içeriği boş olamaz.');
      return res.redirect(`/maps/${mapCode}`);
    }
    
    // Haritayı bul
    const map = await Map.findOne({ code: mapCode });
    if (!map) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(404).json({ success: false, message: 'Harita bulunamadı.' });
      }
      req.flash('error', 'Harita bulunamadı.');
      return res.redirect('/maps');
    }
    
    // Yeni yorum oluştur
    const newComment = new Comment({
      content,
      author: req.user._id,
      map: map._id
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
    res.redirect(`/maps/${mapCode}`);
  } catch (error) {
    console.error('Yorum ekleme hatası:', error);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ success: false, message: 'Yorum eklenirken bir hata oluştu.' });
    }
    
    req.flash('error', 'Yorum eklenirken bir hata oluştu.');
    res.redirect(`/maps/${req.params.code}`);
  }
};

// Yorumu sil (sadece yorum sahibi veya admin/moderatör)
exports.deleteComment = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Bu işlem için giriş yapmalısınız.' });
    }
    
    const commentId = req.params.id;
    
    // Yorumu bul
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Yorum bulunamadı.' });
    }
    
    // Yetki kontrolü - kullanıcı ya yorumun sahibi olmalı ya da yetkili olmalı
    const isAuthor = comment.author.equals(req.user._id);
    const isAdmin = ['site_admini', 'sunucu_sahibi', 'site_kurucusu'].includes(req.user.role);
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Bu yorumu silme yetkiniz yok.' });
    }
    
    // Yorumu kaldır (tamamen silmek yerine aktif değil olarak işaretle)
    await Comment.findByIdAndUpdate(commentId, { isActive: false });
    
    return res.json({ success: true, message: 'Yorum başarıyla silindi.' });
  } catch (error) {
    console.error('Yorum silme hatası:', error);
    return res.status(500).json({ success: false, message: 'İşlem sırasında bir hata oluştu.' });
  }
}; 