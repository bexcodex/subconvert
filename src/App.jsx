import React from 'react';
import Converter from './Converter.jsx';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-dark-bg text-text">
      <header className="bg-dark-bg-card py-8 px-4 sm:px-6 lg:px-8 text-center shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-primary">V2Ray to Clash Converter</h1>
        <p className="text-lg text-text-secondary">Convert V2Ray links to Clash YAML configuration</p>
      </header>
      <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Converter />
      </main>
    </div>
  );
}

export default App;