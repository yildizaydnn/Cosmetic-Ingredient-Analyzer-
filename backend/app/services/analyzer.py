import re

from rapidfuzz import fuzz, process

from app.config import settings
from app.services.ingredient_loader import get_ingredient_index
from app.services.ai_analyzer import analyze_unknowns
from app.services.product_summary import generate_product_summary

DISCLAIMER_TR = "Bu analiz genel bilgi amaçlıdır, tıbbi tavsiye niteliği taşımaz. Cilt sorunlarınız için bir dermatolog'a danışınız."
DISCLAIMER_EN = "This analysis is for informational purposes only and does not constitute medical advice. Please consult a dermatologist for skin concerns."

SYNONYMS: dict[str, str] = {
    "aqua": "aquawatereau",
    "water": "aquawatereau",
    "parfum": "fragrance",
    "tocopherylacetate": "tocopherol",
    "sodiumhyaluronate": "hyaluronicacid",
    "retinylpalmitate": "retinol",
    "ascorbylglucoside": "ascorbicacid",
}


def _normalize(name: str) -> str:
    name = name.lower()
    name = re.sub(r"\([^)]*\)", "", name)
    name = re.sub(r"[^a-z0-9]", "", name)
    return name.strip()


def _parse_inci(text: str) -> list[str]:
    if not text or not text.strip():
        return []
    return [p.strip() for p in text.split(",") if p.strip()]


def _match(normalized_name: str, ingredient_db: dict[str, dict]) -> tuple[str | None, int]:
    lookup = SYNONYMS.get(normalized_name, normalized_name)

    if lookup in ingredient_db:
        return lookup, 100

    if not ingredient_db:
        return None, 0

    result = process.extractOne(
        lookup, list(ingredient_db.keys()), scorer=fuzz.ratio, score_cutoff=settings.match_threshold
    )
    if result is not None:
        return result[0], int(result[1])

    return None, 0


def _get_position_weight(position: int) -> float:
    if position <= 5:
        return settings.position_weight_top
    elif position <= 15:
        return settings.position_weight_mid
    return settings.position_weight_low


def _determine_effect(score: float) -> str:
    if score >= settings.score_beneficial_threshold:
        return "beneficial"
    elif score <= settings.score_caution_threshold:
        return "caution"
    return "neutral"


# INCI listelerinde sıkça görülen marker ingredient'ler (normalize edilmiş)
_COSMETIC_MARKERS = {
    "aquawatereau", "water", "glycerin", "dimethicone", "phenoxyethanol",
    "tocopherol", "sodiumhydroxide", "citricacid", "fragrance", "parfum",
    "butyleneglycol", "niacinamide", "sodiumchloride", "carbomer",
    "xanthangum", "disodiumedta", "potassiumsorbate", "sodiumbenzoate",
    "cetearylalcohol", "cetylalcohol", "stearicacid", "palmiticacid",
    "sorbicacid", "polysorbate20", "polysorbate60", "polysorbate80",
    "hyaluronicacid", "panthenol", "allantoin", "retinol", "salicylicacid",
    "glycolicacid", "lacticacid", "ascorbicacid", "shea", "jojoba",
    "aloebarbadensis", "capricctriglyceride", "isopropylmyristate",
    "ceteareth20", "paborbenzone", "cyclohexasiloxane",
}

def _is_cosmetic_product(parsed: list[str], ingredient_db: dict) -> bool:
    """
    INCI listesinin gerçekten bir kozmetik ürüne ait olup olmadığını kontrol eder.
    Kısa Türkçe kelimeler (un, tuz, süt) fuzzy match'te false positive ürettiği için
    sadece tanınma oranına bakmak yetmez. Ek olarak bilinen kozmetik marker'ları ararız.
    """
    if len(parsed) < 2:
        return False

    marker_hits = 0
    strong_matches = 0  # normalize uzunluğu >= 5 VE exact match olan

    for raw_name in parsed:
        normalized = _normalize(raw_name)

        # Bilinen kozmetik marker mı?
        lookup = SYNONYMS.get(normalized, normalized)
        if lookup in _COSMETIC_MARKERS:
            marker_hits += 1

        # Gerçek exact match (kısa kelime sahte eşleşmeleri elensin)
        if lookup in ingredient_db and len(normalized) >= 5:
            strong_matches += 1

    # En az 2 marker VEYA en az 3 güçlü eşleşme varsa kozmetik kabul et
    return marker_hits >= 2 or strong_matches >= 3


async def analyze(skin_type: str, ingredients_text: str, language: str = "tr") -> dict:
    ingredient_db = get_ingredient_index()
    parsed = _parse_inci(ingredients_text)

    beneficial = []
    caution = []
    neutral = []
    unknown = []

    for position, raw_name in enumerate(parsed, start=1):
        normalized = _normalize(raw_name)
        matched_key, match_score = _match(normalized, ingredient_db)
        pos_weight = _get_position_weight(position)

        if matched_key is None:
            note = "Bu bileşen veritabanımızda bulunamadı" if language == "tr" else "This ingredient was not found in our database"
            unknown.append({"name": raw_name, "position": position, "note": note})
            continue

        row = ingredient_db[matched_key]
        base_score = float(row.get(f"score_{skin_type}", 0))
        effect = _determine_effect(base_score)

        if language == "tr":
            category = row.get("category_tr") or row.get("category", "")
        else:
            category = row.get("category", "")

        reason_col = f"{skin_type}_reason_tr" if language == "tr" else f"{skin_type}_reason_en"
        reason = row.get(reason_col, "")

        description = row.get("description_tr", "") if language == "tr" else row.get("short_description", "")

        item: dict = {
            "name": raw_name,
            "category": category,
            "description": description or None,
            "position": position,
            "position_weight": pos_weight,
        }

        original_name = row.get("name", "")
        if normalized != matched_key or match_score < 100:
            item["matched_as"] = original_name

        if effect in ("beneficial", "caution") and reason:
            item["reason"] = reason

        if effect == "beneficial":
            beneficial.append(item)
        elif effect == "caution":
            caution.append(item)
        else:
            neutral.append(item)

    # Kozmetik ürün kontrolü
    total = len(parsed)
    if total > 0 and not _is_cosmetic_product(parsed, ingredient_db):
        rejection_reason = (
            "Bu içerik listesi bir cilt bakım/kozmetik ürününe ait görünmüyor. "
            "Lütfen bir kozmetik ürünün içindekiler (INCI) listesini tarayın."
        ) if language == "tr" else (
            "This ingredient list does not appear to belong to a skincare/cosmetic product. "
            "Please scan the ingredients (INCI) list of a cosmetic product."
        )
        print(f"[ANALYZER] Rejected: not a cosmetic product ({total} ingredients)")
        return {
            "is_cosmetic": False,
            "rejection_reason": rejection_reason,
            "skin_type": skin_type,
            "total_ingredients": total,
            "summary": {"beneficial_count": 0, "caution_count": 0, "neutral_count": 0, "unknown_count": total},
            "beneficial": [],
            "caution": [],
            "neutral": [],
            "unknown": [],
            "disclaimer": DISCLAIMER_TR if language == "tr" else DISCLAIMER_EN,
        }

    if unknown:
        print(f"[ANALYZER] {len(unknown)} unknown ingredients, sending to AI...")
        for item in unknown:
            item["position_weight"] = _get_position_weight(item["position"])
        still_unknown, resolved = await analyze_unknowns(unknown, skin_type, language)
        print(f"[ANALYZER] AI result: {len(resolved)} resolved, {len(still_unknown)} still unknown")
        unknown = still_unknown
        for item in resolved:
            effect = item.pop("effect")
            if effect == "beneficial":
                beneficial.append(item)
            elif effect == "caution":
                caution.append(item)
            else:
                neutral.append(item)

    for group in (beneficial, caution):
        group.sort(key=lambda x: (-x["position_weight"], x["position"]))
    neutral.sort(key=lambda x: x["position"])
    unknown.sort(key=lambda x: x["position"])

    result = {
        "is_cosmetic": True,
        "rejection_reason": None,
        "skin_type": skin_type,
        "total_ingredients": total,
        "summary": {
            "beneficial_count": len(beneficial),
            "caution_count": len(caution),
            "neutral_count": len(neutral),
            "unknown_count": len(unknown),
        },
        "beneficial": beneficial,
        "caution": caution,
        "neutral": neutral,
        "unknown": unknown,
        "disclaimer": DISCLAIMER_TR if language == "tr" else DISCLAIMER_EN,
    }

    product_summary = await generate_product_summary(result, language)
    if product_summary:
        result["product_summary"] = product_summary

    return result
