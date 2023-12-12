interface Choice {
    choice: string;
    is_correct: boolean;
    explanation: string
}

interface Quiz {
    question: string;
    choices: Choice[];
}

interface Quizzes {
    quizzes: Quiz[];
    count: number;
}
