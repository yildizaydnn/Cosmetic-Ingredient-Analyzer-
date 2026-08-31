from app.services.analyzer import _parse_inci as parse_inci


def test_simple_list():
    result = parse_inci("Aqua, Glycerin, Niacinamide")
    assert result == ["Aqua", "Glycerin", "Niacinamide"]


def test_parenthesized_ingredients():
    result = parse_inci("Aqua (Water), Tocopherol (Vitamin E)")
    assert result == ["Aqua (Water)", "Tocopherol (Vitamin E)"]


def test_mixed_spacing():
    result = parse_inci("Aqua,Glycerin,  Niacinamide ,Retinol")
    assert result == ["Aqua", "Glycerin", "Niacinamide", "Retinol"]


def test_single_ingredient():
    result = parse_inci("Glycerin")
    assert result == ["Glycerin"]


def test_empty_string():
    assert parse_inci("") == []
    assert parse_inci("   ") == []


def test_trailing_commas():
    result = parse_inci("Aqua, Glycerin,, ,")
    assert result == ["Aqua", "Glycerin"]
