import React from 'react';
import Converter from './Converter';
import './index.css';

function App() {
  return (
    <div className="min-h-screen font-sans antialiased">
      <header className="bg-primary/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img src="/icon.jpg" className="h-8 w-8" alt="icon" />
              <h1 className="text-xl font-bold text-text-heading">
                Clash Converter
              </h1>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Converter />
      </main>
      <footer className="bg-primary border-t border-border mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-text/60">
          <p>&copy; {new Date().getFullYear()} BEXCODEX. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;