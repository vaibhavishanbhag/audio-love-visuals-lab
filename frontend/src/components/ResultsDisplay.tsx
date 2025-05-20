import React, { useEffect, useRef } from 'react';

interface ResultsDisplayProps {
  results: string | null;
}

const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  let htmlContent = '';
  let codeSnippet = '';

  if (results) {
    try {
      const parsed = JSON.parse(results);
      htmlContent = parsed.htmlContent;
      codeSnippet = parsed.codeSnippet;
    } catch {
      htmlContent = results;
    }
  }

  // Run LLM-generated code scoped to this container
  useEffect(() => {
    if (containerRef.current && codeSnippet) {
      try {
        const fn = new Function('container', codeSnippet);
        fn(containerRef.current);
      } catch (err) {
        console.error('Error executing AI-generated code:', err);
      }
    }
  }, [codeSnippet]);

  return (
    <div className="results-container">
      <h2 className="text-xl font-medium mb-4 gradient-text">Results</h2>

      {/* Show Code */}
      {codeSnippet && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">🧠 Code Generated:</h3>
          <pre className="bg-gray-100 p-4 rounded-md text-sm text-blue-800 overflow-auto">
            <code>{codeSnippet}</code>
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
        {htmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          <p className="text-gray-400 italic">
            Record your request to see changes here.
          </p>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;
