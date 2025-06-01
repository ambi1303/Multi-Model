import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const [emotion, setEmotion] = useState('Ready to analyze');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionCounts, setEmotionCounts] = useState({});
  const [timeLeft, setTimeLeft] = useState(10);
  const [showReport, setShowReport] = useState(false);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setShowReport(false);
    setEmotionCounts({});
    setTimeLeft(10);
    setEmotion('Analyzing...');
  };

  const capture = React.useCallback(
    () => {
      if (webcamRef.current && isAnalyzing) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          sendImageToBackend(imageSrc);
        }
      }
    },
    [webcamRef, isAnalyzing]
  );

  const sendImageToBackend = async (imageSrc) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const byteCharacters = atob(imageSrc.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', blob, 'webcam.jpg');

      const response = await axios.post('http://localhost:8000/analyze-emotion', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const detectedEmotion = response.data.emotion;
      setEmotion(detectedEmotion);
      
      // Update emotion counts
      setEmotionCounts(prev => ({
        ...prev,
        [detectedEmotion]: (prev[detectedEmotion] || 0) + 1
      }));
    } catch (error) {
      console.error('Error sending image to backend:', error);
      setError('Error detecting emotion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        capture();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [capture, isAnalyzing]);

  useEffect(() => {
    let timer;
    if (isAnalyzing && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsAnalyzing(false);
      setShowReport(true);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing, timeLeft]);

  const getMostFrequentEmotion = () => {
    if (Object.keys(emotionCounts).length === 0) return 'No emotions detected';
    
    return Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Facial Emotion Recognition</h1>
        <div className="webcam-container">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={640}
            height={480}
            style={{ borderRadius: '10px' }}
          />
          {isLoading && <div className="loading-overlay">Analyzing...</div>}
        </div>
        
        {!showReport ? (
          <div className="emotion-display">
            <h2>Current Emotion: {emotion}</h2>
            {isAnalyzing && <h3>Time Remaining: {timeLeft} seconds</h3>}
            {error && <p className="error-message">{error}</p>}
            {!isAnalyzing && (
              <button 
                className="analyze-button"
                onClick={startAnalysis}
              >
                Start Analysis
              </button>
            )}
          </div>
        ) : (
          <div className="report-display">
            <h2>Analysis Report</h2>
            <h3>Most Frequent Emotion: {getMostFrequentEmotion()}</h3>
            <div className="emotion-breakdown">
              <h4>Emotion Breakdown:</h4>
              {Object.entries(emotionCounts).map(([emotion, count]) => (
                <p key={emotion}>
                  {emotion}: {count} times
                </p>
              ))}
            </div>
            <button 
              className="analyze-button"
              onClick={startAnalysis}
            >
              Analyze Again
            </button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
