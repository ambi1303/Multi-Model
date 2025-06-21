import React, { createContext, useContext, useState } from 'react';

// Default structure for sentiment results
const defaultResults = {
  Audio: null, // { sentiment, score }
  Chat: null,
  Video: null,
  Survey: null,
};

const SentimentContext = createContext({
  results: defaultResults,
  setResult: () => {},
  resetResults: () => {},
});

export const useSentiment = () => useContext(SentimentContext);

export const SentimentProvider = ({ children }) => {
  const [results, setResults] = useState(defaultResults);

  // Set result for a specific modality
  const setResult = (modality, result) => {
    setResults(prev => ({ ...prev, [modality]: result }));
  };

  // Reset all results
  const resetResults = () => setResults(defaultResults);

  return (
    <SentimentContext.Provider value={{ results, setResult, resetResults }}>
      {children}
    </SentimentContext.Provider>
  );
}; 