const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  // Local Strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Find user by username
        const user = await User.findOne({ username });
        
        // Check if user exists
        if (!user) {
          return done(null, false, { message: 'Kullanıcı adı veya şifre yanlış' });
        }
        
        // Check if account is active
        if (!user.isActive) {
          return done(null, false, { message: 'Bu hesap devre dışı bırakılmış' });
        }
        
        // Match password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Kullanıcı adı veya şifre yanlış' });
        }
        
        // Update last login time
        user.stats.lastLogin = Date.now();
        await user.save();
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}; 