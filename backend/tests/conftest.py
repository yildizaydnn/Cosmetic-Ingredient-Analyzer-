import pytest

from app.services.ingredient_loader import load_ingredient_index


@pytest.fixture(scope="session", autouse=True)
async def load_index():
    await load_ingredient_index()
