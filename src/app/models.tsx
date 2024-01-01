export interface Choice {
  text: string;
  is_correct: boolean;
  explanation: string;
}

export interface Quiz {
  question: string;
  choices: Choice[];
}

export interface Quizzes {
  quizzes: Quiz[];
  count: number;
}

export interface GenerateJob {
  id: string;
}
