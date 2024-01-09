"use client";

import { useState, FormEvent, useEffect } from "react";
import QuizComponent from "./quiz-component";
import LoadingSpinner from "./loading-spinner";

import { GenerateJob, Quiz } from "../models";

export default function QuizGenerator() {
  const NUM_QUESTIONS = 5;
  const [url, setUrl] = useState<string>("");
  const [quiz, setQuiz] = useState<string[][]>(
    new Array(NUM_QUESTIONS).fill(new Array(NUM_QUESTIONS).fill("")),
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "text/event-stream",
      },
      body: JSON.stringify({ url }),
    });

    if (response.ok) {
      const stream = response.body!;
      const reader = stream.getReader();

      setIsLoading(false);

      const readChunk = async () => {
        const { value, done } = await reader.read();
        if (done) {
          console.log("Stream finished");
          return;
        }
        const chunkString = new TextDecoder().decode(value);
        console.log("Chunk:", chunkString);
        readChunk();
      };

      await readChunk();
    } else {
      console.error("Failed to generate quiz");
      setIsLoading(false);
    }
  };

  return (
    <div className="container place-items-center mx-auto p-4">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <label htmlFor="urlInput" className="text-lg font-medium text-gray-700">
          Generate quizzes to test your understanding
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="p-2 border border-gray-300 rounded text-gray-800"
          placeholder="Enter URL"
        />
        {!isLoading && (
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Generate
          </button>
        )}
      </form>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Quizzes:</h2>
          {quiz}
          {/* {quizzes.map((quiz, index) => (
              <QuizComponent key={index} quiz={quiz} index={index} />
            ))} */}
        </div>
      )}
    </div>
  );
}
