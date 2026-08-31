from app.services.analyzer import _match as match_ingredient
from app.services.ingredient_loader import get_ingredient_index


async def test_exact_match():
    db = get_ingredient_index()
    key, score = match_ingredient("glycerin", db)
    assert key is not None
    assert score == 100


async def test_synonym_match():
    db = get_ingredient_index()
    # "parfum" -> synonym -> "fragrance"
    key, score = match_ingredient("parfum", db)
    assert key is not None
    assert score == 100


async def test_unknown_ingredient():
    db = get_ingredient_index()
    key, score = match_ingredient("xyz123unknownthing", db)
    assert key is None


async def test_fuzzy_match():
    db = get_ingredient_index()
    # "hyaluronicacid" with small typo
    key, score = match_ingredient("hyaluronicacid", db)
    assert key is not None
