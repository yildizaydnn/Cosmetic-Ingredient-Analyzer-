
# Skincare Ingredient Analysis API — Mimari Dokümanı

## Projenin Amacı

Kullanıcı cilt tipini seçer, bir kozmetik ürünün INCI (içerik) listesinin **fotoğrafını** yükler. Sistem görselden OCR ile metni çıkarır, her maddeyi tek tek analiz eder ve üç gruba ayırır: **faydalı**, **dikkatli kullanılmalı**, **nötr**. Tanıyamadığı maddeleri de ayrıca belirtir. Zamanla kullanıcı geri bildirimleriyle kendini düzeltir.

> Bu bir "yüzde skoru" sistemi değildir. "%78 uygun" gibi bir çıktı yoktur. Her madde ayrı ayrı sınıflandırılır.

---

## Dizin Yapısı

```
backend/
├── app/
│   ├── main.py                     ← Uygulama giriş noktası
│   ├── config.py                   ← Tüm ayarlar (eşikler, ağırlıklar, API anahtarları)
│   ├── database.py                 ← PostgreSQL bağlantısı
│   ├── api/
│   │   ├── router.py               ← /api/v1 altındaki tüm route'ları birleştirir
│   │   ├── analysis.py             ← /analyze, /analyze-text, /analyze-ocr, /debug-ocr
│   │   ├── ingredients.py          ← GET  /api/v1/ingredients
│   │   └── feedback.py             ← POST /api/v1/feedback
│   ├── schemas/
│   │   ├── analysis.py             ← Request/Response Pydantic modelleri
│   │   └── feedback.py             ← Feedback Pydantic modelleri
│   ├── services/
│   │   ├── ocr.py                  ← Görselden metin çıkarma (vision AI → Tesseract)
│   │   ├── ingredient_loader.py    ← CSV'yi belleğe yükleme + yeni madde kaydetme
│   │   ├── analyzer.py             ← Parse + normalize + match + sınıfla (tek orkestratör)
│   │   ├── ai_analyzer.py          ← Sözlükte olmayan maddeleri DeepSeek ile analiz
│   │   ├── product_summary.py      ← Analiz sonucundan doğal dil ürün özeti
│   │   └── feedback_engine.py      ← Geri bildirim kaydetme
│   └── models/
│       ├── ingredient.py           ← Ingredient ORM modeli
│       └── feedback.py             ← Feedback + Analysis ORM modelleri
├── data/
│   ├── master_expanded.csv         ← ~1900 maddelik ana sözlük (aktif kaynak)
│   ├── dataset.csv                 ← Ara çıktı / arşiv
│   └── dataset_enriched.csv        ← Ara çıktı / arşiv
├── scripts/
│   ├── seed_db.py                  ← CSV → PostgreSQL aktarma
│   ├── enrich_dataset.py           ← Sözlüğü AI ile zenginleştirme
│   └── batch_update_scores.py      ← Birikmiş feedback'lerden öğrenme
├── tests/
│   ├── test_parser.py
│   ├── test_matcher.py
│   ├── test_analyzer.py
│   ├── test_feedback.py
│   ├── test_ocr.py                 ← Gerçek görsellerle OCR doğruluk ölçümü
│   └── test_images/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── requirements-dev.txt            ← pytest + pytest-asyncio
```

---

## Uçtan Uca Veri Akışı

Aşağıdaki şema, bir kullanıcı isteğinin sistemde nasıl aktığını gösterir:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  KULLANICI                                                                  │
│  "Cilt tipim: sensitive"                                                    │
│  📷 INCI etiketinin fotoğrafını yükler (form-data: image dosyası)          │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. API KATMANI  (app/api/analysis.py)                                      │
│                                                                             │
│  POST /api/v1/analyze  (multipart/form-data)                                │
│  • Form alanları: skin_type, language                                       │
│  • Dosya alanı: image (JPEG/PNG/WebP, max 10 MB)                           │
│  • Dosya formatı ve boyutu doğrulanır                                       │
│  • Görsel OCR servisine iletilir                                            │
│                                                                             │
│  Hata durumları:                                                            │
│  • 400 — Unsupported file format. Please upload a JPEG, PNG, or WebP image. │
│  • 400 — File size must not exceed 10 MB.                                   │
│  • 422 — Could not extract text from the image. Please upload a clearer     │
│          photo.                                                             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1.5. OCR SERVİSİ  (app/services/ocr.py)                                   │
│                                                                             │
│  extract_text_from_image(image_bytes)  — iki kademeli                       │
│                                                                             │
│  KADEME 1 — Vision AI (birincil yol)                                        │
│  • Görsel 1024px'e küçültülüp JPEG olarak sıkıştırılır                     │
│  • OpenRouter üzerinden vision modeline gönderilir                          │
│    (google/gemini-2.5-flash → google/gemini-2.0-flash-001 sırayla denenir)  │
│  • Model hem INCI listesini okur hem ürünün kozmetik olup olmadığına karar  │
│    verir → kozmetik değilse "NOT_COSMETIC" döner                            │
│  • OPENROUTER_API_KEY yoksa bu kademe atlanır                               │
│                                                                             │
│  KADEME 2 — Tesseract + DeepSeek (fallback)                                 │
│  • Görsel 3000px'e büyütülür, gri tonlamaya çevrilir                       │
│  • Koyu arka plan tespit edilirse renk ters çevrilir (invert)               │
│  • 5–9 farklı kontrast/threshold/psm kombinasyonuyla çoklu OCR yapılır      │
│  • Tüm pass'ler birleştirilip DeepSeek'e gönderilir, OCR hataları           │
│    düzeltilir ("Glycenn" → "Glycerin")                                      │
│  • DeepSeek de yoksa ham Tesseract çıktısından INCI bölümü regex ile        │
│    ayıklanır                                                                │
│                                                                             │
│  Bağımlılık: Sistemde Tesseract OCR kurulu olmalı                           │
│    macOS:  brew install tesseract                                           │
│    Docker: apt-get install tesseract-ocr                                    │
│                                                                             │
│  Çıktı: "Aqua, Glycerin, Niacinamide, Salicylic Acid, Parfum"             │
│  Boş çıktı     → HTTP 422 hatası döner                                     │
│  NOT_COSMETIC  → HTTP 422 "kozmetik ürün değil" mesajı döner               │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. ANALİZ SERVİSİ  (app/services/analyzer.py)                             │
│                                                                             │
│  Tüm analiz mantığı tek dosyada: parse, normalize, match, sınıfla.        │
│                                                                             │
│  ADIM A — PARSE                                                             │
│  "Aqua, Glycerin, Niacinamide, Salicylic Acid, Parfum"                    │
│  → Virgülle ayır, boşlukları temizle, sıralamayı koru                     │
│  → ["Aqua", "Glycerin", "Niacinamide", "Salicylic Acid", "Parfum"]       │
│                                                                             │
│  ADIM B — NORMALİZASYON (her madde için)                                   │
│  "Salicylic Acid" → küçük harf → parantez kaldır → özel kar. sil          │
│  → "salicylicacid"                                                         │
│                                                                             │
│  ADIM C — EŞLEŞTIRME (üç aşamalı, hızlıdan yavaşa)                       │
│  1. Eşanlamlı haritası (SYNONYMS):                                         │
│     "aqua" → "water", "parfum" → "fragrance", ...                         │
│  2. Tam eşleşme: O(1) dict lookup                                          │
│  3. Bulanık eşleşme (RapidFuzz): skor ≥ 85 → kabul, altı → "unknown"     │
│                                                                             │
│  ADIM D — SINIFLANDIRMA (her eşleşen madde için)                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  a) SKOR HESAPLAMA                                                  │    │
│  │     CSV'den ilgili cilt tipinin skoru okunur.                       │    │
│  │     Örn: skin_type="sensitive" → score_sensitive kolonuna bakılır   │    │
│  │                                                                     │    │
│  │     Salicylic Acid → score_sensitive = -2.0                         │    │
│  │     Glycerin       → score_sensitive = +3.0                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  b) ETKİ BELİRLEME (effect)                                        │    │
│  │                                                                     │    │
│  │     skor ≥ +2.0   →  "beneficial"  (faydalı)                       │    │
│  │     skor ≤ -1.0   →  "caution"    (dikkatli kullanılmalı)          │    │
│  │     arada         →  "neutral"    (nötr)                            │    │
│  │                                                                     │    │
│  │     Bu eşik değerleri config.py'den okunur, hardcode değildir.      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  c) POZİSYON AĞIRLIĞI                                              │    │
│  │                                                                     │    │
│  │     INCI listesinde sıra = konsantrasyon demek.                     │    │
│  │     Baştaki maddeler üründe daha yoğundur.                          │    │
│  │                                                                     │    │
│  │     Sıra  1–5   →  ağırlık: 1.0  (yüksek konsantrasyon)           │    │
│  │     Sıra  6–15  →  ağırlık: 0.5  (orta konsantrasyon)             │    │
│  │     Sıra  16+   →  ağırlık: 0.2  (düşük konsantrasyon)            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  d) GRUPLAMA VE SIRALAMA                                           │    │
│  │                                                                     │    │
│  │     Maddeler 4 gruba ayrılır:                                       │    │
│  │     • beneficial — faydalı maddeler                                 │    │
│  │     • caution   — dikkat edilmesi gerekenler                        │    │
│  │     • neutral   — nötr maddeler                                     │    │
│  │     • unknown   — veritabanında bulunamayanlar                      │    │
│  │                                                                     │    │
│  │     beneficial ve caution grupları kendi içinde:                     │    │
│  │       pozisyon ağırlığı yüksek olan önce (1.0 > 0.5 > 0.2)        │    │
│  │       aynı ağırlıkta ise listede öne olan önce                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. KOZMETİK ÜRÜN DOĞRULAMASI  (analyzer._is_cosmetic_product)             │
│                                                                             │
│  Yalnızca "kaç madde tanındı" oranına bakmak yetmez — kısa Türkçe kelimeler │
│  (un, tuz, süt) fuzzy eşleşmede sahte pozitif üretir. Bu yüzden iki ölçüt:  │
│                                                                             │
│  • marker_hits    — bilinen kozmetik marker'larından (aqua, glycerin,       │
│                     phenoxyethanol, parfum, ...) kaç tanesi geçiyor         │
│  • strong_matches — normalize uzunluğu ≥ 5 olan tam eşleşme sayısı          │
│                                                                             │
│  Kabul koşulu: marker_hits ≥ 2  VEYA  strong_matches ≥ 3                    │
│                                                                             │
│  Geçemezse: is_cosmetic=false + rejection_reason ile boş gruplar döner       │
│  (HTTP 200, hata değil).                                                    │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. BİLİNMEYEN MADDELERİN AI ANALİZİ  (app/services/ai_analyzer.py)        │
│                                                                             │
│  Sözlükte bulunamayan maddeler toplu halde DeepSeek'e gönderilir.           │
│  Model her madde için 7 cilt tipinin tamamına kategori + açıklama + skor    │
│  üretir (JSON mode).                                                        │
│                                                                             │
│  • Dönen sonuçlar beneficial / caution / neutral gruplarına dağıtılır,      │
│    `source: "ai"` ile işaretlenir                                           │
│  • Çöp filtresinden geçenler CSV sözlüğüne kalıcı olarak eklenir            │
│    (ingredient_loader.save_new_ingredient) → sözlük zamanla büyür           │
│  • Çöp kriteri: kategori "bilinmeyen/kozmetik dışı", ad çok kısa/uzun,      │
│    harf içermiyor, kontrol karakteri var                                    │
│                                                                             │
│  DEEPSEEK_API_KEY yoksa bu adım atlanır, maddeler `unknown` kalır.          │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. ÜRÜN ÖZETİ  (app/services/product_summary.py)                          │
│                                                                             │
│  Gruplanmış sonuç + cilt tipi DeepSeek'e verilir, 3–4 cümlelik doğal dil    │
│  değerlendirme üretilir → `product_summary` alanı.                          │
│                                                                             │
│  Hata veya anahtar yokluğunda None döner; analiz yine de tamamlanır.        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. RESPONSE                                                                │
│                                                                             │
│  {                                                                          │
│    "is_cosmetic": true,                                                     │
│    "skin_type": "sensitive",                                                │
│    "total_ingredients": 5,                                                  │
│    "summary": {                                                             │
│      "beneficial_count": 2,                                                 │
│      "caution_count": 2,                                                    │
│      "neutral_count": 1,                                                    │
│      "unknown_count": 0                                                     │
│    },                                                                       │
│    "beneficial": [                                                          │
│      {                                                                      │
│        "name": "Glycerin",           ← kullanıcının gönderdiği orijinal ad │
│        "category": "Nemlendirici (Humektan)",                               │
│        "reason": "Hassas cilt için faydalı bileşen",                       │
│        "position": 2,               ← INCI listesindeki sırası            │
│        "position_weight": 1.0       ← konsantrasyon ağırlığı              │
│      },                                                                     │
│      ...                                                                    │
│    ],                                                                       │
│    "caution": [                                                             │
│      {                                                                      │
│        "name": "Parfum",             ← kullanıcının yazdığı               │
│        "matched_as": "fragrance",    ← sistemin eşleştirdiği              │
│        "category": "Parfüm / Koku",                                        │
│        "reason": "Hassas ciltte tahriş riski taşır",                       │
│        ...                                                                  │
│      }                                                                      │
│    ],                                                                       │
│    "neutral": [ ... ],                                                      │
│    "unknown": [ ... ],                                                      │
│    "disclaimer": "Bu analiz genel bilgi amaçlıdır, tıbbi tavsiye          │
│                   niteliği taşımaz.",                                       │
│    "product_summary": "Bu ürün hassas cildiniz için genel olarak ..."      │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Bellekteki Sözlük (Ingredient Index)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  UYGULAMA BAŞLANGIÇI (main.py → lifespan)                                   │
│                                                                             │
│  master_expanded.csv dosyası bir kez okunur ve belleğe yüklenir:           │
│                                                                             │
│  _ingredient_index = {                                                      │
│    "glycerin":       { name, scores, category, reasons, ... },             │
│    "niacinamide":    { name, scores, category, reasons, ... },             │
│    "salicylicacid":  { name, scores, category, reasons, ... },             │
│    "fragrance":      { name, scores, category, reasons, ... },             │
│    "water":          { name, scores, category, reasons, ... },             │
│    ... (~1500+ madde)                                                       │
│  }                                                                          │
│                                                                             │
│  Anahtar: name_normalized (küçük harf, alfanumerik)                        │
│  Değer: CSV satırının tüm kolonları (dict)                                 │
│                                                                             │
│  ⚠ API çağrılarında CSV tekrar okunmaz. Her şey bellekten gelir.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CSV'deki Her Maddenin Yapısı

Her ingredient kaydında şu bilgiler bulunur:

```
┌──────────────────────┬────────────────────────────────────────────────────┐
│  ALAN                │  AÇIKLAMA                                          │
├──────────────────────┼────────────────────────────────────────────────────┤
│  name                │  Orijinal adı: "Salicylic Acid"                   │
│  name_normalized     │  Eşleşme anahtarı: "salicylicacid"               │
│  category            │  İngilizce kategori: "Exfoliant (BHA)"            │
│  category_tr         │  Türkçe kategori: "Peeling Asidi (BHA)"          │
├──────────────────────┼────────────────────────────────────────────────────┤
│  score_dry           │  Kuru cilt skoru: +3.0 (faydalı)                  │
│  score_oily          │  Yağlı cilt skoru: +2.0                          │
│  score_sensitive     │  Hassas cilt skoru: -2.0 (dikkat)                 │
│  score_...           │  7 farklı cilt tipi için ayrı skorlar             │
├──────────────────────┼────────────────────────────────────────────────────┤
│  dry_effect          │  "beneficial" / "caution" / "neutral"             │
│  dry_reason_tr       │  "Kuru cilt için faydalı bileşen"                │
│  dry_reason_en       │  "Beneficial for dry skin"                        │
│  ...                 │  Her cilt tipi için 3'lü grup (effect+reason)     │
├──────────────────────┼────────────────────────────────────────────────────┤
│  good_tags           │  "Acne|Redness|Texture" (pipe ile ayrılmış)      │
│  avoid_tags          │  "Sensitive|Impaired skin barrier"                │
│  product_frequency   │  Kaç üründe geçiyor (güvenilirlik göstergesi)    │
└──────────────────────┴────────────────────────────────────────────────────┘
```

---

## Feedback (Geri Bildirim) Sistemi

Kullanıcılar bir analiz sonucuna "olumlu", "nötr" veya "olumsuz" geri bildirim verebilir. Sistem bu geri bildirimlerden öğrenerek kendini düzeltir.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FEEDBACK AKIŞI                                                             │
│                                                                             │
│  1. Kullanıcı analiz yaptırır → analysis_id alır                           │
│  2. Ürünü dener, tepki gözlemler                                           │
│  3. POST /api/v1/feedback gönderir:                                        │
│     { analysis_id, skin_type, outcome: "negative", ingredients_text }      │
│                                                                             │
│  ⚠ Her analysis_id için yalnızca 1 feedback kabul edilir (spam koruması)  │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FEEDBACK VERİTABANINA YAZILIR                                              │
│                                                                             │
│  feedback tablosu:                                                          │
│  ┌──────────┬────────────┬───────────┬──────────┬──────────────────────┐   │
│  │ id (UUID)│ analysis_id│ skin_type │ outcome  │ ingredients_json     │   │
│  │ ...      │ abc-123    │ sensitive │ negative │ ["Glycerin","Parfum"]│   │
│  └──────────┴────────────┴───────────┴──────────┴──────────────────────┘   │
│                                                                             │
│  Skor güncelleme HEMEN yapılmaz. Feedback sadece kaydedilir.               │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PERİYODİK BATCH GÜNCELLEME  (scripts/batch_update_scores.py)               │
│  Günde 1 kez veya yeterli feedback birikince çalıştırılır.                 │
│                                                                             │
│  Temel kural: BASE SKOR ASLA DEĞİŞMEZ. Sadece DELTA güncellenir.         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  final_skor = base_skor + delta                                     │    │
│  │                                                                     │    │
│  │  Örnek:                                                             │    │
│  │  Glycerin'in score_sensitive = +3.0  (base, hiç değişmez)          │    │
│  │  20+ negatif feedback gelirse → delta_sensitive = -0.4              │    │
│  │  Yeni final skor: 3.0 + (-0.4) = 2.6  (hâlâ beneficial)          │    │
│  │                                                                     │    │
│  │  Neden böyle?                                                       │    │
│  │  Kötü feedback birikse bile base'e dönmek her zaman mümkün.        │    │
│  │  Delta'yı sıfırlarsanız, orijinal skorlara geri dönersiniz.       │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Güncelleme formülü:                                                        │
│                                                                             │
│    delta += öğrenme_hızı × (kullanıcı_tepkisi − mevcut_etki) × pozisyon   │
│                                                                             │
│    öğrenme_hızı     = 0.01  (çok küçük, stabil öğrenme)                    │
│    kullanıcı_tepkisi = positive: +1 / neutral: 0 / negative: -1            │
│    mevcut_etki       = beneficial: +1 / neutral: 0 / caution: -1           │
│    pozisyon          = maddenin INCI sırasına göre ağırlığı                │
│                                                                             │
│  Güvenlik sınırları:                                                        │
│    • Delta en fazla ±2.0 olabilir (base skoru tamamen tersine çeviremez)   │
│    • Bir madde için en az 20 feedback birikmeden güncelleme yapılmaz       │
│    • Learning rate kasıtlı olarak düşük tutulur (0.01)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Veritabanı Şeması

```
┌─────────────────────────┐     ┌─────────────────────────┐
│      ingredients        │     │       feedback           │
├─────────────────────────┤     ├─────────────────────────┤
│ id (PK, serial)        │     │ id (PK, UUID)           │
│ name                    │     │ analysis_id (UUID)      │──┐
│ name_normalized (unique)│     │ skin_type               │  │
│ category                │     │ outcome                 │  │
│ category_tr             │     │ ingredients_json (JSONB)│  │
│ short_description       │     │ created_at              │  │
│ description_tr          │     └─────────────────────────┘  │
│ score_dry ... (7 skor)  │                                   │
│ delta_dry ... (7 delta) │     ┌─────────────────────────┐  │
│ good_tags               │     │       analyses          │  │
│ avoid_tags              │     ├─────────────────────────┤  │
│ source                  │     │ id (PK, UUID)           │←─┘
│ product_frequency       │     │ skin_type               │
│ feedback_count          │     │ ingredients_text        │
│ created_at              │     │ result_json (JSONB)     │
│ updated_at              │     │ created_at              │
└─────────────────────────┘     └─────────────────────────┘
```

---

## API Endpoint'leri

### POST /api/v1/analyze
Ana analiz endpointi. INCI etiketinin fotoğrafını alır, OCR ile metni çıkarır, analiz eder, sonuç döner.

```
İstek (multipart/form-data):
  skin_type:  "sensitive"  (form field, enum: dry/oily/combination/normal/sensitive/mature/pregnancy_safe)
  language:   "tr" veya "en"  (form field, varsayılan: "tr")
  image:      dosya  (file upload, JPEG/PNG/WebP, max 10 MB)

Hata yanıtları:
  400 — "Unsupported file format. Please upload a JPEG, PNG, or WebP image."
  400 — "File size must not exceed 10 MB."
  422 — "Could not extract text from the image. Please upload a clearer photo."

  422 — "Bu ürün bir cilt bakım/kozmetik ürünü olarak algılanmadı..."

Başarılı yanıt:
  is_cosmetic, rejection_reason,
  skin_type, total_ingredients, summary (sayımlar),
  beneficial[], caution[], neutral[], unknown[],
  disclaimer (tıbbi uyarı),
  product_summary (AI ürün yorumu — DEEPSEEK_API_KEY varsa)

Not: response_model_exclude_none=True — null alanlar yanıtta yer almaz.
```

### POST /api/v1/analyze-text
Elle girilen INCI metnini analiz eder. Mobil `ManualEntryScreen` bu endpointi kullanır.

```
İstek (application/json):
  { "skin_type": "sensitive", "ingredients_text": "Aqua, Glycerin, ...", "language": "tr" }

Yanıt: /analyze ile aynı şema.
```

### POST /api/v1/analyze-ocr
Cihaz tarafında üretilmiş **ham** OCR metnini önce DeepSeek ile düzeltir, sonra analiz eder.

```
İstek (application/json):
  { "skin_type": "sensitive", "raw_ocr_text": "Awa, Glycenn, ...", "language": "tr" }

Hata yanıtı:
  422 — "Could not extract ingredients from the OCR text..."
        (DEEPSEEK_API_KEY tanımlı değilse de bu hata döner)

Yanıt: /analyze ile aynı şema.
```

### POST /api/v1/debug-ocr
Geliştirme aracı. Bir görsel için Tesseract ham çıktısını ve DeepSeek düzeltmesini
yan yana döner: `{ raw_tesseract, ai_cleaned, final_output }`.

### GET /api/v1/ingredients?search=glyc&limit=10
Madde arama/autocomplete endpointi. Bellekteki sözlük üzerinde, isim veya
normalized isim içinde alt dizi araması yapar.

### POST /api/v1/feedback
Kullanıcı geri bildirimi kaydeder. **PostgreSQL bağlantısı gerektiren tek endpointtir.**
Aynı `analysis_id` için tekrar gönderilirse HTTP 409 döner.

### GET /health
Sağlık kontrolü. `{"status": "ok"}` döner.

### GET /docs
FastAPI'nin otomatik Swagger arayüzü.

---

## Konfigürasyon (config.py)

Tüm eşik değerler, ağırlıklar ve parametreler tek bir yerden yönetilir. Hiçbir değer kodda sabit (hardcode) yazılmaz.

| Parametre | Varsayılan | Açıklama |
|---|---|---|
| `match_threshold` | 85 | Fuzzy eşleşme minimum benzerlik skoru |
| `score_beneficial_threshold` | +2.0 | Bu ve üstü → "faydalı" |
| `score_caution_threshold` | -1.0 | Bu ve altı → "dikkatli kullanılmalı" |
| `position_weight_top` | 1.0 | İlk 5 madde (yüksek konsantrasyon) |
| `position_weight_mid` | 0.5 | 6–15. maddeler (orta) |
| `position_weight_low` | 0.2 | 16+. maddeler (düşük) |
| `learning_rate` | 0.01 | Feedback öğrenme hızı |
| `min_feedback_threshold` | 20 | Minimum feedback sayısı (güncelleme için) |
| `max_delta` | ±2.0 | Delta sınırı |
| `master_csv_path` | `data/master_expanded.csv` | Sözlük dosyası (**göreli yol** — uvicorn `backend/` dizininden başlatılmalı) |
| `database_url` | `postgresql+asyncpg://skincare:skincare_dev@localhost:5432/skincare` | Yalnızca `/feedback` ve seed için gerekir |

### AI Anahtarları (opsiyonel)

| Parametre | Kullanıldığı yer | Tanımlı değilse |
|---|---|---|
| `openrouter_api_key` | `ocr.py` — vision ile INCI okuma | Tesseract fallback'e düşülür |
| `deepseek_api_key` | `ocr.py` (düzeltme), `ai_analyzer.py`, `product_summary.py` | İlgili adımlar sessizce atlanır |
| `gemini_api_key` | Şu an hiçbir yerde kullanılmıyor | — |

Bu değerler `.env` dosyasından veya ortam değişkenlerinden override edilebilir.

> ⚠️ **Sayısal alanları `.env` içinde boş bırakmayın.** `MATCH_THRESHOLD=` gibi boş bir
> değer pydantic doğrulamasında `int_parsing` hatası verir ve uygulama hiç açılmaz.
> Varsayılanı kullanmak istiyorsanız satırı tamamen silin.

---

## Çalıştırma

```bash
# Kurulum
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Lokal geliştirme (backend/ dizininden — MASTER_CSV_PATH göreli)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Docker ile (Tesseract + PostgreSQL dahil)
docker-compose up --build

# Testler
pip install -r requirements-dev.txt
pytest tests/ -v

# Veritabanı seed (PostgreSQL çalışıyorken, modül olarak çalıştırın)
python -m scripts.seed_db

# Feedback batch güncelleme
python -m scripts.batch_update_scores
```

> `--host 0.0.0.0` mobil uygulamanın LAN üzerinden bağlanabilmesi için gereklidir.
> Ayrıntı için kök dizindeki `README.md` → "Mobil → Backend Bağlantısı".

---

## Özet: İstek Yaşam Döngüsü (Tek Cümleyle)

```
Görsel yükle → OCR ile metin çıkar (vision AI → Tesseract+DeepSeek fallback) →
virgülle parçala → her maddeyi normalize et → sözlükte ara (synonym → exact →
fuzzy) → cilt tipine göre skoru bul → eşiklerle sınıflandır (beneficial/
caution/neutral/unknown) → gerçekten kozmetik mi doğrula → bilinmeyenleri
DeepSeek'e sor ve sözlüğe ekle → pozisyon ağırlığıyla sırala → ürün özeti
üret → JSON olarak döndür.
```
