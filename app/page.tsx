import React from 'react';
import OpenAI from 'openai';
import { JSDOM } from 'jsdom';

const openai = new OpenAI();

export default function Home() {
  async function generateQuiz(formData: FormData) {
    'use server'

    const documentUrl = formData.get('documenturl') as string;

    console.log('[generateQuiz] received formData: ', documentUrl);

    const documentUrlResponse = await fetch(documentUrl);
    const documentUrlResponseText = await documentUrlResponse.text();
    const dom = new JSDOM(documentUrlResponseText);
    const bodyDom = dom.window.document.body.textContent as string;
    // TODO: hack
    const content = bodyDom;
    console.log(content);

    const stream = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You can generate quizes that cover the gist of any given text.' },
        { role: 'user', content: `Write top 3 multiple-choice quiz that can test my understanding of the text below. Each question should have 4 choices but only 1 is correct answer. Explain why the answer is correct and why each of other choices is wrong. Explain if this is an easy, medium or hard question. \n\n ${content}` }
      ], // difficulty
      model: 'gpt-3.5-turbo',
      stream: true
    });
    for await (const chunk of stream) {
      process.stdout.write(chunk.choices[0]?.delta?.content || '');
    }
  }

  return (
    <div className="bg-gray-200 h-screen flex items-center justify-center">
      <form className="bg-white p-8 rounded shadow-md w-96" action={generateQuiz}>
        <label htmlFor="documenturl" className="block text-sm font-medium text-gray-700">Enter your URL:</label>
        <div className="flex flex-col">
          <input type="text" id="documenturl" name="documenturl" className="mt-1 p-2 border rounded-l-md w-full text-gray-800" placeholder="Enter your URL" />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600">Generate</button>
        </div>
      </form>
    </div>
  );
}
