// Rozet tanımları
// Her rozetin bir ID'si, koşulu ve görsel bilgileri var.
// condition fonksiyonu stats objesi alır ve kazanılıp kazanılmadığını döndürür.

export const BADGES = [
  // Tarama milestone'ları
  {
    id: 'first_scan',
    title: 'İlk Adım',
    description: 'İlk ürün analizini yap',
    icon: 'search',
    color: '#4ECDC4',
    condition: (stats) => stats.totalScans >= 1,
  },
  {
    id: 'scan_5',
    title: 'Meraklı',
    description: '5 ürün analiz et',
    icon: 'flask',
    color: '#6366F1',
    condition: (stats) => stats.totalScans >= 5,
    target: 5,
    statKey: 'totalScans',
  },
  {
    id: 'scan_10',
    title: 'İçerik Dedektifi',
    description: '10 ürün analiz et',
    icon: 'shield-checkmark',
    color: '#7B68EE',
    condition: (stats) => stats.totalScans >= 10,
    target: 10,
    statKey: 'totalScans',
  },
  {
    id: 'scan_25',
    title: 'Kozmetik Uzmanı',
    description: '25 ürün analiz et',
    icon: 'star',
    color: '#F59E0B',
    condition: (stats) => stats.totalScans >= 25,
    target: 25,
    statKey: 'totalScans',
  },

  // Güvenli ürün rozetleri
  {
    id: 'safe_3',
    title: 'Cilt Dostu',
    description: 'Arka arkaya 3 güvenli ürün bul',
    icon: 'heart',
    color: '#22C55E',
    condition: (stats) => stats.safeStreak >= 3,
  },
  {
    id: 'safe_streak_7',
    title: 'Bilinçli Tüketici',
    description: 'Arka arkaya 7 güvenli ürün bul',
    icon: 'leaf',
    color: '#10B981',
    condition: (stats) => stats.safeStreak >= 7,
  },

  // Riskli ürün farkındalığı
  {
    id: 'found_risky',
    title: 'Dikkatli Göz',
    description: 'İlk riskli içerik tespit et',
    icon: 'warning',
    color: '#F97316',
    condition: (stats) => stats.riskyFound >= 1,
  },
  {
    id: 'found_risky_10',
    title: 'Risk Avcısı',
    description: '10 üründe riskli içerik tespit et',
    icon: 'eye',
    color: '#EF4444',
    condition: (stats) => stats.riskyFound >= 10,
    target: 10,
    statKey: 'riskyFound',
  },

  // Kullanım alışkanlığı
  {
    id: 'streak_3',
    title: 'Düzenli Kullanıcı',
    description: '3 gün üst üste analiz yap',
    icon: 'flame',
    color: '#F97316',
    condition: (stats) => stats.dailyStreak >= 3,
  },
  {
    id: 'streak_7',
    title: 'Haftalık Alışkanlık',
    description: '7 gün üst üste analiz yap',
    icon: 'trophy',
    color: '#EAB308',
    condition: (stats) => stats.dailyStreak >= 7,
  },

  // Öğrenme
  {
    id: 'detail_view',
    title: 'Araştırmacı',
    description: '5 içerik detayını incele',
    icon: 'book',
    color: '#8B5CF6',
    condition: (stats) => stats.detailViews >= 5,
    target: 5,
    statKey: 'detailViews',
  },

  // Manuel giriş
  {
    id: 'manual_entry',
    title: 'El Yazısı',
    description: 'İlk kez manuel içerik girişi yap',
    icon: 'create',
    color: '#06B6D4',
    condition: (stats) => stats.manualEntries >= 1,
  },
];
