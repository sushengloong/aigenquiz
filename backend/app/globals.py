# TODO: get rid of global variables.

import uuid
from typing import Dict

from app.models import Quizzes

OPENAI_MODEL_NAME = "gpt-3.5-turbo-1106"
# OPENAI_MODEL_NAME = "gpt-4-1106-preview"  # When you feel rich, try this one.
MAX_CONTEXT_LENGTH = 16000

JOB_OUTPUT_QUIZZES: Dict[uuid.UUID, Quizzes] = {}
