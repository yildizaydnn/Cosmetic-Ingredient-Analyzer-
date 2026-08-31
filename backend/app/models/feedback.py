import uuid
from datetime import datetime

from sqlalchemy import String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.ingredient import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    skin_type: Mapped[str] = mapped_column(String(20), nullable=False)
    outcome: Mapped[str] = mapped_column(String(20), nullable=False)
    ingredients_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now())


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skin_type: Mapped[str] = mapped_column(String(20), nullable=False)
    ingredients_text: Mapped[str] = mapped_column(Text, nullable=False)
    result_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
