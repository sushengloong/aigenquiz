#!/usr/bin/env bash

source venv/bin/activate

pip install -r requirements.txt

mypy app/

uvicorn app.main:app --reload --log-level debug
