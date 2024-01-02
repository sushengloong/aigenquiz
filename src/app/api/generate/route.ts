import { CHANNEL_NAME } from "@/app/events";
import { Redis } from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { PdfReader } from "pdfreader";

const redisPublisher = new Redis();

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

async function fetchUrlAndGenerateQuiz(id: string, url: string) {
  console.log(`Fetching URL and generating quiz for ${id} and ${url}...`);

  const pdfBuffer = await downloadPdf(url);
  const pdfText = await parsePdf(pdfBuffer);
  console.log(`Parse PDF text: ${pdfText.substring(0, 80)}...`);
  const response = JSON.stringify({ id: id, message: "Hello World!" });
  redisPublisher.publish(CHANNEL_NAME, response, (err) => {
    if (err) {
      console.error("Failed to publish: %s", err.message);
    } else {
      console.log("Published successfully!");
    }
  });
}

export async function POST(req: Request) {
  const { url } = await req.json();
  const id = uuidv4();
  fetchUrlAndGenerateQuiz(id, url);
  return new Response(JSON.stringify({ id }));
}
