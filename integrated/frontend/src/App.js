import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import './App.css';

function VideoTab() {
  const webcamRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useWebcam, setUseWebcam] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionCounts, setEmotionCounts] = useState({});
  const [timeLeft, setTimeLeft] = useState(10);
  const [showReport, setShowReport] = useState(false);

  // Start 10-second analysis
  const startAnalysis = () => {
    setIsAnalyzing(true);
    setShowReport(false);
    setEmotionCounts({});
    setTimeLeft(10);
    setResult(null);
    setError(null);
  };

  // Capture and send frame
  const captureAndSend = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    try {
      const byteString = atob(imageSrc.split(',')[1]);
      const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const formData = new FormData();
      formData.append('file', blob, 'webcam.jpg');
      const response = await fetch('http://localhost:9000/analyze-video', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data && data.emotion) {
        setEmotionCounts(prev => ({
          ...prev,
          [data.emotion]: (prev[data.emotion] || 0) + 1
        }));
      }
    } catch (err) {
      // Optionally handle errors per frame
    }
  };

  // Interval for capturing frames
  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        captureAndSend();
      }, 1000);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [isAnalyzing]);

  // Timer for 10 seconds
  useEffect(() => {
    let timer;
    if (isAnalyzing && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isAnalyzing && timeLeft === 0) {
      setIsAnalyzing(false);
      setShowReport(true);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing, timeLeft]);

  // Get most frequent emotion
  const getMostFrequentEmotion = () => {
    if (Object.keys(emotionCounts).length === 0) return 'No emotions detected';
    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)[0][0];
  };

  // File upload fallback (single frame)
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setResult(null);
    setError(null);
    setUseWebcam(false);
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch('http://localhost:9000/analyze-video', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
      if (!response.ok) {
        setError(data.error || 'Error analyzing image');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Video Emotion Recognition</h2>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setUseWebcam(true)} style={{ marginRight: '1rem' }}>
          Use Webcam
        </button>
        <button onClick={() => setUseWebcam(false)}>
          Upload Image
        </button>
      </div>
      {useWebcam ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
            style={{ borderRadius: '10px', marginBottom: '1rem' }}
          />
          {!isAnalyzing && !showReport && (
            <button onClick={startAnalysis} disabled={loading}>
              Start 10s Analysis
            </button>
          )}
          {isAnalyzing && (
            <div style={{ marginTop: '1em', color: '#1976d2', fontWeight: 'bold' }}>
              Analyzing... Time left: {timeLeft}s
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleFileSubmit} style={{ marginTop: '1rem' }}>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <button type="submit" disabled={!selectedFile || loading} style={{ marginLeft: '1rem' }}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      )}
      <div style={{ marginTop: '2rem', width: '100%', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
        {error && (
          <div style={{ color: 'red', marginBottom: '1em' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        {showReport && (
          <div style={{
            background: '#f5f5f5',
            border: '2px solid #1976d2',
            borderRadius: '10px',
            padding: '2em',
            marginTop: '1em',
            textAlign: 'center',
            fontSize: '1.3em',
            fontWeight: 'bold',
            color: '#222',
          }}>
            <div style={{ color: '#1976d2', fontSize: '2em' }}>{getMostFrequentEmotion().toUpperCase()}</div>
            <div style={{ fontWeight: 'normal', fontSize: '1em', marginTop: '1em' }}>Most Frequent Emotion</div>
            <div style={{ fontWeight: 'normal', fontSize: '1em', marginTop: '1em' }}>Emotion Breakdown:</div>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5em', fontWeight: 'normal', fontSize: '1em' }}>
              {Object.entries(emotionCounts).map(([emotion, count]) => (
                <li key={emotion}>{emotion}: {count} times</li>
              ))}
            </ul>
            <button style={{ marginTop: '1.5em' }} onClick={startAnalysis}>Analyze Again</button>
          </div>
        )}
        {!useWebcam && result && (
          <div style={{
            background: '#f5f5f5',
            border: '2px solid #1976d2',
            borderRadius: '10px',
            padding: '2em',
            marginTop: '1em',
            textAlign: 'center',
            fontSize: '1.3em',
            fontWeight: 'bold',
            color: '#222',
          }}>
            {result.emotion ? (
              <>
                <span style={{ color: '#1976d2', fontSize: '2em' }}>{result.emotion.toUpperCase()}</span>
                <div style={{ fontWeight: 'normal', fontSize: '1em', marginTop: '1em' }}>Detected Emotion</div>
              </>
            ) : (
              <>
                <span style={{ color: 'orange' }}>No emotion detected or unexpected response.</span>
                <div style={{ fontWeight: 'normal', fontSize: '1em', marginTop: '1em' }}>Raw JSON:</div>
                <pre style={{ background: '#eee', color: '#333', padding: '1em', borderRadius: '6px', textAlign: 'left', fontSize: '0.9em', marginTop: '0.5em' }}>{JSON.stringify(result, null, 2)}</pre>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SpeechTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('sttSessionHistory');
    if (savedHistory) {
      setSessionHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sttSessionHistory', JSON.stringify(sessionHistory));
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
      const mediaRecorder = new window.MediaRecorder(stream, {
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
          const response = await fetch('http://localhost:9000/analyze-speech', {
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
    localStorage.removeItem('sttSessionHistory');
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
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h2>Speech-to-Text Emotion Analyzer</h2>
      <div className="stt-controls">
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={`stt-record-btn${isRecording ? ' recording' : ''}`}
          disabled={isProcessing}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        {isRecording && (
          <div className="stt-timer">
            Recording: {formatTime(recordingTime)}
          </div>
        )}
      </div>
      {isProcessing && (
        <div className="stt-processing">
          <div className="stt-spinner"></div>
          <p>Processing your speech...</p>
        </div>
      )}
      {error && (
        <div className="stt-error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}
      {result && (
        <div className="stt-result">
          <h3>Analysis Results</h3>
          <div className="stt-result-content">
            <div className="stt-result-section">
              <h4>Transcribed Text</h4>
              <p>{result.text}</p>
            </div>
            <div className="stt-result-section">
              <h4>Sentiment</h4>
              <p style={{ color: getSentimentColor(result.sentiment), fontWeight: 600 }}>
                {result.sentiment}
              </p>
            </div>
            <div className="stt-result-section">
              <h4>Confidence</h4>
              <div className="stt-confidence-bar">
                <div 
                  className="stt-confidence-fill"
                  style={{ width: `${(result.confidence * 100) || 0}%` }}
                ></div>
              </div>
              <p>{((result.confidence || 0) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
      {sessionHistory.length > 0 && (
        <div className="stt-history">
          <div className="stt-history-header">
            <h3>Session History</h3>
            <button onClick={clearHistory} className="stt-clear-history-btn">
              Clear History
            </button>
          </div>
          <div className="stt-history-list">
            {sessionHistory.map(entry => (
              <div key={entry.id} className="stt-history-item">
                <div className="stt-history-item-header">
                  <span className="stt-history-timestamp">{entry.timestamp}</span>
                  <span className="stt-history-duration">Duration: {formatTime(entry.duration)}</span>
                </div>
                <div className="stt-history-item-content">
                  <p className="stt-history-text">{entry.text}</p>
                  <div className="stt-history-details">
                    <span 
                      className="stt-history-sentiment"
                      style={{ color: getSentimentColor(entry.sentiment) }}
                    >
                      {entry.sentiment}
                    </span>
                    <span className="stt-history-confidence">
                      Confidence: {(entry.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChatTab() {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const payload = { text: message, person_id: 'user_api' };
      const response = await fetch('http://localhost:9000/analyze-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setResult(data);
      if (!response.ok) {
        setError(data.error || data.detail || 'Error analyzing message');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Chat Mental State Analyzer</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '2em' }}>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
          style={{ width: '100%', maxWidth: 500, fontSize: '1em', padding: '0.5em', borderRadius: '6px', border: '1px solid #ccc' }}
          placeholder="Enter your chat message here..."
          required
        />
        <br />
        <button type="submit" disabled={loading || !message.trim()} style={{ marginTop: '1em' }}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
      {error && (
        <div style={{ color: 'red', marginBottom: '1em' }}>
          <strong>Error:</strong> {typeof error === 'object' ? JSON.stringify(error) : error}
        </div>
      )}
      {result && (
        <div style={{
          background: '#f5f5f5',
          border: '2px solid #1976d2',
          borderRadius: '10px',
          padding: '2em',
          marginTop: '1em',
          textAlign: 'center',
          fontSize: '1.1em',
          color: '#222',
        }}>
          <div><strong>Primary Emotion:</strong> <span style={{ color: '#1976d2', fontSize: '1.2em' }}>{result.primary_emotion}</span></div>
          <div style={{ marginTop: '0.5em' }}><strong>Sentiment Score:</strong> {result.sentiment_score}</div>
          <div style={{ marginTop: '0.5em' }}><strong>Mental State:</strong> {result.mental_state}</div>
          <div style={{ marginTop: '1em', fontSize: '0.95em', color: '#555' }}>
            <strong>Raw JSON:</strong>
            <pre style={{ background: '#eee', color: '#333', padding: '1em', borderRadius: '6px', textAlign: 'left', fontSize: '0.95em', marginTop: '0.5em' }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function SurveyTab() {
  const [formData, setFormData] = useState({
    Designation: '',
    Resource_Allocation: '',
    Mental_Fatigue_Score: '',
    Company_Type: '',
    WFH_Setup_Available: '',
    Gender: '',
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);
    try {
      // Prepare payload for backend
      const payload = {
        Designation: parseFloat(formData.Designation),
        Resource_Allocation: parseFloat(formData.Resource_Allocation),
        Mental_Fatigue_Score: parseFloat(formData.Mental_Fatigue_Score),
        Company_Type: formData.Company_Type,
        WFH_Setup_Available: formData.WFH_Setup_Available,
        Gender: formData.Gender,
      };
      const response = await fetch('http://localhost:9000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Prediction failed');
      }
      setPrediction(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
      <h2>Employee Burnout Prediction Survey</h2>
      <form className="survey-form" onSubmit={handleSubmit}>
        <label>
          Designation (1-5):
          <input type="number" name="Designation" min="1" max="5" step="0.1" value={formData.Designation} onChange={handleInputChange} required />
        </label>
        <label>
          Resource Allocation (1-10):
          <input type="number" name="Resource_Allocation" min="1" max="10" step="0.1" value={formData.Resource_Allocation} onChange={handleInputChange} required />
        </label>
        <label>
          Mental Fatigue Score (1-10):
          <input type="number" name="Mental_Fatigue_Score" min="1" max="10" step="0.1" value={formData.Mental_Fatigue_Score} onChange={handleInputChange} required />
        </label>
        <label>
          Company Type:
          <select name="Company_Type" value={formData.Company_Type} onChange={handleInputChange} required>
            <option value="">Select</option>
            <option value="Service">Service</option>
            <option value="Product">Product</option>
          </select>
        </label>
        <label>
          WFH Setup Available:
          <select name="WFH_Setup_Available" value={formData.WFH_Setup_Available} onChange={handleInputChange} required>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>
        <label>
          Gender:
          <select name="Gender" value={formData.Gender} onChange={handleInputChange} required>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Predicting...' : 'Predict Burnout'}</button>
      </form>
      {error && <div className="survey-error">{error}</div>}
      {prediction && (
        <div className="survey-result">
          <h3>Prediction Result</h3>
          <div><strong>Burn Rate:</strong> {(prediction.burn_rate * 100).toFixed(2)}%</div>
          <div><strong>Stress Level:</strong> {prediction.stress_level}</div>
          <div><strong>Model Used:</strong> {prediction.model_used}</div>
          <div><strong>Prediction Time:</strong> {prediction.prediction_time}</div>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { name: 'Video', component: <VideoTab /> },
  { name: 'Speech', component: <SpeechTab /> },
  { name: 'Chat', component: <ChatTab /> },
  { name: 'Survey', component: <SurveyTab /> },
];

function App() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Integrated Multi-Modal Emotion & Mental State Analyzer</h1>
        <nav className="tab-nav">
          {TABS.map((tab, idx) => (
            <button
              key={tab.name}
              className={activeTab === idx ? 'active' : ''}
              onClick={() => setActiveTab(idx)}
            >
              {tab.name}
            </button>
          ))}
        </nav>
        <div className="tab-content">
          {TABS[activeTab].component}
        </div>
      </header>
    </div>
  );
}

export default App;
