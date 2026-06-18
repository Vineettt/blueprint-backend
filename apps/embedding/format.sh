#!/usr/bin/env bash

set -e

source .venv/bin/activate

ruff check . --fix
ruff format .