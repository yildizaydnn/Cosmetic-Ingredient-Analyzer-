import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.feedback import Analysis, Feedback
from app.services.analyzer import analyze, _parse_inci as parse_inci


async def save_analysis(session: AsyncSession, skin_type: str, ingredients_text: str, result: dict) -> uuid.UUID:
    analysis = Analysis(
        skin_type=skin_type,
        ingredients_text=ingredients_text,
        result_json=result,
    )
    session.add(analysis)
    await session.flush()
    return analysis.id


async def process_feedback(
    session: AsyncSession,
    analysis_id: uuid.UUID,
    skin_type: str,
    outcome: str,
    ingredients_text: str,
) -> dict:
    # Spam check: only 1 feedback per analysis_id
    existing = await session.execute(
        select(Feedback).where(Feedback.analysis_id == analysis_id)
    )
    if existing.scalar_one_or_none() is not None:
        raise ValueError("Bu analiz için zaten geri bildirim verilmiş.")

    ingredients_list = parse_inci(ingredients_text)

    feedback = Feedback(
        analysis_id=analysis_id,
        skin_type=skin_type,
        outcome=outcome,
        ingredients_json={"ingredients": ingredients_list},
    )
    session.add(feedback)
    await session.flush()

    return {
        "id": feedback.id,
        "message": "Geri bildiriminiz kaydedildi. Teşekkürler!",
        "recorded_at": datetime.now(timezone.utc),
    }
