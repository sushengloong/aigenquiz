from enum import StrEnum
import json

from fastapi import FastAPI
from pydantic import BaseModel
from openai import AsyncOpenAI
import requests
from bs4 import BeautifulSoup, Comment

client = AsyncOpenAI()

app = FastAPI()


class GenerateRequest(BaseModel):
    url: str


class ChoiceLetter(StrEnum):
    A = 'a'
    B = 'b'
    C = 'c'
    D = 'd'


class Choice(BaseModel):
    letter: ChoiceLetter
    choice: 'str'
    is_correct: bool
    explanation: str


class Difficulty(StrEnum):
    EASY = 'easy'
    MEDIUM = 'medium'
    HARD = 'hard'


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


def tag_visible(element):
    if element.parent.name in ['style', 'script', 'head', 'title', 'meta', '[document]']:
        return False
    if isinstance(element, Comment):
        return False
    return True


@app.post("/api/generate")
async def generate(generateRequest: GenerateRequest):
    input_url = generateRequest.url
    r = requests.get(input_url)
    soup = BeautifulSoup(r.content, 'html.parser')
    texts = soup.findAll(text=True)
    visible_texts = filter(tag_visible, texts)
    context = u" ".join(t.strip() for t in visible_texts)
    print("context: ", context)

    chat_completion = await client.chat.completions.create(
        messages=[
            {'role': 'system', 'content': 'You are a helpful assistant that can generate quizzes that cover the gist of any given text and output JSON.'},
            {'role': 'user', 'content': f"Write top 3 multiple-choice quizzes that can test my understanding of the text below. Each quiz should have 4 choices but only 1 is the correct answer. Explain why the answer is correct and why each of other choices is wrong. Describe the difficulty of the question relative to other questions (whether this is an easy, medium or hard question). \n\n {
                context}"}
        ],
        model='gpt-3.5-turbo-1106',
        functions=[
            {
                'name': 'generate_quizes',
                'description': 'Generate quizzes from a given text',
                'parameters': Quizzes.model_json_schema()
            }
        ],
        function_call={'name': 'generate_quizes'},
        response_format={
            'type': 'json_object'
        }
    )
    generated_content = chat_completion.choices[0].message.function_call.arguments
    quizzes = json.loads(generated_content)
    print(quizzes)
    return quizzes
