from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.embedding import generate_embedding, load_model
from app.models import EmbedRequest


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model(settings.EMBEDDING_MODEL)
    yield


# Determine if running in production mode
# Change "production" to match your actual settings variable value (e.g., settings.DEBUG == False)
IS_PROD = settings.ENVIRONMENT == "production"

app = FastAPI(
    title="blueprint Embedding Service",
    lifespan=lifespan,
    # Disables Swagger UI in production
    docs_url=None if IS_PROD else "/docs",
    # Disables ReDoc in production
    redoc_url=None if IS_PROD else "/redoc",
    # Disables raw JSON schema generation in production for security
    openapi_url=None if IS_PROD else "/openapi.json",
)


@app.get("/")
def root():
    return {"service": "embedding"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/embed")
def embed(req: EmbedRequest):
    vector = generate_embedding(req.text)

    return {
        "embedding": vector,
        "dimensions": len(vector),
    }
