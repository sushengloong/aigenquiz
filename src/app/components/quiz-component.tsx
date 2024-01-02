import { useState } from "react";
import { Quiz } from "../models";

interface QuizComponentProps {
  quiz: Quiz;
  index: number;
}

export default function QuizGenerator({ quiz, index }: QuizComponentProps) {
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(
    null,
  );

  const handleChoiceClick = (choiceIndex: number) => {
    setSelectedChoiceIndex(choiceIndex);
  };

  const getButtonClasses = (choiceIndex: number) => {
    let baseClasses = "py-2 px-4 rounded shadow font-semibold ";
    if (selectedChoiceIndex === choiceIndex) {
      baseClasses += quiz.choices[choiceIndex].is_correct
        ? "bg-green-500 text-white "
        : "bg-red-500 text-white ";
    } else {
      baseClasses += "bg-gray-200 hover:bg-gray-300 text-gray-800 ";
    }
    return baseClasses;
  };

  return (
    <div className="m-8">
      <h3 className="font-medium">
        {index + 1}. {quiz.question}
      </h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {quiz.choices.map((choice, choiceIndex) => (
          <button
            key={choiceIndex}
            onClick={() => handleChoiceClick(choiceIndex)}
            className={getButtonClasses(choiceIndex)}
          >
            {choice.choice}
          </button>
        ))}
      </div>
      {selectedChoiceIndex !== null && (
        <div className="mt-2 text-sm text-gray-600">
          Explanation: {quiz.choices[selectedChoiceIndex].explanation}
        </div>
      )}
    </div>
  );
}
