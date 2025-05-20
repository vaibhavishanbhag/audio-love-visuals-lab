
import React from 'react';

interface ResultsDisplayProps {
  results: string | null;
}

const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  return (
    <div className="results-container">
      <h2 className="text-xl font-medium mb-4 gradient-text">Results</h2>
      <div id="results-content" className="text-gray-300">
        {results ? (
          <div dangerouslySetInnerHTML={{ __html: results }} />
        ) : (
          <p className="text-gray-400 italic">
            Record audio with the microphone button above, and processing results will appear here.
          </p>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;
