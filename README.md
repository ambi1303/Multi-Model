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
│   ├── backend/         # Unified FastAPI backend
│   └── frontend/        # Unified React frontend
├── stt/                 # (Legacy) Speech-to-text service
├── survey/              # (Legacy) Survey service
├── video/               # (Legacy) Video service
├── chat/                # (Legacy) Chat service
└── README.md            # (This file)
```

---

## Setup Instructions

### 1. Backend

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

### 2. Frontend

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

---

## Notes
- The backend uses the Vosk model for speech recognition. The model files are included in `integrated/backend/vosk-model-small-en-us-0.15/`.
- For best results, ensure your microphone and webcam are working and accessible by your browser.
- All legacy services (in `stt/`, `survey/`, etc.) are now integrated and no longer need to be run separately.

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