import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class Outcome(str, Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class FeedbackRequest(BaseModel):
    analysis_id: uuid.UUID
    skin_type: str
    outcome: Outcome
    ingredients_text: str


class FeedbackResponse(BaseModel):
    id: uuid.UUID
    message: str
    recorded_at: datetime
