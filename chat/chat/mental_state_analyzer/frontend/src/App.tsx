import React, { useState } from 'react';
import './App.css';

interface AnalysisResult {
  mental_state: string;
  sentiment_score: number;
  primary_emotion: string;
  emotion_score: number;
  timestamp: string;
}

function App() {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/analyze/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: message }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze message');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Mental State Analyzer</h1>
        
        <form onSubmit={handleSubmit} className="input-form">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            rows={4}
            className="message-input"
          />
          <button 
            type="submit" 
            disabled={loading || !message.trim()}
            className="analyze-button"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {result && (
          <div className="result-container">
            <h2>Analysis Results</h2>
            <div className="result-card">
              <div className="result-item">
                <strong>Mental State:</strong>
                <span>{result.mental_state}</span>
              </div>
              <div className="result-item">
                <strong>Primary Emotion:</strong>
                <span>{result.primary_emotion}</span>
              </div>
              <div className="result-item">
                <strong>Emotion Score:</strong>
                <span>{(result.emotion_score * 100).toFixed(1)}%</span>
              </div>
              <div className="result-item">
                <strong>Sentiment Score:</strong>
                <span>{(result.sentiment_score * 100).toFixed(1)}%</span>
              </div>
              <div className="result-item">
                <strong>Timestamp:</strong>
                <span>{new Date(result.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
