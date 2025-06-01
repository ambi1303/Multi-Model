# Integrated Multi-Modal Emotion & Mental State Analyzer

This directory provides a unified interface (frontend and backend) to interact with all four emotion/mental state analysis models (video, speech, chat, survey) in this project. It acts as an API gateway and dashboard, forwarding requests to the existing model backends and aggregating results.

## Structure

```
integrated/
├── backend/      # FastAPI API gateway
│   ├── main.py
│   └── requirements.txt
└── frontend/     # React unified dashboard (to be implemented)
```

## Features
- Unified API endpoints for video, speech, chat, and survey analysis
- Aggregated analysis endpoint (`/analyze-all`)
- No changes to the original model code

## How It Works
- The backend exposes endpoints for each modality and forwards requests to the respective model backends (which must be running separately).
- The frontend (to be implemented) will provide a dashboard to interact with all modalities.

## Running the Backend

1. Install dependencies:
   ```bash
   cd integrated/backend
   pip install -r requirements.txt
   ```
2. Start the API gateway:
   ```bash
   uvicorn main:app --reload --port 9000
   ```
3. Make sure the original model backends are running on their respective ports (see `main.py` for URLs).

## Note
- This integration does **not** modify or import code from the original model directories. All communication is via HTTP APIs.
- You can extend the frontend to provide a unified user experience for all modalities. 