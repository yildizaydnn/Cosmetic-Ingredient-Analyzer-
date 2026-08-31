from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.feedback import FeedbackRequest, FeedbackResponse
from app.services.feedback_engine import process_feedback

router = APIRouter()


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    request: FeedbackRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        result = await process_feedback(
            session=session,
            analysis_id=request.analysis_id,
            skin_type=request.skin_type,
            outcome=request.outcome.value,
            ingredients_text=request.ingredients_text,
        )
        await session.commit()
        return result
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
