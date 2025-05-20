
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import AudioVisualizer from '../components/AudioVisualizer';
import ResultsDisplay from '../components/ResultsDisplay';

const Index = () => {
  const [results, setResults] = useState<string | null>(null);
  
  // This function will be available globally for external scripts to call
  // to update the results
  useEffect(() => {
    // Expose a global function to update results
    window.updateAudioResults = (htmlContent: string) => {
      setResults(htmlContent);
    };
    
    // Clean up
    return () => {
      delete window.updateAudioResults;
    };
  }, []);

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Audio Visualizer
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Capture and visualize your audio. Click the mic button below to start recording.
            Results will appear in the section below once processing is complete.
          </p>
        </div>
        
        <AudioVisualizer />
        
        <div className="mt-16">
          <ResultsDisplay results={results} />
        </div>
      </main>
      
      <footer className="mt-16 py-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} AudioViz. All rights reserved.</p>
      </footer>
    </div>
  );
};

// Add TypeScript declaration for the global function
declare global {
  interface Window {
    updateAudioResults: (htmlContent: string) => void;
  }
}

export default Index;
