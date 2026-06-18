from fastapi import APIRouter

from app.embedding import generate_embedding
from app.models import EmbedRequest

router = APIRouter()

@router.post("/embed")
def embed(req: EmbedRequest):
    vector = generate_embedding(req.text)

    return {
        "embedding": vector,
        "dimensions": len(vector),
    }