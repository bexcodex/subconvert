import React, { useState } from 'react';
import Converter from './Converter.jsx';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>V2Ray to Clash Converter</h1>
        <p>Convert V2Ray links to Clash YAML configuration</p>
      </header>
      <main>
        <Converter />
      </main>
    </div>
  );
}

export default App;