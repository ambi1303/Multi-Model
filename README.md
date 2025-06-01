# Integrated Multi-Modal Emotion & Mental State Analyzer

This project is an integrated platform for analyzing emotion and mental state using multiple modalities:
- **Video Emotion Recognition**
- **Speech-to-Text Emotion Analyzer**
- **Chat Mental State Analyzer**
- **Employee Burnout Prediction Survey**

All features are unified in a single backend and frontend for a seamless user experience.

---

## Features

- **Video**: Analyze emotions from webcam or uploaded images.
- **Speech**: Record your voice and get transcription, sentiment, and confidence using speech-to-text and sentiment analysis.
- **Chat**: Analyze the mental state from chat messages.
- **Survey**: Predict employee burnout and stress level from a structured survey.

---

## Project Structure

```
.
├── integrated/
│   ├── backend/         # Unified FastAPI backend (API gateway)
│   └── frontend/        # Unified React frontend
├── stt/                 # Speech-to-text service (with its own venv)
├── survey/              # Survey service (with its own venv)
├── video/               # Video service (with its own venv)
├── chat/                # Chat service (with its own venv)
└── README.md            # (This file)
```

---

## Setup Instructions

### 1. Set Up Each Model Backend (REQUIRED)
Each model backend (video, stt, chat, survey) has its own Python virtual environment and requirements. You must set these up before running the integrated backend.

For each model (replace `<model_dir>` with `video/emp_face`, `stt/stt`, `chat/chat/mental_state_analyzer`, `survey/survey`):

```bash
cd <model_dir>
python -m venv venv
venv/Scripts/pip install -r requirements.txt  # On Windows
# or
venv/bin/pip install -r requirements.txt     # On Linux/Mac
```

Then, start each backend (see their respective README files for details).

### 2. Integrated Backend (API Gateway)

#### Prerequisites
- Python 3.8+
- [ffmpeg](https://ffmpeg.org/download.html) installed and available in your PATH (required for audio conversion)

#### Install dependencies
```bash
cd integrated/backend
pip install -r requirements.txt
```

#### Run the backend
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 9000
```

### 3. Frontend

#### Prerequisites
- Node.js 16+

#### Install dependencies
```bash
cd integrated/frontend
npm install
```

#### Run the frontend
```bash
npm start
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

---

## Usage

- Open the frontend in your browser.
- Use the tabs to switch between Video, Speech, Chat, and Survey analyzers.
- Each tab provides a modern, user-friendly interface for its respective modality.
- **Note:** The frontend now only displays user-friendly results (no raw JSON is shown).

---

## Troubleshooting
- **ModuleNotFoundError:** Make sure you have installed all requirements in the correct venv for each backend.
- **CORS errors:** Ensure all backends have permissive CORS settings for development.
- **Port conflicts:** Make sure each backend runs on its designated port and is not blocked by another process.
- **Frontend blank or errors:** Ensure React and MUI versions are compatible (React 18.x, MUI v5), and all dependencies are installed.

---

## Notes
- The backend uses the Vosk model for speech recognition. The model files are included in `stt/stt/vosk-model-small-en-us-0.15/`.
- For best results, ensure your microphone and webcam are working and accessible by your browser.
- All legacy services (in `stt/`, `survey/`, etc.) are now integrated and no longer need to be run separately, but their backends must be running for the integrated backend to work.

---

## License
MIT

---

## 🚀 Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned enhancements and future directions for this project.

---

## 📌 Next Steps

- **Implement API Gateway:** Set up a centralized API gateway to manage all service routes.
- **Integrate Message Queue:** Choose and configure a message queue system to handle asynchronous tasks.
- **Set Up Model Tracking:** Incorporate MLflow or DVC for model versioning and experiment tracking.
- **Enhance Security:** Add JWT authentication, rate limiting, and input validation mechanisms.
- **Establish Monitoring:** Implement logging and monitoring tools to track system performance and user interactions.
- **Improve Documentation:** Update the README.md with comprehensive information and create a ROADMAP.md for future plans.

By addressing these areas, your project will be more robust, scalable, and maintainable, facilitating easier collaboration and deployment. 