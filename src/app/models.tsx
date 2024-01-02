export interface Choice {
  choice: string;
  is_correct: boolean;
  explanation: string;
}

export interface Quiz {
  question: string;
  choices: Choice[];
}

export interface GenerateJob {
  id: string;
}
