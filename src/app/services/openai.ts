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
          "You are an assistant that can generate excellent quizzes covering the gist of any given text.",
      },
      {
        role: "user",
        content: `
        Write ${numQuestions} multiple-choice questions that can test my understanding of the text below. Each quiz must have 4 choices and only 1 is the correct answer. For each of the choices, explain why the choice is correct or wrong.
        The text: ${contextClipped}
        `
          .split("\n")
          .map((line) => line.trim())
          .join("\n"),
      },
    ],
    model: "gpt-3.5-turbo",
    stream: true,
    max_tokens: 1000,
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
