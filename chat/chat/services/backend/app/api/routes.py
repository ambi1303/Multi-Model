from fastapi import APIRouter
from app.services import run_all_models

router = APIRouter()

@router.get("/")
def health_check():
    return {"status": "ok"}

@router.post("/analyze")
def analyze():
    result = run_all_models()
    return result
