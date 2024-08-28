import OpenAI from "openai";
import { Quizzes } from "../models";

import zodToJsonSchema from "zod-to-json-schema";

import { OpenAiHandler, StreamMode, Entity } from "openai-partial-stream";

const MODEL_NAME = "gpt-4o-2024-08-06";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateQuiz = async function* (
  context: string,
  numQuestions: number,
) {
  const contextClipped = context.substring(0, 1000);
  const chatCompletionStream = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          `Create ${numQuestions} top multiple-choice questions for a given text from the user in a valid JSON output.` +
          "All questions must be on the key takeaways and insights of the given text." +
          "Each question must have 4 choices and only 1 is the correct answer. For each of the choices, explain why the choice is correct or wrong.",
      },
      {
        role: "user",
        content: `The text: ${contextClipped}`,
      },
    ],
    model: MODEL_NAME,
    temperature: 0.8,
    stream: true,
    functions: [
      {
        name: "create_quiz",
        description: "Create a quiz from a given text",
        parameters: zodToJsonSchema(Quizzes),
      },
    ],
    function_call: { name: "create_quiz" },
  });

  const openAiHandler = new OpenAiHandler(
    StreamMode.StreamObjectKeyValueTokens,
  );
  const entityStream = openAiHandler.process(chatCompletionStream);
  const quizzesEntity = new Entity("quizzes", Quizzes);
  const quizzesStream = quizzesEntity.genParse(entityStream);

  for await (const item of quizzesStream) {
    yield JSON.stringify(item || "{}");
  }
};
