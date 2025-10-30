import React from 'react';
import Converter from './Converter';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <header className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-lg border-b border-gray-700/50 py-8 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            V2Ray to Clash Converter
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Convert V2Ray links to Clash YAML configuration with advanced options
          </p>
        </div>
      </header>
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl p-1">
          <Converter />
        </div>
      </main>
    </div>
  );
}

export default App;