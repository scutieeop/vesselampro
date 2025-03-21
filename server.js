const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');



// 





const app = express();
const PORT = process.env.PORT || 3000;

// Sunucu her başlatıldığında yeni bir session ID oluştur
const SERVER_SESSION_ID = Date.now().toString();
console.log('Server started with session ID:', SERVER_SESSION_ID);

// Statik dosyalar için klasör ayarı
app.use(express.static(path.join(__dirname, 'public')));

// View engine ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
        serverIP: serverIp || "213.238.173.25:27015",
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
        serverIP: "213.238.173.25:27015",
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
async function createViewModel(activePage) {
  try {
    const data = await fetchPlayerData();
    return {
      ...data,
      activePage // Aktif sayfayı modele ekle (navbar için gerekli)
    };
  } catch (error) {
    console.error('ViewModel oluşturma hatası:', error);
    return {
      serverData: {
        serverName: "VESSELAM PRO PUBLIC [REVIVE + HEAL BOMB]",
        serverIP: "213.238.173.25:27015",
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
      activePage // Aktif sayfayı modele ekle (navbar için gerekli)
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
  const viewModel = await createViewModel('home');
  res.render('home', viewModel);
});

// Oyuncular sayfası
app.get('/players', async (req, res) => {
  const viewModel = await createViewModel('players');
  res.render('players', viewModel);
});

// İstatistikler sayfası
app.get('/stats', async (req, res) => {
  const viewModel = await createViewModel('stats');
  res.render('stats', viewModel);
});

// Silah modelleri sayfası
app.get('/weapons', async (req, res) => {
  const viewModel = await createViewModel('weapons');
  
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

// Haritalar sayfası
app.get('/maps', async (req, res) => {
  const viewModel = await createViewModel('maps');
  res.render('maps', viewModel);
});

// Hakkında/İletişim sayfası
app.get('/about', async (req, res) => {
  const viewModel = await createViewModel('about');
  res.render('about', viewModel);
});

// Eski ana sayfa rotası (geriye dönük uyumluluk için)
app.get('/index', async (req, res) => {
  res.redirect('/');
});

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

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
}); 