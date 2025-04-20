const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Passport configuration
require('./config/passport')(passport);

// Routes
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

// Models (profil fotoğrafları kaydı için User modelini ekleyelim)
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cs16server';

// Sunucu her başlatıldığında yeni bir session ID oluştur
const SERVER_SESSION_ID = Date.now().toString();
console.log('Server started with session ID:', SERVER_SESSION_ID);

// Body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Statik dosyalar için klasör ayarı
app.use(express.static(path.join(__dirname, 'public')));

// View engine ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Express Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'vesselampro-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.serverSessionId = SERVER_SESSION_ID;
  
  // Flash mesajlarını al
  const errorFlash = req.flash('error');
  const successFlash = req.flash('success');
  
  // Sadece mesaj varsa gönder
  res.locals.messages = {
    error: errorFlash.length > 0 ? errorFlash : null,
    success: successFlash.length > 0 ? successFlash : null
  };
  
  next();
});

// Tüm şablonlara sunucu oturum kimliğini aktar
app.use((req, res, next) => {
  res.locals.serverSessionId = SERVER_SESSION_ID;
  next();
});

// CSDuragi.com'dan veri çekme fonksiyonu
async function fetchPlayerData(customServerIP = null) {
  try {
    // Eğer özel bir server IP belirtilmişse kullan, yoksa varsayılanı kullan
    const serverURL = customServerIP ? 
      `https://csduragi.com/counter-strike/server/${customServerIP}` : 
      'https://csduragi.com/counter-strike/server/cs25.csduragi.com';
    
    console.log(`Sunucu verisi çekiliyor: ${serverURL}`);
    
    // CSDuragi.com'dan veri çek
    const response = await axios.get(serverURL);
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Sunucu bilgilerini çek
    let serverMap = '';
    let playerCount = '';
    let serverIp = '';
    let serverName = '';
    
    // Harita bilgisini çek
    $('li').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.includes('Harita :')) {
        serverMap = text.split(':')[1].trim();
      }
      if (text.includes('Oyuncu :')) {
        playerCount = text.split(':')[1].trim();
      }
      if (text.includes('Ip :')) {
        serverIp = text.split(':').slice(1).join(':').trim();
      }
    });
    
    // Sunucu ismi bilgisini çek
    serverName = $('h1').text().trim();
    if (!serverName) {
      serverName = "VESSELAM PRO PUBLIC [REVIVE + HEAL BOMB]";
    }
    
    // Oyuncu sayısını ayır
    let online = 0;
    let max = 32;
    
    if (playerCount) {
      const parts = playerCount.split('/');
      if (parts.length > 1) {
        const onlinePart = parts[0].trim();
        // Eğer parantez içinde spectator sayısı varsa
        if (onlinePart.includes('(')) {
          online = parseInt(onlinePart.split('(')[0].trim()) || 0;
        } else {
          online = parseInt(onlinePart) || 0;
        }
        max = parseInt(parts[1].trim()) || 32;
      }
    }
    
    // Oyuncu listelerini oluştur
    let ctPlayers = [];
    let tPlayers = [];
    let spectators = [];
    
    // CT Takımı oyuncularını çek
    $('#takim-ct tbody tr').each((i, elem) => {
      const cells = $(elem).find('td');
      if (cells.length >= 6) {
        const player = {
          name: $(cells[1]).text().trim(),
          ip: $(cells[2]).text().trim(),
          kills: parseInt($(cells[3]).text().trim()) || 0,
          deaths: parseInt($(cells[4]).text().trim()) || 0,
          time: $(cells[5]).text().trim(),
          team: 'CT',
          score: parseInt($(cells[3]).text().trim()) || 0, // Vurduğu sayısını skor olarak kullan
          ping: Math.floor(Math.random() * 150) + 20 // Ping bilgisi olmadığı için örnek değer
        };
        ctPlayers.push(player);
      }
    });
    
    // T Takımı oyuncularını çek
    $('#takim-t tbody tr').each((i, elem) => {
      const cells = $(elem).find('td');
      if (cells.length >= 6) {
        const player = {
          name: $(cells[1]).text().trim(),
          ip: $(cells[2]).text().trim(),
          kills: parseInt($(cells[3]).text().trim()) || 0,
          deaths: parseInt($(cells[4]).text().trim()) || 0,
          time: $(cells[5]).text().trim(),
          team: 'TERRORIST',
          score: parseInt($(cells[3]).text().trim()) || 0, // Vurduğu sayısını skor olarak kullan
          ping: Math.floor(Math.random() * 150) + 20 // Ping bilgisi olmadığı için örnek değer
        };
        tPlayers.push(player);
      }
    });
    
    // İzleyicileri çek
    $('#takim-spec tbody tr').each((i, elem) => {
      const cells = $(elem).find('td');
      if (cells.length >= 6) {
        const player = {
          name: $(cells[1]).text().trim(),
          ip: $(cells[2]).text().trim(),
          kills: parseInt($(cells[3]).text().trim()) || 0,
          deaths: parseInt($(cells[4]).text().trim()) || 0,
          time: $(cells[5]).text().trim(),
          team: 'SPECTATOR',
          score: 0,
          ping: Math.floor(Math.random() * 150) + 20 // Ping bilgisi olmadığı için örnek değer
        };
        spectators.push(player);
      }
    });
    
    // Tüm oyuncuları birleştir
    const playersList = [...ctPlayers, ...tPlayers, ...spectators];
    
    return {
      serverData: {
        serverName: serverName,
        serverIP: serverIp || "185.126.177.60:27015",
        status: "online",
        map: serverMap || "de_dust2_long",
        players: {
          online: playersList.length,
          max: max,
          list: playersList
        }
      },
      ctPlayers: ctPlayers,
      tPlayers: tPlayers,
      spectators: spectators,
      playerData: playersList.length > 0
    };
  } catch (error) {
    console.error('Veri çekme hatası:', error);
    return {
      serverData: {
        serverName: "VESSELAM PRO PUBLIC [REVIVE + HEAL BOMB]",
        serverIP: "185.126.177.60:27015",
        status: "offline",
        map: "de_dust2_long",
        players: {
          online: 0,
          max: 32,
          list: []
        }
      },
      ctPlayers: [],
      tPlayers: [],
      spectators: [],
      playerData: false
    };
  }
}

// Tüm verilerle bir model oluştur (sayfa render etmek için)
async function createViewModel(activePage, req) {
  try {
    const data = await fetchPlayerData();
    return {
      ...data,
      activePage, // Aktif sayfayı modele ekle (navbar için gerekli)
      user: req ? req.user : null, // Kullanıcı bilgisini ekle
      isAuthenticated: req ? req.isAuthenticated() : false // Authentication durumunu ekle
    };
  } catch (error) {
    console.error('ViewModel oluşturma hatası:', error);
    return {
      serverData: {
        serverName: "VESSELAM PRO PUBLIC [REVIVE + HEAL BOMB]",
        serverIP: "185.126.177.60:27015",
        status: "offline",
        map: "de_dust2_long",
        players: {
          online: 0,
          max: 32,
          list: []
        }
      },
      ctPlayers: [],
      tPlayers: [],
      spectators: [],
      playerData: false,
      activePage, // Aktif sayfayı modele ekle (navbar için gerekli)
      isAuthenticated: req ? req.isAuthenticated() : false // Authentication durumunu ekle
    };
  }
}

// API: Server Durumu
app.get('/api/server-status', async (req, res) => {
  try {
    // URL'den sunucu IP'si almak için
    const serverIP = req.query.serverIP;
    
    // Eğer özel bir IP isteği varsa, onu kullan
    const data = await fetchPlayerData(serverIP);
    
    // Yanıtı gönder - API tüm veriyi döndürsün
    res.json({
      ...data.serverData,
      ctPlayers: data.ctPlayers,
      tPlayers: data.tPlayers,
      spectators: data.spectators
    });
  } catch (error) {
    console.error('API hatası:', error);
    res.status(500).json({
      status: "error",
      message: "Sunucu bilgisi alınamadı",
      error: error.message
    });
  }
});

// Ana sayfa
app.get('/', async (req, res) => {
  const viewModel = await createViewModel('home', req);
  res.render('home', viewModel);
});

// Oyuncular sayfası
app.get('/players', async (req, res) => {
  const viewModel = await createViewModel('players', req);
  res.render('players', viewModel);
});

// İstatistikler sayfası
app.get('/stats', async (req, res) => {
  const viewModel = await createViewModel('stats', req);
  res.render('stats', viewModel);
});

// Silah modelleri sayfası
app.get('/weapons', async (req, res) => {
  const viewModel = await createViewModel('weapons', req);
  
  // Silah model klasörlerini ve resimleri okuma
  const weaponModels = {
    ak47: getWeaponModels('public/images/ak47'),
    m4a1: getWeaponModels('public/images/m4a1'),
    bicak: getWeaponModels('public/images/bicak'),
    awp: getWeaponModels('public/images/awp')
  };
  
  // View modeline silah modellerini ekle
  viewModel.weaponModels = weaponModels;
  
  res.render('weapons', viewModel);
});

// Haritalar sayfası - Doğrudan render ederek
app.get('/maps', async (req, res) => {
  const viewModel = await createViewModel('maps', req);
  res.render('maps', viewModel);
});

// Hakkında/İletişim sayfası
app.get('/about', async (req, res) => {
  const viewModel = await createViewModel('about', req);
  
  try {
    // Hakkımızda sayfası yorumlarını getir
    const Comment = require('./models/Comment');
    const aboutComments = await Comment.find({ isAboutComment: true, isActive: true })
      .populate('author', 'username profileImage role')
      .sort({ createdAt: -1 });
    
    // View modeline yorumları ekle
    viewModel.aboutComments = aboutComments;
  } catch (error) {
    console.error('Hakkımızda yorumlarını getirme hatası:', error);
    viewModel.aboutComments = [];
  }
  
  res.render('about', viewModel);
});

// Eski ana sayfa rotası (geriye dönük uyumluluk için)
app.get('/index', async (req, res) => {
  res.redirect('/');
});

// Use routes
app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

// Silah model resimlerini okuma fonksiyonu
function getWeaponModels(dirPath) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Klasör yoksa boş dizi döndür
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    
    // Klasördeki dosyaları oku
    const files = fs.readdirSync(dirPath);
    
    // Sadece resimleri filtrele (.png, .jpg, .jpeg, .gif)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif'].includes(ext);
    });
    
    // Her resim için gerekli bilgileri çıkar
    return imageFiles.map(file => {
      const fileName = path.basename(file);
      const fileNameWithoutExt = path.basename(file, path.extname(file));
      const publicPath = `/${dirPath.replace('public/', '')}/${fileName}`;
      
      return {
        name: fileNameWithoutExt,
        path: publicPath,
        fullPath: path.join(dirPath, fileName)
      };
    });
  } catch (error) {
    console.error(`Silah modelleri okunurken hata: ${dirPath}`, error);
    return [];
  }
}

// Saatlik oyuncu kontrolü ve profil fotoğrafı güncelleme işlevi
async function updateActivePlayersAndProfiles() {
  console.log('Aktif oyuncuları kontrol etme ve profil fotoğraflarını güncelleme görevi başlatıldı');
  try {
    // Sunucudan aktif oyuncuları çek
    const data = await fetchPlayerData();
    const activePlayers = data.playersList || [];
    
    if (activePlayers.length > 0) {
      for (const player of activePlayers) {
        // Kullanıcı adına göre oyuncuyu veritabanında bul
        const username = player.name.trim();
        if (!username) continue;
        
        const user = await User.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } });
        
        if (user) {
          // Kullanıcı bulunursa aktif olarak işaretle ve son giriş zamanını güncelle
          user.lastActive = new Date();
          user.isOnline = true;
          
          // Eğer kullanıcının profil fotoğrafı yoksa varsayılan bir fotoğraf ekle
          if (!user.profileImage || user.profileImage === '/images/default-profile.png') {
            // Varsayılan fotoğrafları MongoDB'ye base64 olarak kaydedebiliriz
            // Burada sadece bir referans ekliyoruz, gerçek uygulamada base64 şeklinde kaydedilebilir
            user.profileImageData = {
              data: Buffer.from('/images/default-profile.png'),
              contentType: 'image/png'
            };
          }
          
          await user.save();
        }
      }
      
      // Sunucuda olmayan kullanıcıları çevrimdışı olarak işaretle
      await User.updateMany(
        { 
          username: { $nin: activePlayers.map(p => p.name) },
          isOnline: true 
        },
        { 
          isOnline: false 
        }
      );
      
      console.log(`${activePlayers.length} aktif oyuncu işlendi`);
    }
  } catch (error) {
    console.error('Aktif oyuncu güncelleme hatası:', error);
  }
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connected');
  
  // Belirtilen e-posta adresine site kurucusu yetkisi ver
  User.findOne({ email: 'ofof24637yo@gmail.com' })
    .then(user => {
      if (user) {
        user.role = 'site_kurucusu';
        user.hideRole = false; // Rol etiketini gizle
        return user.save();
      } else {
        console.log('Belirtilen e-posta adresiyle kullanıcı bulunamadı');
      }
    })
    .then(updatedUser => {
      if (updatedUser) {
        console.log(`${updatedUser.email} adresli kullanıcıya site kurucusu yetkisi verildi (gizli)`);
      }
    })
    .catch(err => {
      console.error('Kullanıcı yetkisi güncelleme hatası:', err);
    });
  
  // Saatlik cron görevi başlat (her saat başı çalışacak)
  cron.schedule('0 * * * *', () => {
    updateActivePlayersAndProfiles();
  });
  
  // İlk çalıştırma - sunucu başladığında hemen kontrol et
  updateActivePlayersAndProfiles();
  
  // Sunucuyu başlat
  app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
}); 
