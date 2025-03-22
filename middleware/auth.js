// Authentication middleware functions

// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Bu sayfayı görüntülemek için giriş yapmalısınız');
  res.redirect('/login');
};

// Check if user is site admin or higher
exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && (
    req.user.role === 'site_admini' || 
    req.user.role === 'sunucu_sahibi' || 
    req.user.role === 'site_kurucusu'
  )) {
    return next();
  }
  req.flash('error', 'Bu sayfaya erişim yetkiniz yok');
  res.redirect('/');
};

// Check if user is server admin or higher
exports.isServerAdmin = (req, res, next) => {
  if (req.isAuthenticated() && (
    req.user.role === 'sunucu_admini' || 
    req.user.role === 'site_admini' || 
    req.user.role === 'sunucu_sahibi' || 
    req.user.role === 'site_kurucusu'
  )) {
    return next();
  }
  req.flash('error', 'Bu sayfaya erişim yetkiniz yok');
  res.redirect('/');
};

// Check if user is server owner or site founder
exports.isOwnerOrFounder = (req, res, next) => {
  if (req.isAuthenticated() && (
    req.user.role === 'sunucu_sahibi' || 
    req.user.role === 'site_kurucusu'
  )) {
    return next();
  }
  req.flash('error', 'Bu sayfaya erişim yetkiniz yok');
  res.redirect('/');
};

// Check if user is site founder (highest authority)
exports.isFounder = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'site_kurucusu') {
    return next();
  }
  req.flash('error', 'Bu sayfaya erişim yetkiniz yok');
  res.redirect('/');
};

// Redirect if already logged in
exports.redirectIfAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/profile');
  }
  next();
}; 