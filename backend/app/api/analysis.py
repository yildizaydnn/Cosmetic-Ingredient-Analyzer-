import time

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.analysis import AnalysisRequest, AnalysisResponse, Language, OcrAnalysisRequest, SkinType
from app.services.analyzer import analyze
from app.services.ocr import extract_text_from_image, _tesseract_ocr, _cleanup_with_ai

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/analyze-text", response_model=AnalysisResponse, response_model_exclude_none=True)
async def analyze_text(request: AnalysisRequest):
    result = await analyze(
        skin_type=request.skin_type.value,
        ingredients_text=request.ingredients_text,
        language=request.language.value,
    )
    return result


@router.post("/analyze-ocr", response_model=AnalysisResponse, response_model_exclude_none=True)
async def analyze_ocr(request: OcrAnalysisRequest):
    """Ham OCR metnini DeepSeek ile düzeltip analiz eder. Mobil ML Kit OCR için."""
    cleaned = _cleanup_with_ai(request.raw_ocr_text)
    if not cleaned:
        raise HTTPException(status_code=422, detail="Could not extract ingredients from the OCR text. Please try again or enter manually.")

    result = await analyze(
        skin_type=request.skin_type.value,
        ingredients_text=cleaned,
        language=request.language.value,
    )
    return result


@router.post("/analyze", response_model=AnalysisResponse, response_model_exclude_none=True)
async def analyze_ingredients(
    skin_type: SkinType = Form(...),
    language: Language = Form(Language.tr),
    image: UploadFile = File(...),
):
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a JPEG, PNG, or WebP image.")

    image_bytes = await image.read()

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must not exceed 10 MB.")

    t0 = time.time()
    print(f"[API] Received image: {len(image_bytes)} bytes, content_type: {image.content_type}")

    t1 = time.time()
    extracted_text = extract_text_from_image(image_bytes)
    print(f"[API] OCR completed in {time.time()-t1:.1f}s — {repr(extracted_text[:120]) if extracted_text else 'EMPTY'}")

    if not extracted_text:
        raise HTTPException(status_code=422, detail="Could not extract text from the image. Please upload a clearer photo.")

    if extracted_text == "NOT_COSMETIC":
        not_cosmetic_msg = (
            "Bu ürün bir cilt bakım/kozmetik ürünü olarak algılanmadı. "
            "Lütfen bir kozmetik ürünün içindekiler listesini tarayın."
        ) if language == Language.tr else (
            "This product was not detected as a skincare/cosmetic product. "
            "Please scan the ingredients list of a cosmetic product."
        )
        raise HTTPException(status_code=422, detail=not_cosmetic_msg)

    t2 = time.time()
    result = await analyze(
        skin_type=skin_type.value,
        ingredients_text=extracted_text,
        language=language.value,
    )
    print(f"[API] Analysis completed in {time.time()-t2:.1f}s — total: {time.time()-t0:.1f}s")
    return result


@router.post("/debug-ocr")
async def debug_ocr(image: UploadFile = File(...)):
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file format.")

    image_bytes = await image.read()

    # 1. Tesseract ham çıktısı
    raw_text = _tesseract_ocr(image_bytes)

    # 2. DeepSeek düzeltmesi
    ai_cleaned = _cleanup_with_ai(raw_text) if raw_text else None

    return {
        "raw_tesseract": raw_text,
        "ai_cleaned": ai_cleaned,
        "final_output": ai_cleaned or raw_text,
    }
