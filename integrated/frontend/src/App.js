import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import './App.css';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box, Button, TextField, Select, MenuItem, InputLabel, FormControl, Alert, CircularProgress, Paper } from '@mui/material';
import { Send, Replay, Delete, UploadFile, PhotoCamera, Mic, Stop, History } from '@mui/icons-material';

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
  const [webcamAvailable, setWebcamAvailable] = useState(true);

  // Start 10-second analysis
  const startAnalysis = () => {
    setIsAnalyzing(true);
    setShowReport(false);
    setEmotionCounts({});
    setTimeLeft(10);
    setResult(null);
    setError(null);
  };

  // Add webcam error handling
  const handleUserMediaError = (err) => {
    setWebcamAvailable(false);
    setError('Webcam not available or permission denied.');
  };

  // Capture and send frame
  const captureAndSend = async () => {
    if (!webcamRef.current || !webcamAvailable) return;
    let imageSrc;
    try {
      imageSrc = webcamRef.current.getScreenshot();
    } catch (e) {
      setError('Unable to capture webcam image.');
      return;
    }
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
      setError('Error analyzing webcam image.');
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
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Video Emotion Recognition</Typography>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button
          variant={useWebcam ? 'contained' : 'outlined'}
          startIcon={<PhotoCamera />}
          onClick={() => setUseWebcam(true)}
        >
          Use Webcam
        </Button>
        <Button
          variant={!useWebcam ? 'contained' : 'outlined'}
          startIcon={<UploadFile />}
          onClick={() => setUseWebcam(false)}
        >
          Upload Image
        </Button>
      </Box>
      {useWebcam ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {webcamAvailable ? (
            (() => {
              try {
                return (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width={320}
                    height={240}
                    style={{ borderRadius: '10px', marginBottom: '1rem' }}
                    onUserMediaError={handleUserMediaError}
                  />
                );
              } catch (err) {
                return <Alert severity="error" sx={{ mb: 2 }}>Webcam component failed to render: {err.message}</Alert>;
              }
            })()
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>Webcam not available or permission denied.</Alert>
          )}
          {!isAnalyzing && !showReport && webcamAvailable && (
            <Button
              variant="contained"
              color="primary"
              onClick={startAnalysis}
              disabled={loading}
              startIcon={<Replay />}
              sx={{ mt: 2 }}
            >
              Start 10s Analysis
            </Button>
          )}
          {isAnalyzing && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={24} color="primary" />
              <Typography color="primary" fontWeight="bold">
                Analyzing... Time left: {timeLeft}s
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box component="form" onSubmit={handleFileSubmit} sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFile />}
          >
            Choose Image
            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!selectedFile || loading}
            startIcon={<Replay />}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Analyze'}
          </Button>
          {selectedFile && (
            <Typography variant="body2" sx={{ ml: 1 }}>{selectedFile.name}</Typography>
          )}
        </Box>
      )}
      <Box sx={{ mt: 3, width: '100%', maxWidth: 500, mx: 'auto' }}>
        {typeof error === 'object' ? JSON.stringify(error) : error && (
          <Alert severity="error" sx={{ mb: 2 }}>{typeof error === 'object' ? JSON.stringify(error) : error}</Alert>
        )}
        {showReport && (
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', border: '2px solid', borderColor: 'primary.main', borderRadius: 2 }}>
            <Typography variant="h4" color="primary" sx={{ mb: 1 }}>{getMostFrequentEmotion().toUpperCase()}</Typography>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Most Frequent Emotion</Typography>
            <Typography variant="subtitle2">Emotion Breakdown:</Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, mt: 1, mb: 2 }}>
              {Object.entries(emotionCounts).map(([emotion, count]) => (
                <li key={emotion}><b>{emotion}:</b> {count} times</li>
              ))}
            </Box>
            <Button variant="outlined" onClick={startAnalysis} startIcon={<Replay />}>Analyze Again</Button>
          </Paper>
        )}
        {!useWebcam && result && (
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', border: '2px solid', borderColor: 'primary.main', borderRadius: 2 }}>
            {result.emotion ? (
              <>
                <Typography variant="h4" color="primary">{result.emotion.toUpperCase()}</Typography>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>Detected Emotion</Typography>
              </>
            ) : (
              <>
                <Typography color="warning.main">No emotion detected or unexpected response.</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Raw JSON:</Typography>
                <Box component="pre" sx={{ background: '#eee', color: '#333', p: 2, borderRadius: 1, textAlign: 'left', fontSize: '0.95em', mt: 1 }}>{typeof result === 'object' ? JSON.stringify(result) : result}</Box>
              </>
            )}
          </Paper>
        )}
      </Box>
    </Box>
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
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Speech-to-Text Emotion Analyzer</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          variant={isRecording ? 'contained' : 'outlined'}
          color={isRecording ? 'error' : 'primary'}
          startIcon={isRecording ? <Stop /> : <Mic />}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        {isRecording && (
          <Typography color="primary" fontWeight="bold">
            Recording: {formatTime(recordingTime)}
          </Typography>
        )}
      </Box>
      {isProcessing && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={24} color="primary" />
          <Typography>Processing your speech...</Typography>
        </Box>
      )}
      {typeof error === 'object' ? JSON.stringify(error) : error && (
        <Alert severity="error" sx={{ mb: 2 }}>{typeof error === 'object' ? JSON.stringify(error) : error}</Alert>
      )}
      {result && (
        <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>Analysis Results</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Transcribed Text</Typography>
            <Typography>{result.text}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Sentiment</Typography>
            <Typography fontWeight={600} sx={{ color: getSentimentColor(result.sentiment) }}>{result.sentiment}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Confidence</Typography>
            <Box sx={{ width: '100%', bgcolor: '#e0e0e0', borderRadius: 1, height: 10, mb: 1 }}>
              <Box sx={{ width: `${(result.confidence * 100) || 0}%`, bgcolor: 'primary.main', height: '100%', borderRadius: 1 }} />
            </Box>
            <Typography>{((result.confidence || 0) * 100).toFixed(1)}%</Typography>
          </Box>
        </Paper>
      )}
      {sessionHistory.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">Session History</Typography>
            <Button onClick={clearHistory} color="error" startIcon={<Delete />}>Clear History</Button>
          </Box>
          <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
            {sessionHistory.map(entry => (
              <Paper key={entry.id} sx={{ mb: 2, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption">{entry.timestamp}</Typography>
                  <Typography variant="caption">Duration: {formatTime(entry.duration)}</Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>{entry.text}</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: getSentimentColor(entry.sentiment) }}>{entry.sentiment}</Typography>
                  <Typography variant="caption">Confidence: {(entry.confidence * 100).toFixed(1)}%</Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
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
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Chat Mental State Analyzer</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
        <TextField
          label="Chat Message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          placeholder="Enter your chat message here..."
          required
          sx={{ mb: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={<Send />}
          disabled={loading || !message.trim()}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Analyze'}
        </Button>
      </Box>
      {typeof error === 'object' ? JSON.stringify(error) : error && (
        <Alert severity="error" sx={{ mb: 2 }}>{typeof error === 'object' ? JSON.stringify(error) : error}</Alert>
      )}
      {result && (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center', border: '2px solid', borderColor: 'primary.main', borderRadius: 2, maxWidth: 400, mx: 'auto', overflowWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
          <Typography variant="h6" color="primary" sx={{ mb: 1 }}>Primary Emotion: {result.primary_emotion}</Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Sentiment Score: {result.sentiment_score}</Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Mental State: {result.mental_state}</Typography>
        </Paper>
      )}
    </Box>
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
    <Box sx={{ maxWidth: 500, mx: 'auto', p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Employee Burnout Prediction Survey</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#f7fafd', borderRadius: 2, p: 3, boxShadow: 1 }}>
        <TextField
          label="Designation (1-5)"
          type="number"
          name="Designation"
          inputProps={{ min: 1, max: 5, step: 0.1 }}
          value={formData.Designation}
          onChange={handleInputChange}
          required
        />
        <TextField
          label="Resource Allocation (1-10)"
          type="number"
          name="Resource_Allocation"
          inputProps={{ min: 1, max: 10, step: 0.1 }}
          value={formData.Resource_Allocation}
          onChange={handleInputChange}
          required
        />
        <TextField
          label="Mental Fatigue Score (1-10)"
          type="number"
          name="Mental_Fatigue_Score"
          inputProps={{ min: 1, max: 10, step: 0.1 }}
          value={formData.Mental_Fatigue_Score}
          onChange={handleInputChange}
          required
        />
        <FormControl required>
          <InputLabel>Company Type</InputLabel>
          <Select
            name="Company_Type"
            value={formData.Company_Type}
            label="Company Type"
            onChange={handleInputChange}
          >
            <MenuItem value=""><em>Select</em></MenuItem>
            <MenuItem value="Service">Service</MenuItem>
            <MenuItem value="Product">Product</MenuItem>
          </Select>
        </FormControl>
        <FormControl required>
          <InputLabel>WFH Setup Available</InputLabel>
          <Select
            name="WFH_Setup_Available"
            value={formData.WFH_Setup_Available}
            label="WFH Setup Available"
            onChange={handleInputChange}
          >
            <MenuItem value=""><em>Select</em></MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </FormControl>
        <FormControl required>
          <InputLabel>Gender</InputLabel>
          <Select
            name="Gender"
            value={formData.Gender}
            label="Gender"
            onChange={handleInputChange}
          >
            <MenuItem value=""><em>Select</em></MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
          </Select>
        </FormControl>
        <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ mt: 1 }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Predict Burnout'}
        </Button>
      </Box>
      {typeof error === 'object' ? JSON.stringify(error) : error && <Alert severity="error" sx={{ mt: 2 }}>{typeof error === 'object' ? JSON.stringify(error) : error}</Alert>}
      {prediction && (
        <Paper elevation={2} sx={{ mt: 3, p: 2, border: '2px solid', borderColor: 'primary.main', borderRadius: 2, bgcolor: '#f0f7ff' }}>
          <Typography variant="h6" color="primary" sx={{ mb: 1 }}>Prediction Result</Typography>
          <Typography><b>Burn Rate:</b> {(prediction.burn_rate * 100).toFixed(2)}%</Typography>
          <Typography><b>Stress Level:</b> {prediction.stress_level}</Typography>
          <Typography><b>Model Used:</b> {prediction.model_used}</Typography>
          <Typography><b>Prediction Time:</b> {prediction.prediction_time}</Typography>
        </Paper>
      )}
    </Box>
  );
}

const TABS = [
  { name: 'Video', component: VideoTab },
  { name: 'Speech', component: SpeechTab },
  { name: 'Chat', component: ChatTab },
  { name: 'Survey', component: SurveyTab },
];

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const ActiveTabComponent = TABS[activeTab].component;

  return (
    <Box className="App" sx={{ bgcolor: '#f4f7fa', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Integrated Multi-Modal Emotion & Mental State Analyzer
          </Typography>
        </Toolbar>
      </AppBar>
      <Paper elevation={3} sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Video" icon={<PhotoCamera />} iconPosition="start" />
          <Tab label="Speech" icon={<Mic />} iconPosition="start" />
          <Tab label="Chat" icon={<Send />} iconPosition="start" />
          <Tab label="Survey" icon={<History />} iconPosition="start" />
        </Tabs>
        <Box className="tab-content"><ActiveTabComponent /></Box>
      </Paper>
    </Box>
  );
}

export default App;
