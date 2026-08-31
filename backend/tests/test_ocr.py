"""OCR doğruluk testleri.

Her test görseli için beklenen ingredient listesi tanımlanır.
OCR çıktısındaki her ingredient'in beklenen listede olup olmadığı kontrol edilir.

Metrikler:
- recall: beklenen ingredient'lerin yüzde kaçı bulundu
- precision: bulunan ingredient'lerin yüzde kaçı doğru
- f1: recall ve precision'ın harmonik ortalaması
"""

import os
import pytest

TESTS_DIR = os.path.dirname(__file__)
IMAGES_DIR = os.path.join(TESTS_DIR, "test_images")

# Her test görseli için beklenen ingredient listesi (normalize edilmiş)
EXPECTED = {
    "dark_background.png": [
        "Butane", "Isobutane", "Propane", "Cyclopentasiloxane",
        "PPG-14 Butyl Ether", "Aluminum Sesquichlorohydrate", "Parfum",
        "Glycine", "Helianthus Annuus (Sunflower) Seed Oil",
        "C12-15 Alkyl Benzoate", "Aqua", "Disteardimonium Hectorite",
        "Calcium Chloride", "Octyldodecanol", "BHT",
        "Propylene Carbonate", "Dimethiconol", "Citric Acid", "Silica",
        "Maltodextrin", "Sodium Starch Octenylsuccinate",
        "Hydrolyzed Corn Starch Octenylsuccinate", "Citral", "Coumarin",
        "Eugenol", "Limonene", "Linalool",
    ],
    "white_clean.png": [
        "Dipropylene Glycol", "Aqua", "Propylene Glycol",
        "Sodium Stearate", "Poloxamine 1307", "Parfum",
        "PPG-3 Myristyl Ether", "Tetrasodium EDTA", "Linalool",
        "Hexyl Cinnamal",
        "Octadecyl Di-T-Butyl-4-Hydroxyhydrocinnamate",
        "Citronellol", "Limonene",
        "Pentaerythrityl Tetra-Di-T-Butyl Hydroxyhydrocinnamate",
        "CI 42090",
    ],
    "curved_label.png": [
        "Aqua", "Aloe Barbadensis Leaf Juice", "Potassium Alum",
        "Myrtus Communis Leaf Water", "Glycerin", "Xanthan Gum",
        "Tocopherol", "Parfum", "Xylityl Sesquicaprylate",
    ],
    "white_long.png": [
        "Aqua/Water/Eau", "Dibutyl Adipate",
        "Methylene Bis-Benzotriazolyl Tetramethylbutylphenol",
        "Diisopropyl Sebacate", "Dicaprylyl Carbonate",
        "Butyl Methoxydibenzoylmethane", "Ethylhexyl Triazone",
        "Glycerin", "Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine",
        "Polyglyceryl-3 Methylglucose Distearate",
        "Microcrystalline Cellulose", "Pentylene Glycol",
        "Brassica Campestris/Aleurites Fordi Oil Copolymer",
        "Decyl Glucoside", "C20-22 Alkyl Phosphate",
        "C20-22 Alcohols", "Tocopheryl Acetate", "Xanthan Gum",
        "Citric Acid", "Caprylyl Glycol", "Sodium Citrate",
        "Sodium Hydroxide", "Ectoin", "Glycyrrhetinic Acid",
        "Mannitol", "Xylitol", "O-Cymen-5-Ol",
        "Rhamnose Propylene Glycol", "Fructooligosaccharides",
        "Glabridin", "Tocopherol Caprylic/Capric Triglyceride",
        "Laminaria Ochroleuca Extract",
    ],
}


def _normalize(name: str) -> str:
    """Karşılaştırma için basit normalizasyon."""
    return name.lower().strip().replace("  ", " ")


def _calculate_metrics(found: list[str], expected: list[str]) -> dict:
    """OCR sonuçları ile beklenen listeyi karşılaştırıp metrikler hesapla."""
    found_norm = {_normalize(f) for f in found}
    expected_norm = {_normalize(e) for e in expected}

    true_positives = 0
    for f in found_norm:
        # Tam eşleşme veya biri diğerini içeriyor mu
        for e in expected_norm:
            if f == e or f in e or e in f:
                true_positives += 1
                break

    recall = true_positives / len(expected_norm) if expected_norm else 0
    precision = true_positives / len(found_norm) if found_norm else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    return {
        "found_count": len(found_norm),
        "expected_count": len(expected_norm),
        "matched": true_positives,
        "recall": round(recall, 2),
        "precision": round(precision, 2),
        "f1": round(f1, 2),
        "missing": [e for e in expected if _normalize(e) not in found_norm
                     and not any(_normalize(e) in f or f in _normalize(e) for f in found_norm)],
    }


def _run_ocr(image_path: str) -> list[str]:
    """Görseli OCR'dan geçirip ingredient listesi döndürür."""
    from app.services.ocr import extract_text_from_image

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    result = extract_text_from_image(image_bytes)
    if not result:
        return []

    return [x.strip() for x in result.split(",") if x.strip()]


def _run_tesseract_only(image_path: str) -> list[str]:
    """Sadece Tesseract ile OCR yap (AI düzeltmesi olmadan)."""
    from app.services.ocr import _tesseract_ocr, _extract_inci_section

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    raw = _tesseract_ocr(image_bytes)
    inci = _extract_inci_section(raw)
    text = inci or raw
    return [x.strip() for x in text.split(",") if x.strip()]


class TestOCRAccuracy:
    """OCR doğruluk testleri — her görsel için recall ve precision ölçer."""

    @pytest.mark.parametrize("image_name", list(EXPECTED.keys()))
    def test_full_pipeline(self, image_name):
        """Tesseract + DeepSeek tam pipeline testi."""
        image_path = os.path.join(IMAGES_DIR, image_name)
        if not os.path.exists(image_path):
            pytest.skip(f"Test image not found: {image_name}")

        found = _run_ocr(image_path)
        expected = EXPECTED[image_name]
        metrics = _calculate_metrics(found, expected)

        print(f"\n{'='*50}")
        print(f"Image: {image_name}")
        print(f"Found: {metrics['found_count']} | Expected: {metrics['expected_count']} | Matched: {metrics['matched']}")
        print(f"Recall: {metrics['recall']} | Precision: {metrics['precision']} | F1: {metrics['f1']}")
        if metrics["missing"]:
            print(f"Missing: {', '.join(metrics['missing'][:10])}")
        print(f"{'='*50}")

        # Minimum recall eşiği: en az %40 ingredient bulunmalı
        assert metrics["recall"] >= 0.4, f"{image_name}: recall too low ({metrics['recall']})"

    @pytest.mark.parametrize("image_name", list(EXPECTED.keys()))
    def test_tesseract_only(self, image_name):
        """Sadece Tesseract (AI olmadan) testi — baseline ölçümü."""
        image_path = os.path.join(IMAGES_DIR, image_name)
        if not os.path.exists(image_path):
            pytest.skip(f"Test image not found: {image_name}")

        found = _run_tesseract_only(image_path)
        expected = EXPECTED[image_name]
        metrics = _calculate_metrics(found, expected)

        print(f"\n{'='*50}")
        print(f"[TESSERACT ONLY] Image: {image_name}")
        print(f"Found: {metrics['found_count']} | Expected: {metrics['expected_count']} | Matched: {metrics['matched']}")
        print(f"Recall: {metrics['recall']} | Precision: {metrics['precision']} | F1: {metrics['f1']}")
        print(f"{'='*50}")
