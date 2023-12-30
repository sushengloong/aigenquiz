#!/usr/bin/env bash

set -e

source venv/bin/activate

pip install -r requirements.txt

ruff format app/

mypy app/

uvicorn app.main:app --reload --log-level debug
