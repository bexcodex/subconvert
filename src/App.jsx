import React, { useState } from 'react';
import './App.css';
import V2RayConverter from './components/V2RayConverter';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Clash V2Ray Link Converter</h1>
        <p>Convert V2Ray links to Clash YAML format with load balancing, ad blocking, and more</p>
      </header>
      <main>
        <V2RayConverter />
      </main>
    </div>
  );
}

export default App;