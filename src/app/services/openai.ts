import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateQuiz = async function* (context: string) {
  const contextClipped = context.substring(0, 1000);
  const numQuizzes = 5;
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
        Write ${numQuizzes} multiple-choice quizzes that can test my understanding of the text below. Each quiz must have 4 choices and only 1 is the correct answer. For each of the choices, explain why the choice is correct or wrong.

        Your response must follow the format below:

        ###
        Question 1
        Choice A
        Choice B
        Choice C
        Choice D
        Correct choice (only the letter)
        Explanation

        Question 2
        Choice A
        Choice B
        Choice C
        Choice D
        Correct choice (only the letter)
        Explanation

        Question 3
        Choice A
        Choice B
        Choice C
        Choice D
        Correct choice (only the letter)
        Explanation
        ###

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
  });

  // let started = false;
  // let line = "";

  for await (const chunk of chatCompletionStream) {
    const token = chunk.choices[0]?.delta?.content || "";
    yield token;
    // if (token === "###") {
    //   if (started) {
    //     break;
    //   } else if (!started) {
    //     started = true;
    //     continue;
    //   }
    // } else if (token === "\n") {
    //   yield line + "\n";
    // } else {
    //   line += token;
    // }
  }
};
