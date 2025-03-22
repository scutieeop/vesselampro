const mongoose = require('mongoose');
const Map = require('../models/Map');
const dotenv = require('dotenv');

// .env dosyasını yükle
dotenv.config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB\'ye bağlandı!'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Örnek harita verileri
const maps = [
  {
    name: 'Dust II',
    code: 'de_dust2',
    description: 'Counter-Strike tarihinin en popüler haritası. Bombayı kurmak için iki bölge içeren dengeli bir harita.',
    imageUrl: '/images/maps/de_dust2.jpg',
    type: 'de',
    ctWinRate: 51,
    isOfficial: true,
    isCustom: false
  },
  {
    name: 'Italy',
    code: 'cs_italy',
    description: 'İtalya\'da geçen, rehineleri kurtarmak için tasarlanmış klasik bir harita.',
    imageUrl: '/images/maps/cs_italy.jpg',
    type: 'cs',
    ctWinRate: 45,
    isOfficial: true,
    isCustom: false
  },
  {
    name: 'Assault',
    code: 'cs_assault',
    description: 'Depo binasında geçen, CT\'lerin rehineleri kurtarmak için zorlu bir görevi tamamlaması gereken harita.',
    imageUrl: '/images/maps/cs_assault.jpg',
    type: 'cs',
    ctWinRate: 35,
    isOfficial: true,
    isCustom: false
  },
  {
    name: 'Nuke',
    code: 'de_nuke',
    description: 'Nükleer tesiste geçen, çoklu katlı yapıya sahip taktiksel bir bomba haritası.',
    imageUrl: '/images/maps/de_nuke.jpg',
    type: 'de',
    ctWinRate: 60,
    isOfficial: true,
    isCustom: false
  },
  {
    name: 'Inferno',
    code: 'de_inferno',
    description: 'İtalyan köyünde geçen, dar sokakları ve çoklu rotalarıyla stratejik oyun gerektiren bir harita.',
    imageUrl: '/images/maps/de_inferno.jpg',
    type: 'de',
    ctWinRate: 53,
    isOfficial: true,
    isCustom: false
  },
  {
    name: 'Aim Map',
    code: 'aim_map',
    description: 'Nişancılık becerilerini geliştirmek için özel olarak tasarlanmış bir eğitim haritası.',
    imageUrl: '/images/maps/aim_map.jpg',
    type: 'aim',
    ctWinRate: 50,
    isOfficial: false,
    isCustom: true
  },
  {
    name: 'AWP India',
    code: 'awp_india',
    description: 'Sadece AWP kullanımına özel, keskin nişancı becerilerini test etmek için bir harita.',
    imageUrl: '/images/maps/awp_india.jpg',
    type: 'awp',
    ctWinRate: 50,
    isOfficial: false,
    isCustom: true
  },
  {
    name: 'FightYard',
    code: 'fy_snow',
    description: 'Karlı bir alanda, silahları satın alarak deathmatch oynamak için tasarlanmış bir harita.',
    imageUrl: '/images/maps/fy_snow.jpg',
    type: 'fy',
    ctWinRate: 50,
    isOfficial: false,
    isCustom: true
  },
  {
    name: 'Office',
    code: 'cs_office',
    description: 'Ofis binasında geçen, rehineleri kurtarmak için tasarlanmış popüler bir harita.',
    imageUrl: '/images/maps/cs_office.jpg',
    type: 'cs',
    ctWinRate: 40,
    isOfficial: true,
    isCustom: false
  },
  {
    name: 'Train',
    code: 'de_train',
    description: 'Tren istasyonunda geçen, açık ve kapalı alanları dengeli bir şekilde birleştiren klasik bir harita.',
    imageUrl: '/images/maps/de_train.jpg',
    type: 'de',
    ctWinRate: 55,
    isOfficial: true,
    isCustom: false
  }
];

// Veritabanını temizle ve yeni haritaları ekle
async function seedMaps() {
  try {
    // Önce mevcut haritaları temizle
    await Map.deleteMany({});
    console.log('Mevcut haritalar temizlendi');
    
    // Yeni haritaları ekle
    await Map.insertMany(maps);
    console.log('10 örnek harita başarıyla eklendi!');
    
    // Bağlantıyı kapat
    mongoose.connection.close();
  } catch (error) {
    console.error('Harita seeding hatası:', error);
    mongoose.connection.close();
  }
}

// Seeder'ı çalıştır
seedMaps(); 