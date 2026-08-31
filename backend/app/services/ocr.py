import base64
import re
from io import BytesIO

import pytesseract
from openai import OpenAI
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from app.config import settings

INCI_MARKERS = [
    r"[İi][çc]indekiler\s*(listesi)?\s*:?",
    r"İÇİNDEKİLER\s*:?",
    r"INGREDIENTS?\s*(overview)?\s*:?",
    r"INCI\s*:?",
    r"COMPOSITION\s*:?",
    r"[İi]çerik\s*[Bb]ilgisi\s*:?",
    r"Ürün\s*[Bb]ile[sş]imi\s*:?",
]

INCI_STOP_MARKERS = [
    r"\bF\.?I\.?L\.?\b",
    r"\be?\d{3,}\s*ml\b",
    r"Made\s+in\b",
    r"Üretim\b",
]

VISION_MODELS = [
    "google/gemini-2.5-flash",
    "google/gemini-2.0-flash-001",
]

VISION_PROMPT = """Bu fotoğraftaki ürünün içindekiler/ingredients listesini oku.

Önce ürünün ne olduğunu belirle. Eğer bu bir CİLT BAKIM veya KOZMETİK ürünü DEĞİLSE (örneğin: yer silme mendili, temizlik ürünü, çamaşır deterjanı, bulaşık deterjanı, oda spreyi, böcek ilacı, gıda ürünü vb.) sadece "NOT_COSMETIC" yaz.

Eğer cilt bakım/kozmetik ürünüyse (krem, losyon, serum, şampuan, saç bakım, güneş kremi, makyaj, deodorant, oje, dudak bakım vb.):
- SADECE ingredient isimlerini virgülle ayırarak yaz
- Başka hiçbir açıklama veya metin ekleme
- Sıralamayı koru
- "Ingredients:", "İçindekiler:" gibi başlıkları dahil etme
- Eğer ingredient listesi bulamazsan sadece "NOT_FOUND" yaz

Örnek çıktı: Aqua, Glycerin, Niacinamide, Cetearyl Alcohol, Dimethicone"""

OCR_CLEANUP_PROMPT = """Aşağıda bir kozmetik ürünün etiketinden OCR ile birden fazla ayarla okunan ham metinler var. Her "--- PASS" bir farklı OCR denemesidir. Metinler hatalı olabilir.

Görevin:
1. TÜM pass'lerdeki metinleri birlikte değerlendirerek INCI (ingredients/içindekiler) listesini çıkar
2. Bir pass'te bozuk okunan ingredient başka bir pass'te doğru okunmuş olabilir — hepsini karşılaştır
3. OCR hatalarını düzelt (örn: "Glycenn" → "Glycerin", "Nlacmamide" → "Niacinamide", "Awa" → "Aqua")
4. Bilinen kozmetik ingredient isimlerini kullanarak düzeltme yap
5. Sadece düzeltilmiş ingredient isimlerini virgülle ayırarak yaz
6. Eğer ingredient listesi bulamazsan sadece "NOT_FOUND" yaz

ÖNEMLI: Başka hiçbir açıklama ekleme, sadece virgülle ayrılmış ingredient listesini yaz.

"""


def _extract_inci_section(raw_text: str) -> str | None:
    text = raw_text
    for pattern in INCI_MARKERS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            text = text[match.end():]
            break
    else:
        return None

    for pattern in INCI_STOP_MARKERS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            text = text[:match.start()]
            break

    text = re.sub(r"[©®™]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = text.strip(".,;: ")

    if "- " in text and text.count(",") < text.count("- "):
        parts = re.split(r"\s*-\s+", text)
        parts = [p.strip() for p in parts if p.strip()]
        text = ", ".join(parts)

    return text if text else None


def _is_dark_background(image: Image.Image) -> bool:
    pixels = list(image.getdata())
    avg = sum(pixels) / len(pixels)
    return avg < 128


# ==================== AI Vision OCR ====================

def _compress_image(image_bytes: bytes, max_size: int = 1024, quality: int = 80) -> bytes:
    """Görseli JPEG olarak sıkıştırır."""
    image = Image.open(BytesIO(image_bytes))
    w, h = image.size
    if max(w, h) > max_size:
        ratio = max_size / max(w, h)
        image = image.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
    if image.mode != "RGB":
        image = image.convert("RGB")
    buf = BytesIO()
    image.save(buf, format="JPEG", quality=quality)
    return buf.getvalue()


def _extract_with_vision(image_bytes: bytes) -> str | None:
    """OpenRouter vision modeli ile görselden INCI listesini okur."""
    if not settings.openrouter_api_key:
        return None

    compressed = _compress_image(image_bytes)
    print(f"[OCR_VISION] Image compressed: {len(image_bytes)//1024}KB → {len(compressed)//1024}KB")
    base64_image = base64.b64encode(compressed).decode("utf-8")

    client = OpenAI(
        api_key=settings.openrouter_api_key,
        base_url="https://openrouter.ai/api/v1",
    )

    for model in VISION_MODELS:
        try:
            print(f"[OCR_VISION] Trying model: {model}")
            response = client.chat.completions.create(
                model=model,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": VISION_PROMPT},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                    ],
                }],
                temperature=0.1,
                max_tokens=1000,
            )
            result = response.choices[0].message.content.strip()

            # Thinking taglerini temizle
            result = re.sub(r"<think>.*?</think>", "", result, flags=re.DOTALL).strip()

            if result == "NOT_FOUND" or not result:
                print(f"[OCR_VISION] {model}: No ingredients found")
                return None

            if result == "NOT_COSMETIC":
                print(f"[OCR_VISION] {model}: Not a cosmetic product")
                return "NOT_COSMETIC"

            print(f"[OCR_VISION] Success with {model}: {result[:80]}...")
            return result

        except Exception as e:
            print(f"[OCR_VISION] {model} failed: {type(e).__name__}: {str(e)[:80]}")
            continue

    return None


# ==================== Tesseract OCR ====================

def _tesseract_multi_pass(image_bytes: bytes) -> list[str]:
    image = Image.open(BytesIO(image_bytes))

    width, height = image.size
    scale = max(3000 / width, 1)
    image = image.resize((int(width * scale), int(height * scale)), Image.LANCZOS)
    image = image.convert("L")

    is_dark = _is_dark_background(image)
    if is_dark:
        image = ImageOps.invert(image)
        print("[OCR] Dark background detected, inverting image")

    results = []

    configs = [
        {"contrast": 1.5, "threshold": 120, "psm": 6},
        {"contrast": 2.0, "threshold": 140, "psm": 6},
        {"contrast": 2.0, "threshold": 160, "psm": 4},
        {"contrast": 2.5, "threshold": 160, "psm": 6},
        {"contrast": 2.0, "threshold": 180, "psm": 4},
    ]

    if is_dark:
        configs.extend([
            {"contrast": 3.0, "threshold": 100, "psm": 4},
            {"contrast": 3.0, "threshold": 120, "psm": 6},
            {"contrast": 1.5, "threshold": 80, "psm": 4},
            {"contrast": 2.0, "threshold": 100, "psm": 11},
        ])

    seen = set()
    for cfg in configs:
        img = ImageEnhance.Contrast(image).enhance(cfg["contrast"])
        img = img.filter(ImageFilter.SHARPEN)
        img = img.point(lambda x, t=cfg["threshold"]: 0 if x < t else 255, "1")
        text = pytesseract.image_to_string(img, lang="eng", config=f"--psm {cfg['psm']}")
        if text and text.strip() and text.strip() not in seen:
            seen.add(text.strip())
            results.append(text.strip())

    return results


def _tesseract_ocr(image_bytes: bytes) -> str:
    results = _tesseract_multi_pass(image_bytes)
    if not results:
        return ""
    return max(results, key=lambda x: x.count(","))


def _cleanup_with_ai(raw_ocr_text: str) -> str | None:
    if not settings.deepseek_api_key or not raw_ocr_text:
        return None

    try:
        client = OpenAI(
            api_key=settings.deepseek_api_key,
            base_url="https://api.deepseek.com",
        )
        print("[OCR_AI] Sending OCR text to DeepSeek for cleanup...")
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "user", "content": OCR_CLEANUP_PROMPT + raw_ocr_text},
            ],
            temperature=0.1,
            max_tokens=1000,
        )
        result = response.choices[0].message.content.strip()

        if result == "NOT_FOUND" or not result:
            print("[OCR_AI] No ingredients found in OCR text")
            return None

        print(f"[OCR_AI] Cleanup successful: {result[:80]}...")
        return result

    except Exception as e:
        print(f"[OCR_AI ERROR] {type(e).__name__}: {str(e)[:100]}")
        return None


# ==================== Ana OCR fonksiyonu ====================

def extract_text_from_image(image_bytes: bytes) -> str:
    """Görselden INCI listesini çıkarır.

    Sıra:
    1. OpenRouter vision modeli (en iyi, fotoğrafı direkt AI okur)
    2. Tesseract multi-pass + DeepSeek cleanup (fallback)
    """
    # 1. AI Vision ile direkt oku (en iyi yöntem)
    vision_result = _extract_with_vision(image_bytes)
    if vision_result:
        return vision_result

    # 2. Fallback: Tesseract + DeepSeek
    print("[OCR] Vision failed, falling back to Tesseract + DeepSeek")
    all_passes = _tesseract_multi_pass(image_bytes)
    if not all_passes:
        return ""

    best = max(all_passes, key=lambda x: x.count(","))
    print(f"[OCR] {len(all_passes)} Tesseract passes, best has {best.count(',')} commas")

    combined = "\n".join(
        f"--- PASS {i+1} ---\n{text}" for i, text in enumerate(all_passes)
    )
    cleaned = _cleanup_with_ai(combined)
    if cleaned:
        return cleaned

    print("[OCR] All methods failed, using raw Tesseract output")
    inci_text = _extract_inci_section(best)
    return inci_text or best
