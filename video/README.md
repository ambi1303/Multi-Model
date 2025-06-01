# Video Emotion Recognition Application

A real-time facial emotion recognition application that analyzes emotions from video feed using DeepFace and provides a detailed analysis report. The application consists of a React frontend and a FastAPI backend.

## Features

- Real-time emotion detection from webcam feed
- 10-second analysis period with detailed emotion breakdown
- Beautiful and responsive UI with loading states
- Error handling and user feedback
- Most frequent emotion detection
- Emotion count statistics

## Prerequisites

- Python 3.11 (recommended)
- Node.js 14.0 or higher
- npm or yarn package manager

## Project Structure

```
video/
├── frontend/               # React frontend application
│   ├── public/
│   └── src/
│       ├── App.js         # Main application component
│       └── App.css        # Styling
└── emp_face/              # FastAPI backend
    └── api.py             # Backend API endpoints
```

## Installation

### Backend Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install required Python packages:
```bash
pip install fastapi uvicorn opencv-python deepface python-multipart
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Start the Backend

1. Activate the virtual environment (if not already activated):
```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Start the FastAPI server:
```bash
cd emp_face
uvicorn api:app --reload
```

The backend will be available at `http://localhost:8000`

### Start the Frontend

1. In a new terminal, navigate to the frontend directory:
```bash
cd frontend
```

2. Start the React development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Allow camera access when prompted
3. Click the "Start Analysis" button to begin emotion detection
4. The application will analyze your emotions for 10 seconds
5. After the analysis period, you'll see a detailed report showing:
   - Most frequent emotion detected
   - Breakdown of all emotions detected
6. Click "Analyze Again" to start a new analysis

## Technical Details

- **Frontend**: React.js with react-webcam for video capture
- **Backend**: FastAPI with DeepFace for emotion analysis
- **Emotion Detection**: Uses DeepFace's emotion analysis model
- **API Communication**: Axios for HTTP requests
- **Styling**: Custom CSS with modern design principles

## Troubleshooting

1. **Camera Access Issues**:
   - Ensure your browser has permission to access the camera
   - Check if another application is using the camera

2. **Backend Connection Issues**:
   - Verify the FastAPI server is running
   - Check if port 8000 is available
   - Ensure all required Python packages are installed

3. **Frontend Issues**:
   - Clear browser cache
   - Ensure all npm packages are installed
   - Check browser console for errors

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details. 