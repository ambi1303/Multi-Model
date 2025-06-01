# Speech-to-Text Emotion Analyzer

A real-time speech-to-text application that analyzes the emotional sentiment of spoken words. Built with React, FastAPI, and Vosk for accurate speech recognition.

## Features

- 🎤 Real-time audio recording
- 📝 Accurate speech-to-text conversion using Vosk
- 😊 Sentiment analysis of transcribed text
- 📊 Confidence scoring
- 🎨 Modern, responsive UI
- ⚡ Fast and efficient processing

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- ffmpeg (for audio processing)
- A modern web browser with microphone access

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stt
```

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd api

# Create and activate a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download Vosk model (if not already included)
# The model should be in the vosk-model-small-en-us-0.15 directory
```

### 3. Frontend Setup

```bash
# Navigate to the frontend directory
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm start
```

## Usage

1. Start the backend server:
   ```bash
   cd api
   python main.py
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

4. Click "Start Recording" and speak into your microphone

5. Click "Stop Recording" to process your speech

6. View the transcription and sentiment analysis results

## Technical Details

### Backend Technologies
- FastAPI: High-performance web framework
- Vosk: Offline speech recognition toolkit
- TextBlob: Natural language processing for sentiment analysis
- ffmpeg: Audio processing and conversion

### Frontend Technologies
- React: User interface library
- Modern CSS: Responsive design and animations
- Web Audio API: Audio recording and processing

## Troubleshooting

### Common Issues

1. **Microphone Access**
   - Ensure your browser has permission to access the microphone
   - Check if your microphone is properly connected and selected

2. **Audio Processing**
   - Verify ffmpeg is installed and in your system PATH
   - Check the console for any error messages

3. **Backend Connection**
   - Ensure the backend server is running on port 8000
   - Check for CORS issues in the browser console

### Getting Help

If you encounter any issues:
1. Check the console for error messages
2. Verify all dependencies are installed correctly
3. Ensure ffmpeg is properly installed
4. Check the backend logs for detailed error information

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

