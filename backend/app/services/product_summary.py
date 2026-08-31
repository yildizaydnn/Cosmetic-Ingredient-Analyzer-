import json

from openai import AsyncOpenAI

from app.config import settings

SKIN_TYPE_LABELS = {
    "dry": "kuru",
    "oily": "yağlı",
    "combination": "karma",
    "normal": "normal",
    "sensitive": "hassas",
    "mature": "olgun",
    "pregnancy_safe": "hamilelik",
}

SYSTEM_PROMPT = """Sen bir cilt bakım uzmanısın. Sana bir kozmetik ürünün içerik analiz sonuçlarını ve kullanıcının cilt tipini vereceğim.

Görevin: Ürünün bu cilt tipi için genel bir değerlendirmesini yazmak.

Kurallar:
- 3-4 cümle yaz, fazla uzun olmasın
- Faydalı bileşenlerin neden iyi olduğunu kısaca belirt
- Riskli bileşenler varsa neden dikkat edilmesi gerektiğini söyle
- Pratik bir öneri ver (kullanabilir / dikkatli kullanılmalı / alternatif bakılmalı gibi)
- Samimi ve anlaşılır bir dil kullan, tıbbi jargon kullanma
- Cevabını SADECE düz metin olarak ver, JSON veya markdown kullanma"""


def _build_prompt(analysis: dict, language: str) -> str:
    skin_label = SKIN_TYPE_LABELS.get(analysis["skin_type"], analysis["skin_type"])

    beneficial_names = [i["name"] for i in analysis.get("beneficial", [])]
    caution_names = [i["name"] for i in analysis.get("caution", [])]
    neutral_names = [i["name"] for i in analysis.get("neutral", [])]

    caution_details = []
    for item in analysis.get("caution", []):
        reason = item.get("reason", "")
        caution_details.append(f"  - {item['name']}: {reason}" if reason else f"  - {item['name']}")

    lines = [
        f"Kullanıcının cilt tipi: {skin_label}",
        f"Toplam içerik sayısı: {analysis['total_ingredients']}",
        f"",
        f"Faydalı bileşenler ({len(beneficial_names)}): {', '.join(beneficial_names) or 'yok'}",
        f"Dikkat edilmesi gereken bileşenler ({len(caution_names)}):",
    ]
    if caution_details:
        lines.extend(caution_details)
    else:
        lines.append("  yok")
    lines.append(f"Nötr bileşenler ({len(neutral_names)}): {', '.join(neutral_names) or 'yok'}")

    return "\n".join(lines)


async def generate_product_summary(analysis: dict, language: str = "tr") -> str | None:
    if not settings.deepseek_api_key:
        return None

    try:
        client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url="https://api.deepseek.com",
        )

        user_prompt = _build_prompt(analysis, language)

        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=300,
        )

        summary = response.choices[0].message.content.strip()
        print(f"[PRODUCT_SUMMARY] Generated summary ({len(summary)} chars)")
        return summary

    except Exception as e:
        print(f"[PRODUCT_SUMMARY ERROR] {type(e).__name__}: {e}")
        return None
