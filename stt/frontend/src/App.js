import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  // Load session history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('sessionHistory');
    if (savedHistory) {
      setSessionHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save session history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
  }, [sessionHistory]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16
        } 
      });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'recording.webm');

        try {
          const response = await fetch('http://localhost:8000/analyze-speech', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          if (data.error) {
            setError(data.error);
            setResult(null);
          } else {
            setResult(data);
            setError(null);
            // Add to session history
            const newEntry = {
              id: Date.now(),
              timestamp: new Date().toLocaleString(),
              text: data.text,
              sentiment: data.sentiment,
              confidence: data.confidence,
              duration: recordingTime
            };
            setSessionHistory(prev => [newEntry, ...prev]);
          }
        } catch (err) {
          setError('Error analyzing speech: ' + err.message);
          setResult(null);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Error accessing microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const clearHistory = () => {
    setSessionHistory([]);
    localStorage.removeItem('sessionHistory');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'POSITIVE':
        return '#4CAF50';
      case 'NEGATIVE':
        return '#F44336';
      case 'NEUTRAL':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Speech-to-Text Emotion Analyzer</h1>
        <div className="controls">
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={`record-button ${isRecording ? 'recording' : ''}`}
            disabled={isProcessing}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          {isRecording && (
            <div className="recording-timer">
              Recording: {formatTime(recordingTime)}
            </div>
          )}
        </div>
        
        {isProcessing && (
          <div className="processing">
            <div className="spinner"></div>
            <p>Processing your speech...</p>
          </div>
        )}
        
        {error && (
          <div className="error">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="result-console" style={{
            background: '#181818',
            color: '#fff',
            borderRadius: 8,
            padding: 24,
            fontFamily: 'monospace',
            fontSize: '1.1em',
            marginTop: 24,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
          }}>
            <div>
              <span role="img" aria-label="mic">🎤</span> <b>Transcribed Text:</b> {result.text || 'N/A'}
            </div>
            <div style={{ marginTop: 12 }}>
              <span role="img" aria-label="brain">🧠</span> <b>Sentiment:</b> {result.sentiment || 'N/A'} <span style={{ color: '#aaa' }}>(Confidence: {typeof result.sentiment_score === 'number' ? result.sentiment_score.toFixed(2) : '0.00'})</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <span role="img" aria-label="bubble">💬</span> <b>Emotion:</b> {result.emotion || 'N/A'} <span style={{ color: '#aaa' }}>(Confidence: {typeof result.emotion_score === 'number' ? result.emotion_score.toFixed(2) : '0.00'})</span>
            </div>
          </div>
        )}

        {sessionHistory.length > 0 && (
          <div className="session-history">
            <div className="history-header">
              <h2>Session History</h2>
              <button onClick={clearHistory} className="clear-history-button">
                Clear History
              </button>
            </div>
            <div className="history-list">
              {sessionHistory.map(entry => (
                <div key={entry.id} className="history-item">
                  <div className="history-item-header">
                    <span className="history-timestamp">{entry.timestamp}</span>
                    <span className="history-duration">Duration: {formatTime(entry.duration)}</span>
                  </div>
                  <div className="history-item-content">
                    <p className="history-text">{entry.text}</p>
                    <div className="history-details">
                      <span 
                        className="history-sentiment"
                        style={{ color: getSentimentColor(entry.sentiment) }}
                      >
                        {entry.sentiment}
                      </span>
                      <span className="history-confidence">
                        Confidence: {(entry.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
