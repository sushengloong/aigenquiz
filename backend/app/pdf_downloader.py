import io
from typing import IO

import requests
from pypdf import PdfReader


def download_pdf(url) -> IO[bytes]:
    response = requests.get(url)
    if response.status_code == 200:
        return io.BytesIO(response.content)
    else:
        raise Exception(f"Failed to download PDF: Status code {response.status_code}")


def parse_pdf(file_stream: IO[bytes]) -> str:
    pdf_reader = PdfReader(file_stream)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() + "\n"
    return text
