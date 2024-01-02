import { z } from "zod";

export const Choice = z.object({
  choice: z.string(),
  is_correct: z.boolean(),
  explanation: z.string(),
});
export type Choice = z.infer<typeof Choice>;

export const Quiz = z.object({
  question: z.string(),
  choices: z.array(Choice),
});
export type Quiz = z.infer<typeof Quiz>;

export const Quizzes = z.object({
  quizzes: z.array(Quiz),
});
export type Quizzes = z.infer<typeof Quizzes>;

export const GenerateJob = z.object({
  id: z.string(),
});
export type GenerateJob = z.infer<typeof GenerateJob>;
