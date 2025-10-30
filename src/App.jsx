import React from 'react';
import Converter from './Converter.jsx';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-dark-900 text-gray-100">
      <header className="bg-dark-800 py-8 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-blue-500">V2Ray to Clash Converter</h1>
        <p className="text-lg text-gray-300">Convert V2Ray links to Clash YAML configuration</p>
      </header>
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Converter />
      </main>
    </div>
  );
}

export default App;