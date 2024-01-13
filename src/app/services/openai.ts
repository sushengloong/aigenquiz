import OpenAI from "openai";
import { Quizzes } from "../models";

import zodToJsonSchema from "zod-to-json-schema";

import { OpenAiHandler, StreamMode, Entity } from "openai-partial-stream";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateQuiz = async function* (context: string) {
  const contextClipped = context.substring(0, 1000);
  const numQuestions = 5;
  const chatCompletionStream = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an assistant that can generate quizzes covering the gist and main takeaways of any given text and output totally valid JSON.",
      },
      {
        role: "user",
        content: `Write top ${numQuestions} multiple-choice quizzes that can test my understanding of the text below. Each quiz question must be at least 10 words long. Each quiz must have 4 choices and only 1 is the correct answer. For each of the choices, explain why the choice is correct or wrong. \n\n ${contextClipped}`,
      },
    ],
    model: "gpt-3.5-turbo",
    temperature: 0.1,
    stream: true,
    functions: [
      {
        name: "generate_quizzes",
        description: "Generate quizzes from a given text",
        parameters: zodToJsonSchema(Quizzes),
      },
    ],
    function_call: { name: "generate_quizzes" },
  });

  const openAiHandler = new OpenAiHandler(
    StreamMode.StreamObjectKeyValueTokens,
  );
  const entityStream = openAiHandler.process(chatCompletionStream);
  const quizzes = new Entity("quizzes", Quizzes);
  const quizzesStream = quizzes.genParse(entityStream);

  for await (const item of quizzesStream) {
    yield JSON.stringify(item || "{}");
  }
};
