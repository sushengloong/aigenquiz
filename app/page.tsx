"use client";

import React, { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const handleSubmit = (e: React.ChangeEvent<HTMLInputElement>) => {
    // handle the submission logic here
    console.log(url);
    e.preventDefault();
  };

  return (
    <div className="bg-gray-200 h-screen flex items-center justify-center">
      <form className="bg-white p-8 rounded shadow-md w-96">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">Enter your URL:</label>
        <div className="flex flex-col">
          <input type="text" id="search" name="search" className="mt-1 p-2 border rounded-l-md w-full" placeholder="Enter your URL" value={url} onChange={handleUrlChange} />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600" onClick={handleSubmit}>Generate</button>
        </div>
      </form>
    </div>
  );
}
