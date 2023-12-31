from enum import Enum

from pydantic import BaseModel


class GenerateRequest(BaseModel):
    url: str


class Choice(BaseModel):
    text: str
    is_correct: bool
    explanation: str


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Quiz(BaseModel):
    question: str
    hint: str
    choices: list[Choice]
    answer: str
    explanation: str
    difficulty: Difficulty


class Quizzes(BaseModel):
    quizzes: list[Quiz]
    count: int
