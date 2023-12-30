from bs4 import Comment
from playwright.async_api import async_playwright


async def scrape(url: str) -> str:
    async with async_playwright() as p:
        # Launch the browser in headless mode
        browser = await p.firefox.launch(headless=True)
        # Open a new page
        page = await browser.new_page()
        # Navigate to the URL
        await page.goto(url)
        # Extract the text from the body
        text = await page.inner_text("body")
        # Close the browser
        await browser.close()
        return text if text is not None else ""


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
