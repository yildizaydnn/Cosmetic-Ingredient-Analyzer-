from enum import Enum

from pydantic import BaseModel, Field


class SkinType(str, Enum):
    dry = "dry"
    oily = "oily"
    combination = "combination"
    normal = "normal"
    sensitive = "sensitive"
    mature = "mature"
    pregnancy_safe = "pregnancy_safe"


class Language(str, Enum):
    tr = "tr"
    en = "en"


class AnalysisRequest(BaseModel):
    skin_type: SkinType
    ingredients_text: str = Field(..., min_length=1)
    language: Language = Language.tr


class OcrAnalysisRequest(BaseModel):
    skin_type: SkinType
    raw_ocr_text: str = Field(..., min_length=1)
    language: Language = Language.tr


class IngredientItem(BaseModel):
    name: str
    category: str | None = None
    description: str | None = None
    matched_as: str | None = None
    reason: str | None = None
    position: int
    position_weight: float | None = None
    note: str | None = None
    source: str | None = None


class AnalysisSummary(BaseModel):
    beneficial_count: int
    caution_count: int
    neutral_count: int
    unknown_count: int


class AnalysisResponse(BaseModel):
    is_cosmetic: bool = True
    rejection_reason: str | None = None
    skin_type: str
    total_ingredients: int
    summary: AnalysisSummary
    beneficial: list[IngredientItem]
    caution: list[IngredientItem]
    neutral: list[IngredientItem]
    unknown: list[IngredientItem]
    disclaimer: str
    product_summary: str | None = None
