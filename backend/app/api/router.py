from fastapi import APIRouter

from app.api.analysis import router as analysis_router
from app.api.feedback import router as feedback_router
from app.api.ingredients import router as ingredients_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(analysis_router, tags=["analysis"])
api_router.include_router(ingredients_router, tags=["ingredients"])
api_router.include_router(feedback_router, tags=["feedback"])
