# TODO: get rid of global variables.

import uuid
from typing import Dict

from app.models import Quizzes

JOB_OUTPUT_QUIZZES: Dict[uuid.UUID, Quizzes] = {}
