"""
Dataset zenginleştirme scripti.

Mevcut ingredient'lerin açıklamalarını DeepSeek ile güncelleyerek
her cilt tipi için detaylı, gerçekten faydalı açıklamalar üretir.

Kullanım:
    python scripts/enrich_dataset.py

Maliyet: ~$0.50-1.00 (tüm dataset)
Süre: ~10-15 dakika
"""

import json
import time
import pandas as pd
from openai import OpenAI

# ============ AYARLAR ============
CSV_PATH = "data/dataset.csv"
OUTPUT_PATH = "data/dataset_enriched.csv"
BATCH_SIZE = 5  # Her istekte kaç ingredient
DEEPSEEK_API_KEY = "sk-89407ef159714334bc7643561a4fdd49"

SKIN_TYPES = ["dry", "oily", "combination", "normal", "sensitive", "acne_prone", "mature", "pregnancy_safe"]

SKIN_TYPE_TR = {
    "dry": "Kuru Cilt",
    "oily": "Yağlı Cilt",
    "combination": "Karma Cilt",
    "normal": "Normal Cilt",
    "sensitive": "Hassas Cilt (egzama, rozasea, atopik dermatit dahil)",
    "acne_prone": "Akneye Meyilli Cilt (komedonal akne, kistik akne, hormonal akne, siyah nokta)",
    "mature": "Olgun Cilt (anti-aging, kırışıklık, elastikiyet kaybı)",
    "pregnancy_safe": "Hamilelik Dönemi",
}

PROMPT = """Sen deneyimli bir dermatolog ve kozmetik kimyagersin. Sana kozmetik ingredient'ler vereceğim.

Her ingredient için TÜM cilt tipleri bazında GERÇEKTEN FAYDALI, KLİNİK BİLGİYE DAYALI analiz yap.

Hedef kullanıcılar: Akneli, egzamalı, rozasealı, hassas ciltli, hiperpigmentasyonlu, kuru/yağlı ciltli insanlar. Bu insanlara gerçek bir dermatolog gibi yardımcı ol.

Her ingredient ve cilt tipi için şunları belirle:

1. **effect**: "beneficial", "caution" veya "neutral"
2. **score**: -3 ile +3 arası (pozitif=faydalı, negatif=riskli)
3. **reason_tr**: Bu cilt tipi için DETAYLI açıklama (2-3 cümle). Sadece "faydalıdır" deme. Şunları içersin:
   - Bu ingredient bu cilt tipinde TAM OLARAK ne yapar (mekanizma)
   - Spesifik cilt sorunlarına etkisi (akne, egzama, rozasea, hiperpigmentasyon vs.)
   - Örnek: "Salisilik asit yağda çözünür yapısıyla gözenek içine penetre olur ve komedolitik etki gösterir. Akneye meyilli ciltlerde siyah nokta ve kistik akneyi azaltır. Ancak %2 üzeri konsantrasyonlarda kuru ciltlerde bariyer hasarı yapabilir."
4. **advice_tr**: SOMUT, AKSİYON ODaklı tavsiye (1-2 cümle). Örnek:
   - "Gece rutinine ekle, sabah SPF50+ güneş kremi kullan"
   - "Haftada 2 kez kullan, her gün değil. Niacinamide ile kombine et"
   - "Bu ürünü retinol ile aynı gece kullanma, bariyeri tahriş eder"
   - "Hamilelikte kesinlikle kullanma, teratojenik risk taşır"

GERÇEK dermatolojik bilgi kullan. Yüzeysel "faydalı bileşen" gibi cümleler YAZMA.

Cilt tipleri ve kapsamları:
- dry: Kuru cilt, dehidrasyon, bariyer hasarı, pullanma, sıkılık hissi
- oily: Yağlı cilt, geniş gözenekler, aşırı sebum üretimi, parlaklık
- combination: Karma cilt, T-bölge yağlı, yanaklar kuru
- normal: Normal cilt, genel bakım
- sensitive: Hassas cilt, rozasea, egzama, atopik dermatit, kontakt dermatit, kızarıklık, yanma
- acne_prone: Akneye meyilli cilt, komedonal akne (siyah nokta, beyaz nokta), kistik akne, hormonal akne, papül, püstül. Bu cilt tipi için komedojenik potansiyeli, gözenek tıkama riski ve bakteriyel etkileri mutlaka değerlendir.
- mature: Olgun cilt, kırışıklık, elastikiyet kaybı, kolajen azalması, hiperpigmentasyon, leke
- pregnancy_safe: Hamilelik güvenliği, teratojenik riskler, emzirme dönemi

Cevabını SADECE JSON formatında ver:

{"ingredients": [{"index": 1, "category_tr": "...", "description_tr": "Bu ingredient'in genel açıklaması (2-3 cümle, kozmetik kimya perspektifinden)", "effects": {"dry": {"effect": "...", "score": 0, "reason_tr": "...", "advice_tr": "..."}, "oily": {...}, "combination": {...}, "normal": {...}, "sensitive": {...}, "acne_prone": {...}, "mature": {...}, "pregnancy_safe": {...}}}]}"""


def create_client():
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")


def enrich_batch(client, ingredients: list[dict]) -> dict | None:
    numbered = "\n".join(
        f"{i+1}. {ing['name']} (mevcut kategori: {ing.get('category_tr', 'Bilinmiyor')})"
        for i, ing in enumerate(ingredients)
    )
    user_prompt = f"Ingredient'ler:\n{numbered}"

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=8000,
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)
        return data
    except Exception as e:
        print(f"  ERROR: {type(e).__name__}: {str(e)[:100]}")
        return None


def update_row(row: dict, ai_item: dict) -> dict:
    """AI sonucunu mevcut row'a uygular."""
    # Genel alanları güncelle
    if ai_item.get("category_tr"):
        row["category_tr"] = ai_item["category_tr"]
        row["category"] = ai_item["category_tr"]
    if ai_item.get("description_tr"):
        row["description_tr"] = ai_item["description_tr"]

    effects = ai_item.get("effects", {})
    for skin_type in SKIN_TYPES:
        skin_data = effects.get(skin_type, {})
        if not skin_data:
            continue

        # Score güncelle
        if "score" in skin_data:
            row[f"score_{skin_type}"] = float(skin_data["score"])

        # Effect güncelle
        if "effect" in skin_data:
            row[f"{skin_type}_effect"] = skin_data["effect"]

        # Reason güncelle — advice ile birleştir
        reason = skin_data.get("reason_tr", "")
        advice = skin_data.get("advice_tr", "")
        if reason and advice:
            row[f"{skin_type}_reason_tr"] = f"{reason} 💡 {advice}"
        elif reason:
            row[f"{skin_type}_reason_tr"] = reason

    return row


def main():
    print(f"Loading dataset from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH, dtype=str, keep_default_na=False)
    print(f"Loaded {len(df)} ingredients")

    client = create_client()

    total_batches = (len(df) + BATCH_SIZE - 1) // BATCH_SIZE
    updated_count = 0
    error_count = 0

    for batch_idx in range(total_batches):
        start = batch_idx * BATCH_SIZE
        end = min(start + BATCH_SIZE, len(df))
        batch_rows = df.iloc[start:end]

        ingredients = [{"name": row["name"], "category_tr": row.get("category_tr", "")} for _, row in batch_rows.iterrows()]

        print(f"\n[{batch_idx+1}/{total_batches}] Processing {len(ingredients)} ingredients ({start+1}-{end})...")
        print(f"  Names: {', '.join(i['name'][:20] for i in ingredients[:5])}...")

        data = enrich_batch(client, ingredients)

        if not data or "ingredients" not in data:
            print(f"  FAILED - skipping batch")
            error_count += len(ingredients)
            time.sleep(1)
            continue

        ai_by_index = {item["index"]: item for item in data["ingredients"]}

        for i, (df_idx, row) in enumerate(batch_rows.iterrows()):
            ai_item = ai_by_index.get(i + 1)
            if ai_item:
                updated_row = update_row(row.to_dict(), ai_item)
                for col, val in updated_row.items():
                    df.at[df_idx, col] = val
                updated_count += 1

        # Her 5 batch'te bir kaydet (güvenlik)
        if (batch_idx + 1) % 5 == 0:
            df.to_csv(OUTPUT_PATH, index=False)
            print(f"  >> Checkpoint saved ({updated_count} updated so far)")

        # Rate limit'e takılmamak için kısa bekleme
        time.sleep(0.5)

    # Final kayıt
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"\n{'='*50}")
    print(f"DONE!")
    print(f"Updated: {updated_count}/{len(df)}")
    print(f"Errors: {error_count}")
    print(f"Saved to: {OUTPUT_PATH}")
    print(f"\nKontrol ettikten sonra orijinal dosyayı değiştirmek için:")
    print(f"  cp {OUTPUT_PATH} {CSV_PATH}")


if __name__ == "__main__":
    main()
