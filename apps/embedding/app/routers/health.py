from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def root():
    return {"service": "embedding"}

@router.get("/health")
def health():
    return {"status": "ok"}