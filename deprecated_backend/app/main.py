import asyncio
import json
import logging
import os
import uuid

from asgi_correlation_id import CorrelationIdFilter, CorrelationIdMiddleware
from fastapi import BackgroundTasks, FastAPI, Response
from sse_starlette import EventSourceResponse
from starlette.middleware.cors import CORSMiddleware

from app.globals import JOB_OUTPUT_QUIZZES, MAX_CONTEXT_LENGTH
from app.models import GenerateRequest
from app.openai import call_openai
from app.pdf_downloader import download_pdf, parse_pdf
from app.scraper import scrape

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


async def fetch_url_and_generate_quizzes(job_id: uuid.UUID, input_url: str):
    logging.info(f"Starting job {str(job_id)}")
    input_url = input_url.strip()
    if input_url.endswith(".pdf") or input_url.endswith(".PDF"):
        logging.info(f"PDF detected: {input_url}")
        pdf_stream = download_pdf(input_url)
        context = parse_pdf(pdf_stream)
        logging.info(f"Parsed:  {context}")
    else:
        context = await scrape(input_url)
        logging.info(f"Scraped:  {context}")

    context = context[:MAX_CONTEXT_LENGTH]

    generated_content = await call_openai(context)
    # generated_content = get_mock_openai_response(input_url)

    quizzes = json.loads(generated_content) if generated_content is not None else None
    JOB_OUTPUT_QUIZZES[job_id] = quizzes
    logging.info(f"Finished job {str(job_id)}")
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
            for job_id, quizzes in list(JOB_OUTPUT_QUIZZES.items()):
                quizzes_json = json.dumps({"job_id": str(job_id), "quizzes": quizzes})
                logging.info(f"Sending job {str(job_id)}")
                yield dict(data=quizzes_json)
                del JOB_OUTPUT_QUIZZES[job_id]  # Clear update after sending
            await asyncio.sleep(1)  # Polling interval

    return EventSourceResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"cache-control": "no-transform"},
    )
