import { CHANNEL_NAME } from "@/app/events";
import { Redis } from "ioredis";

const redisSubscriber = new Redis();

redisSubscriber.subscribe(CHANNEL_NAME, (err, count) => {
  if (err) {
    console.error("Failed to subscribe: %s", err.message);
  } else {
    console.log(
      `Subscribed successfully! This client is currently subscribed to ${count} channels.`,
    );
  }
});

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

async function* makeIterator() {
  while (true) {
    yield new Promise<string>((resolve) => {
      redisSubscriber.once("message", (receivedChannel, message) => {
        if (receivedChannel === CHANNEL_NAME) {
          resolve(`data: ${message}\n\n`);
        }
      });
    });
  }
}

export async function GET() {
  // Set headers necessary for SSE
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  const iterator = makeIterator();
  const stream = iteratorToStream(iterator);

  // Return a new Response object with the stream and headers
  return new Response(stream, { headers });
}
