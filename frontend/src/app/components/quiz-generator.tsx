'use client';

import { useState, FormEvent } from 'react';
import QuizComponent from './quiz-component';
import LoadingSpinner from './loading-spinner';

export default function QuizGenerator() {
    const [url, setUrl] = useState<string>('');
    const [quizzes, setQuizzes] = useState<Quizzes | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        if (response.ok) {
            const quizzes: Quizzes = await response.json();
            setQuizzes(quizzes);
        } else {
            console.error('Failed to generate quiz');
        }
        setIsLoading(false);
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
            {isLoading ? <LoadingSpinner />:
                quizzes && (
                    <div className="mt-4">
                        <h2 className="text-lg font-semibold">Quizzes:</h2>
                        {quizzes.quizzes.map((quiz, index) => (
                            <QuizComponent key={index} quiz={quiz} index={index} />
                        ))}
                    </div>
                )}
        </div>
    );
}
