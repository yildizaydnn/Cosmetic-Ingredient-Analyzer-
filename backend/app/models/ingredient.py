from datetime import datetime

from sqlalchemy import Float, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_normalized: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    category: Mapped[str | None] = mapped_column(String(100))
    category_tr: Mapped[str | None] = mapped_column(String(100))
    short_description: Mapped[str | None] = mapped_column(Text)
    description_tr: Mapped[str | None] = mapped_column(Text)

    score_dry: Mapped[float] = mapped_column(Float, default=0)
    score_oily: Mapped[float] = mapped_column(Float, default=0)
    score_combination: Mapped[float] = mapped_column(Float, default=0)
    score_normal: Mapped[float] = mapped_column(Float, default=0)
    score_sensitive: Mapped[float] = mapped_column(Float, default=0)
    score_mature: Mapped[float] = mapped_column(Float, default=0)
    score_pregnancy_safe: Mapped[float] = mapped_column(Float, default=0)

    good_tags: Mapped[str | None] = mapped_column(Text)
    avoid_tags: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(50), default="original")
    product_frequency: Mapped[int] = mapped_column(Integer, default=0)

    delta_dry: Mapped[float] = mapped_column(Float, default=0)
    delta_oily: Mapped[float] = mapped_column(Float, default=0)
    delta_combination: Mapped[float] = mapped_column(Float, default=0)
    delta_normal: Mapped[float] = mapped_column(Float, default=0)
    delta_sensitive: Mapped[float] = mapped_column(Float, default=0)
    delta_mature: Mapped[float] = mapped_column(Float, default=0)
    delta_pregnancy_safe: Mapped[float] = mapped_column(Float, default=0)

    feedback_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())
