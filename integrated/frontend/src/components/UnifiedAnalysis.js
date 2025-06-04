import React, { useState } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Tabs,
    Tab,
    IconButton,
} from '@mui/material';
import {
    analyzeVideo,
    analyzeChat,
    analyzeSurvey,
    analyzeSpeech,
    analyzeAll,
} from '../services/api';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MicIcon from '@mui/icons-material/Mic';
import VideocamIcon from '@mui/icons-material/Videocam';
import ChatIcon from '@mui/icons-material/Chat';
import AssessmentIcon from '@mui/icons-material/Assessment';

const UnifiedAnalysis = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);

    // Form states
    const [text, setText] = useState('');
    const [personId, setPersonId] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [surveyData, setSurveyData] = useState({});

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setError(null);
        setResults(null);
    };

    const handleFileChange = (event, type) => {
        const file = event.target.files[0];
        if (type === 'video') {
            setVideoFile(file);
        } else if (type === 'audio') {
            setAudioFile(file);
        }
    };

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        setResults(null);

        try {
            let response;
            switch (activeTab) {
                case 0: // Video
                    if (!videoFile) throw new Error('Please select a video file');
                    response = await analyzeVideo(videoFile);
                    break;
                case 1: // Chat
                    if (!text) throw new Error('Please enter some text');
                    response = await analyzeChat(text, personId);
                    break;
                case 2: // Survey
                    response = await analyzeSurvey(surveyData);
                    break;
                case 3: // Speech
                    if (!audioFile) throw new Error('Please select an audio file');
                    response = await analyzeSpeech(audioFile);
                    break;
                case 4: // Combined
                    response = await analyzeAll({
                        videoFile,
                        audioFile,
                        text,
                        personId,
                    });
                    break;
                default:
                    throw new Error('Invalid analysis type');
            }
            setResults(response);
        } catch (err) {
            setError(err.message || 'An error occurred during analysis');
        } finally {
            setLoading(false);
        }
    };

    const renderInputSection = () => {
        switch (activeTab) {
            case 0: // Video
                return (
                    <Box>
                        <input
                            accept="video/*"
                            style={{ display: 'none' }}
                            id="video-file"
                            type="file"
                            onChange={(e) => handleFileChange(e, 'video')}
                        />
                        <label htmlFor="video-file">
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={<VideocamIcon />}
                            >
                                Upload Video
                            </Button>
                        </label>
                        {videoFile && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Selected: {videoFile.name}
                            </Typography>
                        )}
                    </Box>
                );
            case 1: // Chat
                return (
                    <Box>
                        <TextField
                            fullWidth
                            label="Person ID (optional)"
                            value={personId}
                            onChange={(e) => setPersonId(e.target.value)}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Message"
                            multiline
                            rows={4}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            margin="normal"
                        />
                    </Box>
                );
            case 2: // Survey
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Survey Analysis
                        </Typography>
                        {/* Add survey form fields here */}
                    </Box>
                );
            case 3: // Speech
                return (
                    <Box>
                        <input
                            accept="audio/*"
                            style={{ display: 'none' }}
                            id="audio-file"
                            type="file"
                            onChange={(e) => handleFileChange(e, 'audio')}
                        />
                        <label htmlFor="audio-file">
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={<MicIcon />}
                            >
                                Upload Audio
                            </Button>
                        </label>
                        {audioFile && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Selected: {audioFile.name}
                            </Typography>
                        )}
                    </Box>
                );
            case 4: // Combined
                return (
                    <Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <input
                                    accept="video/*"
                                    style={{ display: 'none' }}
                                    id="combined-video"
                                    type="file"
                                    onChange={(e) => handleFileChange(e, 'video')}
                                />
                                <label htmlFor="combined-video">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<VideocamIcon />}
                                    >
                                        Upload Video
                                    </Button>
                                </label>
                            </Grid>
                            <Grid item xs={12}>
                                <input
                                    accept="audio/*"
                                    style={{ display: 'none' }}
                                    id="combined-audio"
                                    type="file"
                                    onChange={(e) => handleFileChange(e, 'audio')}
                                />
                                <label htmlFor="combined-audio">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<MicIcon />}
                                    >
                                        Upload Audio
                                    </Button>
                                </label>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Text (optional)"
                                    multiline
                                    rows={2}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Person ID (optional)"
                                    value={personId}
                                    onChange={(e) => setPersonId(e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Multimodal Analysis
                </Typography>

                <Paper sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab icon={<VideocamIcon />} label="Video" />
                        <Tab icon={<ChatIcon />} label="Chat" />
                        <Tab icon={<AssessmentIcon />} label="Survey" />
                        <Tab icon={<MicIcon />} label="Speech" />
                        <Tab icon={<CloudUploadIcon />} label="Combined" />
                    </Tabs>
                </Paper>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Input
                            </Typography>
                            {renderInputSection()}
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                    fullWidth
                                >
                                    Analyze
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Results
                            </Typography>
                            {loading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                                    <CircularProgress />
                                </Box>
                            )}
                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}
                            {results && (
                                <Card>
                                    <CardContent>
                                        <pre style={{ whiteSpace: 'pre-wrap' }}>
                                            {JSON.stringify(results, null, 2)}
                                        </pre>
                                    </CardContent>
                                </Card>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default UnifiedAnalysis; 