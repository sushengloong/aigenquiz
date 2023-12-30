import requests
from bs4 import BeautifulSoup, Comment


def scrape(input_url: str) -> str:
    r = requests.get(input_url)
    soup = BeautifulSoup(r.content, "html.parser")
    texts = soup.findAll(text=True)
    visible_texts = filter(_tag_visible, texts)
    return " ".join(t.strip() for t in visible_texts)


def _tag_visible(element) -> bool:
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
