# Cosmetic Ingredient Analyzer - Bitirme Projesi

## Proje Özeti
Kozmetik ürünlerin içeriklerini analiz eden mobil uygulama. Kullanıcılar ürün içeriklerini kamera ile tarayarak veya metin olarak girerek, cilt tiplerine uygunluğunu öğrenebilir.

## Teknoloji Stack
- **Frontend:** React Native (Expo) - `/mobile` klasörü
- **Backend:** Python FastAPI (sonra eklenecek)

## Ekranlar
1. SplashScreen → WelcomeScreen → Login/SignUp → SkinTypeScreen → MainTabs
2. MainTabs: Home, Scan, History, Profile (bottom tabs)
3. Stack ekranlar: ManualEntry, AnalysisResult, IngredientDetail

## Tasarım Kararları
- Puanlama sistemi YOK - içerik bazlı Safe / Medium Risk / Unsafe gösterimi
- Her içeriğin detay sayfası: açıklama, risk nedeni, cilt tipi uygunluğu, öneri
- Renk paleti: Turkuaz (#4ECDC4) → Mor (#7B68EE) gradient
- Safe: Yeşil (#22C55E), Medium Risk: Turuncu (#F97316), Unsafe: Kırmızı (#EF4444)

## Cilt Tipleri
Normal, Dry, Oily, Combination, Sensitive

## Komutlar
```bash
cd mobile && npm install && npx expo start
```

## Kurallar
- Şu an sadece frontend, backend sonra eklenecek
- Mock data kullanılıyor (backend entegrasyonuna kadar)
- Türkçe commit mesajları yazılabilir
