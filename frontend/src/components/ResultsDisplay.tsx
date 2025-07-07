import React, { useEffect, useRef } from 'react';

interface ResultsDisplayProps {
  results: { htmlContent: string; codeSnippet: string } | null;
}

const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);


  // Run LLM-generated code scoped to this container
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

      {/* Show Code */}
      {results?.codeSnippet && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">🧠 Code Generated:</h3>
          <pre className="bg-gray-100 p-4 rounded-md text-sm text-blue-800 overflow-auto">
            <code>{results?.codeSnippet}</code>
          </pre>
        </div>
      )}

      {/* Apply Code Here */}
      <div
        id="results-content"
        ref={containerRef}
        className="text-gray-700 border-t pt-4 min-h-[150px]"
      >
        <h3 className="text-lg font-semibold mb-2">✨ Applied Changes:</h3>
        {results?.htmlContent  ? (
          <div dangerouslySetInnerHTML={{ __html: results.htmlContent }} />
        ) : (
          <p className="text-gray-400 italic">Waiting for response...</p>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;
