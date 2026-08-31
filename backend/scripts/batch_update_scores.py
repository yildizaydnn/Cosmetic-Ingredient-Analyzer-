"""Batch score update from accumulated feedback. Run: python -m scripts.batch_update_scores"""

import asyncio

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session
from app.models.feedback import Feedback
from app.models.ingredient import Ingredient
from app.services.analyzer import _parse_inci as parse_inci, _normalize as normalize_ingredient_name

OUTCOME_VALUES = {"positive": 1.0, "neutral": 0.0, "negative": -1.0}
EFFECT_VALUES = {"beneficial": 1.0, "neutral": 0.0, "caution": -1.0}

async def batch_update():
    async with async_session() as session:
        # Get all feedback
        result = await session.execute(select(Feedback))
        feedbacks = result.scalars().all()

        if not feedbacks:
            print("No feedback to process.")
            return

        # Get all ingredients
        ing_result = await session.execute(select(Ingredient))
        ingredients = {ing.name_normalized: ing for ing in ing_result.scalars().all()}

        updates = {}

        for fb in feedbacks:
            skin_type = fb.skin_type
            outcome_val = OUTCOME_VALUES.get(fb.outcome, 0.0)
            ingredient_names = fb.ingredients_json.get("ingredients", [])

            for i, raw_name in enumerate(ingredient_names, start=1):
                normalized = normalize_ingredient_name(raw_name)
                ing = ingredients.get(normalized)
                if ing is None or ing.feedback_count < settings.min_feedback_threshold:
                    continue

                delta_col = f"delta_{skin_type}"
                score_col = f"score_{skin_type}"
                current_score = getattr(ing, score_col, 0) + getattr(ing, delta_col, 0)

                if current_score >= settings.score_beneficial_threshold:
                    current_effect = 1.0
                elif current_score <= settings.score_caution_threshold:
                    current_effect = -1.0
                else:
                    current_effect = 0.0

                # Position weight
                if i <= 5:
                    pos_weight = settings.position_weight_top
                elif i <= 15:
                    pos_weight = settings.position_weight_mid
                else:
                    pos_weight = settings.position_weight_low

                delta_change = settings.learning_rate * (outcome_val - current_effect) * pos_weight
                current_delta = getattr(ing, delta_col, 0)
                new_delta = max(-settings.max_delta, min(settings.max_delta, current_delta + delta_change))

                if normalized not in updates:
                    updates[normalized] = {}
                updates[normalized][delta_col] = new_delta

        # Apply updates
        for norm_name, deltas in updates.items():
            ing = ingredients[norm_name]
            for col, val in deltas.items():
                setattr(ing, col, val)
            session.add(ing)

        await session.commit()
        print(f"Updated deltas for {len(updates)} ingredients.")


if __name__ == "__main__":
    asyncio.run(batch_update())
