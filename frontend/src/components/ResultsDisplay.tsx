import React, { useEffect, useRef, useState } from 'react';

interface ResultsDisplayProps {
  results: {
    appliedHtml: string;
    codeSnippet: string;
    fullHtml: string;
  } | null;
}

const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showFullHtml, setShowFullHtml] = useState(false);

  // Apply codeSnippet to the container
  useEffect(() => {
    if (results?.codeSnippet && containerRef.current) {
      try {
        const fn = new Function('container', results.codeSnippet);
        fn(containerRef.current);
      } catch (err) {
        console.error('Execution error:', err);
      }
    }
  }, [results]);

  return (
    <div className="results-container">
      <h2 className="text-xl font-medium mb-4 gradient-text">Results</h2>

      {/* Toggle Button */}
      <div className="mb-4">
        <button
          onClick={() => setShowFullHtml(!showFullHtml)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {showFullHtml ? 'Hide Full Code' : 'Show Full Code'}
        </button>
      </div>

      {/* Applied HTML + Code Execution */}
      {!showFullHtml && (
        <div
          id="results-content"
          ref={containerRef}
          className="text-gray-700 border-t pt-4 min-h-[150px]"
        >
          <h3 className="text-lg font-semibold mb-2">✨ Applied Changes:</h3>
          {results?.appliedHtml ? (
            <div dangerouslySetInnerHTML={{ __html: results.appliedHtml }} />
          ) : (
            <p className="text-gray-400 italic">Waiting for voice instructions...</p>
          )}
        </div>
      )}

      {/* Full HTML Display */}
      {showFullHtml && (
        <div className="border-t pt-4 mt-6">
          <h3 className="text-lg font-semibold mb-2">🧾 Full Generated HTML:</h3>
          <pre className="bg-gray-100 p-4 rounded-md text-sm text-gray-800 overflow-auto whitespace-pre-wrap">
            {results?.fullHtml}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
