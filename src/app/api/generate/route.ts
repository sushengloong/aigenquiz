import { v4 as uuidv4 } from "uuid";
import { PdfReader } from "pdfreader";
import { generateQuiz } from "@/app/services/openai";
import { scrape } from "@/app/services/scraper";

async function downloadPdf(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function parsePdf(pdfBuffer: Buffer): Promise<string> {
  let pdfText = "";
  return new Promise((resolve, reject) => {
    new PdfReader(null).parseBuffer(pdfBuffer, (err, item) => {
      if (err) reject(err);
      else if (!item) resolve(pdfText);
      else if (item.text) pdfText = `${pdfText} ${item.text}`;
    });
  });
}

async function fetchUrlAndGenerateQuiz(
  id: string,
  url: string,
): Promise<AsyncGenerator<string, void, unknown>> {
  console.log(`Fetching URL and generating quiz for ${id} and ${url}...`);

  const trimmedUrl = url.trim();

  let context: string;
  if (trimmedUrl.endsWith(".pdf") || trimmedUrl.endsWith(".PDF")) {
    const pdfBuffer = await downloadPdf(url);
    context = await parsePdf(pdfBuffer);
  } else {
    context = await scrape(trimmedUrl);
  }

  console.info(`Context: ${context.substring(0, 80)}...`);

  return generateQuiz(context);
}

function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

export async function POST(req: Request) {
  const { url } = await req.json();
  const id = uuidv4();
  const generator = await fetchUrlAndGenerateQuiz(id, url);

  const stream = iteratorToStream(generator);

  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  return new Response(stream, { headers });
}
