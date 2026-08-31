from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.services.ingredient_loader import load_ingredient_index


@asynccontextmanager
async def lifespan(app: FastAPI):
    await load_ingredient_index()
    yield


app = FastAPI(
    title="Skincare Ingredient Analyzer",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
