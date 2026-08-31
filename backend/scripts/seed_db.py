"""CSV -> PostgreSQL seed script. Run: python -m scripts.seed_db"""

import asyncio

import pandas as pd
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session, engine
from app.models.ingredient import Base, Ingredient


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    df = pd.read_csv(settings.master_csv_path, dtype=str, keep_default_na=False)

    score_cols = [
        "score_dry", "score_oily", "score_combination", "score_normal",
        "score_sensitive", "score_mature", "score_pregnancy_safe",
    ]
    for col in score_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    if "product_frequency" in df.columns:
        df["product_frequency"] = pd.to_numeric(df["product_frequency"], errors="coerce").fillna(0).astype(int)

    async with async_session() as session:
        for _, row in df.iterrows():
            ingredient = Ingredient(
                name=row.get("name", ""),
                name_normalized=row.get("name_normalized", ""),
                category=row.get("category", ""),
                category_tr=row.get("category_tr", ""),
                short_description=row.get("short_description", ""),
                description_tr=row.get("description_tr", ""),
                score_dry=float(row.get("score_dry", 0)),
                score_oily=float(row.get("score_oily", 0)),
                score_combination=float(row.get("score_combination", 0)),
                score_normal=float(row.get("score_normal", 0)),
                score_sensitive=float(row.get("score_sensitive", 0)),
                score_mature=float(row.get("score_mature", 0)),
                score_pregnancy_safe=float(row.get("score_pregnancy_safe", 0)),
                good_tags=row.get("good_tags", ""),
                avoid_tags=row.get("avoid_tags", ""),
                source=row.get("source", "original"),
                product_frequency=int(row.get("product_frequency", 0)),
            )
            session.add(ingredient)

        await session.commit()

    print(f"Seeded {len(df)} ingredients into the database.")


if __name__ == "__main__":
    asyncio.run(seed())
