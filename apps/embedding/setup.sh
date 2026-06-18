#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate

python -m pip install --upgrade pip wheel
pip install "setuptools<82"

python -m pip install \
    torch \
    --index-url https://download.pytorch.org/whl/cpu

python -m pip install -r requirements.txt

# Load env vars
set -a
source "$ROOT_DIR/.env"
set +a

MODEL="${EMBEDDING_MODEL:-all-MiniLM-L6-v2}"

echo "Pre-downloading model: $MODEL"

python - <<PY
from sentence_transformers import SentenceTransformer

SentenceTransformer(
    "${MODEL}",
    device="cpu"
)

print("Model downloaded successfully")
PY

echo "Embedding environment ready."