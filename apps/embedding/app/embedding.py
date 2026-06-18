from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None


def load_model(model_name: str) -> None:
    global _model

    if _model is None:
        print(f"Loading embedding model: {model_name}")

        _model = SentenceTransformer(
            model_name,
            device="cpu",
        )

        print("Embedding model loaded")


def generate_embedding(text: str) -> list[float]:
    if _model is None:
        raise RuntimeError("Embedding model not loaded")

    return _model.encode(text).tolist()
