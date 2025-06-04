from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
from deepface import DeepFace
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS with more explicit settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Explicitly list allowed methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],  # Expose all headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

@app.post("/analyze-emotion")
async def analyze_emotion(file: UploadFile = File(...)):
    try:
        logger.info("Received image for emotion analysis")
        
        # Read and decode image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            logger.error("Failed to decode image")
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid image format"}
            )
        
        # Analyze emotion
        logger.info("Analyzing emotion using DeepFace")
        analysis = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)
        emotion = analysis[0]['dominant_emotion']
        
        logger.info(f"Detected emotion: {emotion}")
        return {"emotion": emotion}
        
    except Exception as e:
        logger.error(f"Error during emotion analysis: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error analyzing emotion: {str(e)}"}
        )

if __name__ == "__main__":
    logger.info("Starting FastAPI server")
    uvicorn.run(app, host="0.0.0.0", port=8000) 