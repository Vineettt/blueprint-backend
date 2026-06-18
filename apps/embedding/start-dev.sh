#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"

set -a
source "$ROOT_DIR/.env"
set +a

source .venv/bin/activate

exec uvicorn app.main:app \
  --host "${EMBEDDING_HOST:-0.0.0.0}" \
  --port "${EMBEDDING_PORT:-8000}" \
  --reload