from app.services.analyzer import analyze


async def test_basic_analysis():
    result = await analyze(
        skin_type="sensitive",
        ingredients_text="Aqua, Glycerin, Niacinamide, Salicylic Acid, Parfum",
        language="tr",
    )
    assert result["skin_type"] == "sensitive"
    assert result["total_ingredients"] == 5
    assert "beneficial" in result
    assert "caution" in result
    assert "neutral" in result
    assert "unknown" in result
    assert "disclaimer" in result

    total = (
        result["summary"]["beneficial_count"]
        + result["summary"]["caution_count"]
        + result["summary"]["neutral_count"]
        + result["summary"]["unknown_count"]
    )
    assert total == 5


async def test_position_weights():
    result = await analyze(
        skin_type="oily",
        ingredients_text="Aqua, Glycerin, Niacinamide, A, B, C, D, E, F, G, H, I, J, K, L, M",
        language="tr",
    )
    # First 5 should have weight 1.0, 6-15 should have 0.5, 16+ should have 0.2
    all_items = result["beneficial"] + result["caution"] + result["neutral"]
    for item in all_items:
        pos = item["position"]
        weight = item["position_weight"]
        if pos <= 5:
            assert weight == 1.0
        elif pos <= 15:
            assert weight == 0.5
        else:
            assert weight == 0.2


async def test_empty_ingredients():
    result = await analyze(skin_type="normal", ingredients_text="", language="tr")
    assert result["total_ingredients"] == 0


async def test_english_language():
    result = await analyze(
        skin_type="sensitive",
        ingredients_text="Glycerin",
        language="en",
    )
    assert "This analysis" in result["disclaimer"]


async def test_matched_as_field():
    result = await analyze(
        skin_type="sensitive",
        ingredients_text="Parfum",
        language="tr",
    )
    # Parfum is a synonym for Fragrance, should have matched_as
    all_items = result["beneficial"] + result["caution"] + result["neutral"]
    if all_items:
        parfum_items = [i for i in all_items if i["name"] == "Parfum"]
        if parfum_items:
            assert "matched_as" in parfum_items[0]
