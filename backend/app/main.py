import asyncio
from enum import Enum
import json
import logging
import os
from typing import Dict
import uuid

from fastapi import BackgroundTasks, FastAPI, Response
from asgi_correlation_id import CorrelationIdFilter, CorrelationIdMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
import requests
from bs4 import BeautifulSoup, Comment
from sse_starlette import EventSourceResponse
from starlette.middleware.cors import CORSMiddleware

from app.models import GenerateRequest, Quizzes

os.environ["OPENAI_LOG"] = "debug"


def configure_logging():
    console_handler = logging.StreamHandler()
    console_handler.addFilter(CorrelationIdFilter(uuid_length=8))
    logging.basicConfig(
        handlers=[console_handler],
        level=logging.DEBUG,
        format="%(levelname)s: \t %(asctime)s [%(correlation_id)s] %(filename)s:%(lineno)d:%(funcName)s %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


app = FastAPI(on_startup=[configure_logging])
app.add_middleware(CorrelationIdMiddleware, header_name="Request-ID")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncOpenAI()


def tag_visible(element):
    if element.parent.name in [
        "style",
        "script",
        "head",
        "title",
        "meta",
        "[document]",
    ]:
        return False
    if isinstance(element, Comment):
        return False
    return True


job_output_quizzes: Dict[uuid.UUID, Quizzes] = {}


async def fetch_url_and_generate_quizzes(job_id: uuid.UUID, input_url: str):
    logging.info(f"Starting job {str(job_id)}")
    r = requests.get(input_url)
    soup = BeautifulSoup(r.content, "html.parser")
    texts = soup.findAll(text=True)
    visible_texts = filter(tag_visible, texts)
    context = " ".join(t.strip() for t in visible_texts)
    num_quizzes = 5
    chat_completion = await client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that can generate quizzes that cover the gist of any given text and output JSON.",
            },
            {
                "role": "user",
                "content": f"Write top {num_quizzes} multiple-choice quizzes that can test my understanding of the text below. Each quiz must have 4 choices and only 1 is the correct answer. For each of the choices, explain why the choice is correct or wrong. Describe the difficulty of the question relative to other questions(whether this is an easy, medium or hard question). \n\n {context}",
            },
        ],
        model="gpt-3.5-turbo-1106",
        functions=[
            {
                "name": "generate_quizes",
                "description": "Generate quizzes from a given text",
                "parameters": Quizzes.model_json_schema(),
            }
        ],
        function_call={"name": "generate_quizes"},
        response_format={"type": "json_object"},
    )
    completionMessageFuncCall = chat_completion.choices[0].message.function_call
    if completionMessageFuncCall is not None:
        generated_content = completionMessageFuncCall.arguments
    else:
        generated_content = "{}"  # TODO: error handling
    #     generated_content = """
    # {"quizzes":[{"question":"What does OCR stand for?","hint":"The text explains the purpose and function of OCR technology.","choices":[{"letter":null,"choice":"Online Character Recognition","is_correct":false,"explanation":"This is not the correct expansion of OCR. The correct expansion is Optical Character Recognition, which is explained in the text to be technology within the field of computer vision that recognizes characters in documents and converts them into text."},{"letter":null,"choice":"Optical Character Recognition","is_correct":true,"explanation":"Correct! OCR stands for Optical Character Recognition, which is a technology within the field of computer vision that recognizes characters in documents and converts them into text."},{"letter":null,"choice":"Offline Character Recognition","is_correct":false,"explanation":"This is not the correct expansion of OCR. The correct expansion is Optical Character Recognition, which is explained in the text to be technology within the field of computer vision that recognizes characters in documents and converts them into text."},{"letter":null,"choice":"Object Character Recognition","is_correct":false,"explanation":"This is not the correct expansion of OCR. The correct expansion is Optical Character Recognition, which is explained in the text to be technology within the field of computer vision that recognizes characters in documents and converts them into text."}],"answer":"Optical Character Recognition","explanation":"OCR stands for Optical Character Recognition, which is a technology within the field of computer vision that recognizes characters in documents and converts them into text. This question is of medium difficulty relative to other questions because it tests basic understanding of a technology that is explained in the text."},{"question":"What is the purpose of ChromaDB in the context of the text?","hint":"The text discusses how ChromaDB is used to store extracted PDF content.","choices":[{"letter":null,"choice":"Extract text from PDFs","is_correct":false,"explanation":"This is not the purpose of ChromaDB. The text explains that ChromaDB is used as an in-memory vector database to store the extracted PDF content, not to extract text from PDFs."},{"letter":null,"choice":"Generate responses using OpenAI","is_correct":false,"explanation":"This is not the purpose of ChromaDB. The text explains that ChromaDB is used as an in-memory vector database to store the extracted PDF content, not to generate responses using OpenAI."},{"letter":null,"choice":"Store extracted PDF content","is_correct":true,"explanation":"Correct! ChromaDB is used as an in-memory vector database to store the extracted PDF content. This is explained in the text as the purpose of using ChromaDB."},{"letter":null,"choice":"Display chat messages","is_correct":false,"explanation":"This is not the purpose of ChromaDB. The text explains that ChromaDB is used as an in-memory vector database to store the extracted PDF content, not to display chat messages."}],"answer":"Store extracted PDF content","explanation":"ChromaDB is used as an in-memory vector database to store the extracted PDF content. This is explained in the text as the purpose of using ChromaDB. This question is of medium difficulty relative to other questions because it requires understanding the role of ChromaDB in the context of the provided information."},{"question":"What is the technology used for vectorizing text chunks in the tutorial?","hint":"The text explains the process of vectorizing text chunks using a specific technology.","choices":[{"letter":null,"choice":"BERT","is_correct":true,"explanation":"Correct! The text mentions that the extracted text chunks are converted into a high-dimensional vector using embedding models like Word2Vec, FastText, or BERT."},{"letter":null,"choice":"OpenAI","is_correct":false,"explanation":"This is not the technology used for vectorizing text chunks. The text mentions embedding models like Word2Vec, FastText, or BERT, but not specifically OpenAI."},{"letter":null,"choice":"Streamlit","is_correct":false,"explanation":"Streamlit is not the technology used for vectorizing text chunks. The text mentions embedding models like Word2Vec, FastText, or BERT, but not specifically Streamlit."},{"letter":null,"choice":"Azure Cognitive Services","is_correct":false,"explanation":"Azure Cognitive Services is not the technology used for vectorizing text chunks. The text mentions embedding models like Word2Vec, FastText, or BERT, but not specifically Azure Cognitive Services."}],"answer":"BERT","explanation":"The extracted text chunks are converted into a high-dimensional vector using embedding models like Word2Vec, FastText, or BERT. This question is of medium difficulty relative to other questions because it requires understanding the technology used for vectorizing text chunks as explained in the text."},{"question":"What is the function of OpenAI in the chatbot application?","hint":"The text discusses the role of OpenAI in the context of the chatbot application.","choices":[{"letter":null,"choice":"Upload PDF files","is_correct":false,"explanation":"This is not the function of OpenAI in the chatbot application. The text explains that OpenAI is used to receive relevant data from ChromaDB and return a response based on the chatbot input."},{"letter":null,"choice":"Generate prompts based on user input","is_correct":false,"explanation":"This is not the function of OpenAI in the chatbot application. The text explains that OpenAI is used to receive relevant data from ChromaDB and return a response based on the chatbot input."},{"letter":null,"choice":"Receive relevant data from ChromaDB and return a response based on chatbot input","is_correct":true,"explanation":"Correct! OpenAI is used to receive relevant data from ChromaDB and return a response based on the chatbot input. This is explained in the text as the function of OpenAI in the chatbot application."},{"letter":null,"choice":"Set up the chat UI","is_correct":false,"explanation":"This is not the function of OpenAI in the chatbot application. The text explains that OpenAI is used to receive relevant data from ChromaDB and return a response based on the chatbot input."}],"answer":"Receive relevant data from ChromaDB and return a response based on chatbot input","explanation":"OpenAI is used to receive relevant data from ChromaDB and return a response based on the chatbot input. This is explained in the text as the function of OpenAI in the chatbot application. This question is of medium difficulty relative to other questions because it requires understanding the role of OpenAI in the context of the chatbot application."},{"question":"What is the purpose of using Azure Cognitive Services in the tutorial?","hint":"The text discusses how Azure Cognitive Services are used in the tutorial.","choices":[{"letter":null,"choice":"Generate text chunks from documents","is_correct":false,"explanation":"This is not the purpose of using Azure Cognitive Services. The text explains that Azure Cognitive Services are used for extracting textual content from PDFs using OCR, but not for generating text chunks from documents."},{"letter":null,"choice":"Store text chunks in a vector database","is_correct":false,"explanation":"This is not the purpose of using Azure Cognitive Services. The text explains that Azure Cognitive Services are used for extracting textual content from PDFs using OCR, but not for storing text chunks in a vector database."},{"letter":null,"choice":"Extract textual content from PDFs using OCR","is_correct":true,"explanation":"Correct! The purpose of using Azure Cognitive Services in the tutorial is to extract textual content from PDFs using OCR, as explained in the text."},{"letter":null,"choice":"Generate responses using OpenAI","is_correct":false,"explanation":"This is not the purpose of using Azure Cognitive Services. The text explains that Azure Cognitive Services are used for extracting textual content from PDFs using OCR, but not for generating responses using OpenAI."}],"answer":"Extract textual content from PDFs using OCR","explanation":"The purpose of using Azure Cognitive Services in the tutorial is to extract textual content from PDFs using OCR, as explained in the text. This question is of medium difficulty relative to other questions because it requires understanding the purpose of Azure Cognitive Services in the context of the tutorial."}],"count":5}
    #     """
    quizzes = json.loads(generated_content) if generated_content is not None else None
    job_output_quizzes[job_id] = quizzes
    logging.info(f"Finished job {str(job_id)}")


@app.post("/api/generate")
async def generate(
    generate_request: GenerateRequest, background_tasks: BackgroundTasks
):
    job_uuid = uuid.uuid4()
    background_tasks.add_task(
        fetch_url_and_generate_quizzes, job_uuid, generate_request.url
    )
    return {"id": str(job_uuid)}


@app.get("/api/generate_results")
async def generate_results() -> Response:
    async def event_stream():
        while True:
            for job_id, quizzes in list(job_output_quizzes.items()):
                quizzes_json = json.dumps({"job_id": str(job_id), "quizzes": quizzes})
                logging.info(f"Sending job {str(job_id)}")
                yield dict(data=quizzes_json)
                del job_output_quizzes[job_id]  # Clear update after sending
            await asyncio.sleep(1)  # Polling interval

    return EventSourceResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"cache-control": "no-transform"},
    )
