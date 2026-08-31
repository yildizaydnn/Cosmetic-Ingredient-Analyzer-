# Cosmetic Ingredient Analyzer

Kozmetik ürünlerin içeriklerini analiz eden mobil uygulama. Kullanıcılar ürün içeriklerini kamera/galeri ile tarayarak veya metin olarak girerek, cilt tiplerine uygunluğunu öğrenebilir.

Her bir içerik maddesi **faydalı**, **dikkatli kullanılmalı** veya **nötr** olarak sınıflandırılır ve kullanıcının cilt tipine özel açıklama sunulur. Uygulama tek bir yüzde puanı yerine içerik bazlı analiz yaklaşımıyla çalışır.

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Mobil (Frontend)** | React Native (Expo SDK 54), React Navigation |
| **Backend API** | Python 3.12, FastAPI, SQLAlchemy, PostgreSQL |
| **İçerik Eşleştirme** | RapidFuzz (fuzzy matching) + CSV sözlük (~1900 madde) |
| **OCR** | Backend tarafında: OpenRouter vision modeli → fallback Tesseract + DeepSeek |
| **AI Analiz** | DeepSeek (bilinmeyen madde analizi, ürün özeti) |
| **Konteyner** | Docker, docker-compose |

> **Not:** OCR tamamen backend'de çalışır. Mobil uygulama fotoğrafı `POST /api/v1/analyze`'a yükler, metin çıkarma ve analiz sunucuda yapılır.

## Proje Yapısı

```
Cosmetic-Ingredient-Analyzer-/
├── mobile/                # React Native (Expo) mobil uygulama
│   ├── src/
│   │   ├── screens/       # Uygulama ekranları
│   │   ├── components/    # Yeniden kullanılabilir bileşenler
│   │   ├── services/      # API ve veri servisleri (api.js)
│   │   ├── context/       # React Context (Auth, Badge)
│   │   ├── constants/     # Sabitler ve tema
│   │   └── navigation/    # React Navigation yapılandırması
│   ├── assets/            # Görseller
│   ├── app.json           # Expo yapılandırması
│   └── package.json
├── backend/               # FastAPI backend servisi
│   ├── app/               # Uygulama kodu
│   ├── data/              # İçerik sözlüğü (CSV)
│   ├── tests/             # Testler
│   ├── scripts/           # Yardımcı scriptler
│   ├── .env.example       # Ortam değişkeni şablonu
│   ├── ARCHITECTURE.md    # Backend mimari dokümanı
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── requirements-dev.txt
└── README.md
```

## Önkoşullar

| Gereksinim | Sürüm | Kimin için |
|---|---|---|
| **Node.js** | **≥ 20.19.4** (react-native 0.81 şartı) | mobil |
| **npm** | ≥ 9 | mobil |
| **Expo Go** | güncel sürüm | fiziksel cihazda test |
| **Python** | 3.12 | backend (Docker'sız çalıştırma) |
| **Tesseract OCR** | ≥ 5 | backend (Docker'sız çalıştırma) |
| **PostgreSQL** | 16 | backend (yalnızca `/feedback` ve seed için) |
| **Docker & Docker Compose** | güncel | backend (önerilen yol) |

```bash
# macOS
brew install tesseract
```

> Docker ile çalıştırırsanız Tesseract ve PostgreSQL zaten imaj içinde gelir.

## Kurulum ve Çalıştırma

Backend'i **önce** ayağa kaldırın, mobil uygulama ona bağlanır.

### 1. Backend API

#### Seçenek A — Docker (önerilen)

```bash
cd backend
cp .env.example .env      # AI anahtarlarını doldurun (opsiyonel)
docker-compose up --build
```

`.env` içindeki `DATABASE_URL`'i docker-compose için `db` host'una çevirmeyi unutmayın:

```
DATABASE_URL=postgresql+asyncpg://skincare:skincare_dev@db:5432/skincare
```

#### Seçenek B — Docker'sız

```bash
cd backend

python3.12 -m venv venv
source venv/bin/activate          # macOS/Linux
# venv\Scripts\activate           # Windows

pip install -r requirements.txt
cp .env.example .env

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> `--host 0.0.0.0` **zorunludur** — fiziksel cihazdaki Expo Go, backend'e bilgisayarınızın LAN IP'si üzerinden bağlanır.
>
> `MASTER_CSV_PATH` göreli bir yoldur, bu yüzden uvicorn'u `backend/` dizininden başlatın.

Doğrulama:

```bash
curl http://localhost:8000/health          # {"status":"ok"}
open http://localhost:8000/docs            # Swagger arayüzü
```

### 2. Veritabanını Hazırlama (opsiyonel)

Analiz akışı CSV sözlüğüyle çalışır, veritabanı yalnızca `/api/v1/feedback` için gerekir.

```bash
cd backend
source venv/bin/activate
python -m scripts.seed_db     # `python scripts/seed_db.py` DEĞİL — modül olarak çalıştırın
```

> Script upsert yapmaz. `name_normalized` unique olduğu için ikinci kez çalıştırmak hata verir; önce tabloyu boşaltın.

### 3. Mobil Uygulama

```bash
cd mobile
npm install
npx expo start
```

Expo sunucusu başladıktan sonra:
- **iOS Simulator:** Terminalde `i`
- **Android Emulator:** Terminalde `a`
- **Fiziksel cihaz:** Expo Go ile QR kodu okutun

### Mobil → Backend Bağlantısı

`mobile/src/services/api.js` backend adresini **otomatik** çözer:

1. Expo'nun `hostUri` bilgisinden bilgisayarınızın IP'sini alır → `http://<IP>:8000`
2. Bulamazsa Android emülatöründe `http://10.0.2.2:8000`, aksi halde `http://localhost:8000`

Yani ayrı bir yapılandırma gerekmez; yalnızca telefon ile bilgisayarın **aynı ağda** olması ve backend'in `0.0.0.0:8000` üzerinde dinlemesi yeterlidir. Uygulama açılışta çözdüğü adresi konsola basar (`[API] Base URL: ...`).

### Testler

```bash
cd backend
source venv/bin/activate
pip install -r requirements-dev.txt
pytest tests/ -q
```

> `tests/test_ocr.py` gerçek OCR doğruluğunu ölçer. `OPENROUTER_API_KEY` / `DEEPSEEK_API_KEY` tanımlı değilken vision modeli devre dışı kalır ve zorlu görsellerde (ör. `curved_label.png`) bu testler başarısız olabilir — bu beklenen davranıştır.

## Ortam Değişkenleri

Tümü `backend/.env.example` içinde açıklanmıştır. AI anahtarları **opsiyoneldir**; boş bırakılırsa ilgili adımlar atlanır ve uygulama yalnızca CSV sözlüğüyle çalışır.

| Değişken | Ne işe yarar | Boşsa ne olur |
|---|---|---|
| `DATABASE_URL` | PostgreSQL bağlantısı | `/feedback` ve seed çalışmaz |
| `OPENROUTER_API_KEY` | Fotoğraftan INCI okuma (vision OCR) | Tesseract fallback'e düşer |
| `DEEPSEEK_API_KEY` | OCR düzeltme, bilinmeyen madde analizi, ürün özeti | Bu adımlar atlanır |
| `GEMINI_API_KEY` | Şu an kullanılmıyor (ileriye dönük) | — |
| `MATCH_THRESHOLD` vb. | Eşik ve ağırlık ayarları | `config.py` varsayılanları kullanılır |

> Sayısal değişkenleri **boş bırakmayın** — pydantic boş string'i sayıya çeviremez ve uygulama açılmaz. Varsayılanı istiyorsanız satırı tamamen silin.

## API Endpoint'leri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/v1/analyze` | Fotoğraf yükler (multipart), OCR + analiz yapar |
| POST | `/api/v1/analyze-text` | Elle girilen INCI metnini analiz eder |
| POST | `/api/v1/analyze-ocr` | Ham OCR metnini AI ile düzeltip analiz eder |
| POST | `/api/v1/debug-ocr` | Tesseract ham çıktısı + AI düzeltmesi (geliştirme aracı) |
| GET | `/api/v1/ingredients?search=&limit=` | İçerik arama / autocomplete |
| POST | `/api/v1/feedback` | Kullanıcı geri bildirimi kaydeder (PostgreSQL gerekir) |
| GET | `/health` | Sağlık kontrolü |
| GET | `/docs` | Swagger arayüzü |

Detaylı istek/yanıt şemaları için `backend/ARCHITECTURE.md`.

## Uygulama Akışı

```
SplashScreen → WelcomeScreen → Login/SignUp → SkinTypeScreen → Ana Ekran
```

**Ana Sekmeler (Bottom Tabs):** Home · Scan · History · Profile

**Ek Ekranlar:** ManualEntry, AnalysisResult, IngredientDetail, Compare, Badges, Privacy

## Desteklenen Cilt Tipleri

Mobil arayüzde seçilebilen: **Normal**, **Kuru**, **Yağlı**, **Karma**, **Hassas**

Backend ayrıca `mature` ve `pregnancy_safe` tiplerini de destekler (CSV'de skorları mevcut, arayüzde henüz sunulmuyor).

## Mobil Bağımlılıkları

| Paket | Açıklama |
|-------|----------|
| expo (~54.0) | React Native geliştirme platformu |
| @react-navigation/native · bottom-tabs · stack | Navigasyon |
| expo-image-picker | Kamera/galeriden görsel seçimi |
| expo-camera | Kamera erişimi |
| @react-native-async-storage/async-storage | Yerel depolama (oturum, geçmiş, rozetler) |
| expo-linear-gradient | Gradient arkaplanlar |
| react-native-reanimated · react-native-worklets | Animasyon altyapısı |
| react-native-gesture-handler · screens · safe-area-context | Navigasyon peer bağımlılıkları |
| @expo/vector-icons | İkonlar |

## Backend Bağımlılıkları

| Paket | Açıklama |
|-------|----------|
| fastapi · uvicorn | Web framework + ASGI sunucu |
| pydantic-settings · python-dotenv | Yapılandırma |
| pandas | CSV sözlüğünü belleğe yükleme |
| rapidfuzz | Fuzzy metin eşleştirme |
| openai | DeepSeek ve OpenRouter istemcisi (OpenAI uyumlu API) |
| pytesseract · Pillow | OCR fallback |
| sqlalchemy[asyncio] · asyncpg | ORM + PostgreSQL async driver |
| python-multipart | Dosya yükleme |
| scikit-learn · alembic · google-genai | Şu an kullanılmıyor, ileriye dönük tutuluyor |
