from fastapi import APIRouter, Query

from app.services.ingredient_loader import get_ingredient_index

router = APIRouter()


@router.get("/ingredients")
async def search_ingredients(
    search: str = Query("", min_length=0),
    limit: int = Query(10, ge=1, le=100),
):
    index = get_ingredient_index()
    search_lower = search.lower()

    results = []
    for key, row in index.items():
        if search_lower in key or search_lower in row.get("name", "").lower():
            results.append({
                "name": row.get("name", ""),
                "category": row.get("category", ""),
                "category_tr": row.get("category_tr", ""),
            })
            if len(results) >= limit:
                break

    return {"results": results, "total": len(results)}
