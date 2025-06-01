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
  return <div><h2>Speech-to-Text Emotion Analyzer</h2><p>Record or upload audio for analysis.</p></div>;
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
  return <div><h2>Survey Analyzer</h2><p>Submit survey data for analysis.</p></div>;
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
