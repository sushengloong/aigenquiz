import OpenAI from "openai";
import { Quizzes } from "../models";
import zodToJsonSchema from "zod-to-json-schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// TODO: return a custom type
export const generateQuiz = async (context: string): Promise<string> => {
  const contextClipped = context.substring(0, 1000);
  const numQuizzes = 5;
  // TODO:  use https://github.com/vega/ts-json-schema-generator to generate the JSON schema
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an assistant that can generate quizzes covering the gist of any given text and output totally valid JSON.",
      },
      {
        role: "user",
        content: `Write top ${numQuizzes} multiple-choice quizzes that can test my understanding of the text below. Each quiz must have 4 choices and only 1 is the correct answer. For each of the choices, explain why the choice is correct or wrong. \n\n ${contextClipped}`,
      },
    ],
    model: "gpt-3.5-turbo",
    functions: [
      {
        name: "generate_quizzes",
        description: "Generate quizzes from a given text",
        parameters: zodToJsonSchema(Quizzes),
      },
    ],
    function_call: { name: "generate_quizzes" },
  });
  const functionCall = chatCompletion.choices[0].message.function_call;
  return functionCall?.arguments ?? "{}";
};
