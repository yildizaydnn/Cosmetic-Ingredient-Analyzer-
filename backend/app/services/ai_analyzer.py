import json
import re
from openai import AsyncOpenAI

from app.config import settings
from app.services.ingredient_loader import get_ingredient_index, save_new_ingredient

SKIN_TYPES = ["dry", "oily", "combination", "normal", "sensitive", "mature", "pregnancy_safe"]

SYSTEM_PROMPT = """Sen bir kozmetik kimyagerisin. Sana numaralandırılmış kozmetik ingredient isimleri vereceğim.

Her ingredient için TÜM cilt tipleri (kuru, yağlı, karma, normal, hassas, olgun, hamilelik) bazında analiz yap.

Her ingredient için şunları belirle:
- index: Ingredient'in numarası
- name: Ingredient'in orijinal adı
- category_tr: Türkçe kategori. Örn: "Nemlendirici", "Koruyucu", "Antioksidan", "Emülgatör", "Kıvam Artırıcı", "Yüzey Aktif Madde", "Parfüm / Koku", "Renklendirici", "pH Düzenleyici", "Silikon", "Peeling Asidi" vb.
- description_tr: Bu ingredient ne işe yarar (2-3 cümle, Türkçe).
- effects: Her cilt tipi için bir obje. Key'ler: dry, oily, combination, normal, sensitive, mature, pregnancy_safe. Her biri:
  - effect: "beneficial", "caution" veya "neutral"
  - reason_tr: Bu cilt tipi için neden uygun/riskli/nötr (1 cümle, Türkçe)
  - score: -3 ile +3 arası sayısal skor. Pozitif = faydalı, negatif = riskli, 0 = nötr.

ÖNEMLİ: "Kozmetik Dışı" kategorisini SADECE kozmetik/kişisel bakım ürünlerinde hiç kullanılmayan maddeler için yaz (örneğin yemek malzemesi, endüstriyel kimyasal). Oje çıkarıcı, saç boyası, deodorant, güneş kremi gibi kişisel bakım ürünlerinde kullanılan maddeler (Acetone, Hydrogen Peroxide, Aluminum Chlorohydrate vb.) kozmetik ingredient sayılır — bunlara uygun kategori ver (örn: "Çözücü", "Oksitleyici", "Terleme Önleyici").

Cevabını SADECE aşağıdaki JSON formatında ver, başka hiçbir şey yazma:

{"ingredients": [{"index": 1, "name": "...", "category_tr": "...", "description_tr": "...", "effects": {"dry": {"effect": "...", "reason_tr": "...", "score": 0}, "oily": {"effect": "...", "reason_tr": "...", "score": 0}, "combination": {"effect": "...", "reason_tr": "...", "score": 0}, "normal": {"effect": "...", "reason_tr": "...", "score": 0}, "sensitive": {"effect": "...", "reason_tr": "...", "score": 0}, "mature": {"effect": "...", "reason_tr": "...", "score": 0}, "pregnancy_safe": {"effect": "...", "reason_tr": "...", "score": 0}}}]}"""


def _build_user_prompt(ingredient_names: list[str]) -> str:
    numbered = "\n".join(f"{i+1}. {name}" for i, name in enumerate(ingredient_names))
    return f"Ingredient'ler:\n{numbered}"


def _normalize(name: str) -> str:
    name = name.lower()
    name = re.sub(r"\([^)]*\)", "", name)
    name = re.sub(r"[^a-z0-9]", "", name)
    return name.strip()


def _ai_result_to_dataset_row(ai_item: dict, original_name: str) -> dict:
    """AI sonucunu dataset formatına çevirir."""
    normalized = _normalize(original_name)
    effects = ai_item.get("effects", {})

    row = {
        "name": original_name,
        "name_normalized": normalized,
        "category": ai_item.get("category_tr", ""),
        "category_tr": ai_item.get("category_tr", ""),
        "description_tr": ai_item.get("description_tr", ""),
        "good_tags": "",
        "avoid_tags": "",
        "source": "ai",
        "product_frequency": 1,
    }

    for skin_type in SKIN_TYPES:
        skin_data = effects.get(skin_type, {})
        row[f"score_{skin_type}"] = float(skin_data.get("score", 0))
        row[f"{skin_type}_effect"] = skin_data.get("effect", "neutral")
        row[f"{skin_type}_reason_tr"] = skin_data.get("reason_tr", "")

    return row


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.deepseek_api_key,
        base_url="https://api.deepseek.com",
    )


async def analyze_unknowns(
    unknown_items: list[dict], skin_type: str, language: str = "tr"
) -> tuple[list[dict], list[dict]]:
    if not unknown_items or not settings.deepseek_api_key:
        return unknown_items, []

    ingredient_names = [item["name"] for item in unknown_items]
    user_prompt = _build_user_prompt(ingredient_names)

    try:
        client = _get_client()
        print(f"[AI_ANALYZER] Sending {len(ingredient_names)} ingredients to DeepSeek...")
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)
        print(f"[AI_ANALYZER] DeepSeek responded successfully")
    except Exception as e:
        print(f"[AI_ANALYZER ERROR] {type(e).__name__}: {e}")
        return unknown_items, []

    ai_by_index = {item["index"]: item for item in data["ingredients"]}

    resolved = []
    still_unknown = []

    for i, item in enumerate(unknown_items):
        ai_result = ai_by_index.get(i + 1)
        if not ai_result or not ai_result.get("effects"):
            still_unknown.append(item)
            continue

        original_name = item["name"]
        effects = ai_result["effects"]
        skin_data = effects.get(skin_type, {})
        effect = skin_data.get("effect", "neutral")

        if effect not in ("beneficial", "caution", "neutral"):
            still_unknown.append(item)
            continue

        # Çöp veriyi kaydetme
        category = ai_result.get("category_tr", "")
        normalized = _normalize(original_name)
        is_garbage = (
            category.lower() in ("bilinmeyen", "bilinmiyor", "unknown", "diğer", "", "kozmetik dışı")
            or len(normalized) < 3
            or len(normalized) > 80
            or not any(c.isalpha() for c in original_name)
            or any(c in original_name for c in "\n\r|+@%=")
            or "tanımlanamayan" in ai_result.get("description_tr", "").lower()
        )

        if not is_garbage:
            dataset_row = _ai_result_to_dataset_row(ai_result, original_name)
            save_new_ingredient(dataset_row)
            print(f"[AI_ANALYZER] Saved to dataset: {original_name}")
        else:
            print(f"[AI_ANALYZER] Skipped saving (garbage/unknown): {original_name}")

        resolved.append({
            "name": original_name,
            "category": ai_result.get("category_tr", ""),
            "description": ai_result.get("description_tr", ""),
            "reason": skin_data.get("reason_tr", ""),
            "position": item["position"],
            "position_weight": item.get("position_weight"),
            "effect": effect,
            "source": "ai",
        })

    return still_unknown, resolved
