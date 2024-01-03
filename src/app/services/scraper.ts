import { firefox } from "playwright";

export const scrape = async (url: string): Promise<string> => {
  // Launch the browser in headless mode
  const browser = await firefox.launch({ headless: true });
  // Open a new page
  const page = await browser.newPage();
  // Navigate to the URL
  await page.goto(url);
  // Extract the text from the body
  const text = await page.innerText("body");
  // Close the browser
  await browser.close();
  return text;
};
