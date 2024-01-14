"use client";

import { useState, FormEvent } from "react";
import LoadingSpinner from "./loading-spinner";
import { PartialStream, Quiz } from "../models";
import QuizComponent from "./quiz-component";

export default function QuizGenerator() {
  type Status = "ready" | "fetching" | "completing";

  const [url, setUrl] = useState<string>("");
  // eslint-disable-next-line no-unused-vars
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [status, setStatus] = useState<Status>("ready");
  const [numQuestions, setNumOfQuestions] = useState<number>(5);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("fetching");
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "text/event-stream",
      },
      body: JSON.stringify({ url, numQuestions }),
    });

    if (response.ok) {
      setStatus("completing");
      const stream = response.body!;
      const reader = stream.getReader();

      const readChunk = async () => {
        const { value, done } = await reader.read();
        if (done) {
          // console.log("Stream finished");
          setStatus("ready");
          return;
        }
        const jsonString = new TextDecoder().decode(value);
        let jsonObj: PartialStream | undefined;
        try {
          jsonObj = JSON.parse(jsonString);
        } catch (e) {
          // console.error(e);
        }
        // console.log(jsonObj);
        const quizzes = jsonObj?.data?.quizzes;
        if (quizzes) {
          console.log(quizzes);
          setQuizzes(quizzes);
        }
        readChunk();
      };

      await readChunk();
    } else {
      console.error("Failed to generate quiz");
      setStatus("ready");
    }
  };

  return (
    <div className="container place-items-center mx-auto p-4">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <label htmlFor="urlInput" className="text-lg font-medium text-gray-700">
          Generate quizzes to test your understanding
        </label>
        <div className="flex items-center">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="p-2 border border-gray-300 rounded text-gray-800 flex-grow"
            placeholder="Enter URL"
            disabled={status !== "ready"}
          />
          <label htmlFor="numberInput" className="ml-2">
            Number of questions:
          </label>
          <select
            id="numberSelect"
            className="border p-2 rounded ml-2"
            defaultValue={5}
            onChange={(e) => setNumOfQuestions(Number(e.target.value))}
            disabled={status !== "ready"}
          >
            {[...Array(10)].map((_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
        {status === "ready" && (
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Generate
          </button>
        )}
      </form>
      {!!quizzes.length && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Quizzes:</h2>
          {quizzes.map((quiz, index) => (
            <QuizComponent key={index} quiz={quiz} index={index} />
          ))}
        </div>
      )}
      {(status === "fetching" || status === "completing") && <LoadingSpinner />}
    </div>
  );
}
