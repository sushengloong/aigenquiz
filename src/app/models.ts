import { z } from "zod";

export const Choice = z.object({
  choice: z.string().default(""),
  is_correct: z.boolean().default(false),
  explanation: z.string().default(""),
});
export type Choice = z.infer<typeof Choice>;

export const Quiz = z.object({
  question: z.string().default(""),
  choices: z.array(Choice).default([]),
});
export type Quiz = z.infer<typeof Quiz>;

export const Quizzes = z.object({
  quizzes: z.array(Quiz).default([]),
});
export type Quizzes = z.infer<typeof Quizzes>;

export const GenerateJob = z.object({
  id: z.string(),
});
export type GenerateJob = z.infer<typeof GenerateJob>;

export const PartialStream = z.object({
  index: z.number(),
  status: z.string(),
  data: Quizzes,
  entity: z.string(),
});
export type PartialStream = z.infer<typeof PartialStream>;
