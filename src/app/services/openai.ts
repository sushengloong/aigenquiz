import OpenAI from "openai";

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
        content: `Write top ${numQuizzes} multiple-choice quizzes that can test my understanding of the text below. Each quiz must have 4 choices and only 1 is the correct answer. For each of the choices, explain why the choice is correct or wrong. Describe the difficulty of the question relative to other questions(whether this is an easy, medium or hard question). \n\n ${contextClipped}`,
      },
    ],
    model: "gpt-3.5-turbo",
    functions: [
      {
        name: "generate_quizzes",
        description: "Generate quizzes from a given text",
        parameters: {
          type: "object",
          properties: {
            quizzes: {
              type: "array",
              maxItems: numQuizzes,
              items: {
                type: "object",
                properties: {
                  question: {
                    type: "string",
                  },
                  choices: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        choice: {
                          type: "string",
                        },
                        explanation: {
                          type: "string",
                        },
                        is_correct: {
                          type: "boolean",
                        },
                      },
                      required: ["choice", "explaination", "is_correct"],
                    },
                  },
                },
                required: ["question", "choices"],
              },
            },
          },
        },
      },
    ],
    function_call: { name: "generate_quizzes" },
  });
  const functionCall = chatCompletion.choices[0].message.function_call;
  return functionCall?.arguments ?? "{}";
};
