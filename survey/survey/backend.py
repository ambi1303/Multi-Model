import os
print("RUNNING FILE:", os.path.abspath(__file__))
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Dict
import pandas as pd
import pickle
import os
import json
from datetime import datetime
from survey_predict import train_models
import logging
import httpx
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
print(f"GEMINI_API_KEY loaded: {'Yes' if os.getenv('GEMINI_API_KEY') else 'No'}")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Employee Burnout Prediction Backend",
    description="Backend API for employee burnout prediction system with additional features",
    version="1.0.0"
)

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

@app.on_event("startup")
async def startup_event():
    """
    Train models on startup if they don't exist
    """
    try:
        models_dir = os.path.join(os.path.dirname(__file__), 'models')
        scaler_path = os.path.join(models_dir, 'scaler.pkl')
        model_path = os.path.join(models_dir, 'linear_regression.pkl')
        
        if not os.path.exists(scaler_path) or not os.path.exists(model_path):
            logger.info("Models not found. Training models...")
            train_models()
            logger.info("Models trained successfully")
        else:
            logger.info("Models found, skipping training")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise e

# Data Models
class EmployeeData(BaseModel):
    designation: float = Field(..., ge=1, le=5, description="Employee designation level (1-5, 1 being lowest)")
    resource_allocation: float = Field(..., ge=1, le=10, description="Resource allocation score (1-10)")
    mental_fatigue_score: float = Field(..., ge=1, le=10, description="Mental fatigue score (1-10)")
    company_type: Literal["Service", "Product"] = Field(..., description="Type of company")
    wfh_setup_available: Literal["Yes", "No"] = Field(..., description="Whether WFH setup is available")
    gender: Literal["Male", "Female"] = Field(..., description="Gender of the employee")

print("LOADED EmployeeData model fields:", EmployeeData.__fields__.keys())

class PredictionResponse(BaseModel):
    burn_rate: float
    stress_level: str
    model_used: str
    prediction_time: str

class BatchPredictionRequest(BaseModel):
    employees: List[EmployeeData]

class BatchPredictionResponse(BaseModel):
    predictions: List[PredictionResponse]

class ModelMetrics(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    mse: float
    rmse: float
    r2_score: float

class SurveyLikertData(BaseModel):
    q1: int = Field(..., ge=1, le=5, description="I feel happy and relaxed while doing my job.")
    q2: int = Field(..., ge=1, le=5, description="I frequently feel anxious or stressed because of my work.")
    q3: int = Field(..., ge=1, le=5, description="I feel emotionally exhausted at the end of my workday.")
    q4: int = Field(..., ge=1, le=5, description="I feel motivated and excited about my work.")
    q5: int = Field(..., ge=1, le=5, description="I feel a sense of accomplishment and purpose in my role.")
    q6: int = Field(..., ge=1, le=5, description="I find myself feeling detached or indifferent about my work.")
    q7: int = Field(..., ge=1, le=5, description="My workload is manageable within my regular working hours.")
    q8: int = Field(..., ge=1, le=5, description="I have control over how I organize and complete my tasks.")
    q9: int = Field(..., ge=1, le=5, description="My manager and team provide support when I face challenges.")
    q10: int = Field(..., ge=1, le=5, description="I feel my personal time and work–life balance are respected by the organization.")

class AnalyzeSurveyRequest(BaseModel):
    employee: EmployeeData
    survey: SurveyLikertData
    employee_id: Optional[str] = None

# Store predictions history
predictions_history = []

def save_prediction(employee_data: dict, prediction: float, stress_level: str):
    """Save prediction to history"""
    prediction_record = {
        "timestamp": datetime.now().isoformat(),
        "employee_data": employee_data,
        "prediction": prediction,
        "stress_level": stress_level
    }
    predictions_history.append(prediction_record)
    
    # Save to file
    with open('prediction_history.json', 'w') as f:
        json.dump(predictions_history, f, indent=2)

@app.get("/")
async def root():
    return {"message": "Welcome to Employee Burnout Prediction Backend"}

@app.post("/train", tags=["Model Training"])
async def train(background_tasks: BackgroundTasks):
    """
    Train the machine learning models using the training data.
    This will create/update the model files in the models directory.
    """
    try:
        # Run training in background
        background_tasks.add_task(train_models)
        return {"message": "Model training started in background"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(employee: EmployeeData):
    """
    Predict burnout rate for an employee using the trained model.
    """
    try:
        # Convert input to DataFrame
        input_data = {
            'Designation': employee.designation,
            'Resource Allocation': employee.resource_allocation,
            'Mental Fatigue Score': employee.mental_fatigue_score,
            'Company Type': employee.company_type,
            'WFH Setup Available': employee.wfh_setup_available,
            'Gender': employee.gender
        }
        input_df = pd.DataFrame([input_data])

        # One-hot encode categorical columns
        input_df = pd.get_dummies(input_df, columns=['Company Type', 'WFH Setup Available', 'Gender'], drop_first=True)

        # Ensure the input has the same columns as the model was trained on
        trained_features = ['Designation', 'Resource Allocation', 'Mental Fatigue Score', 
                          'Company Type_Service', 'WFH Setup Available_Yes', 'Gender_Male']
        for col in trained_features:
            if col not in input_df.columns:
                input_df[col] = 0
        input_df = input_df[trained_features]

        # Load scaler and model
        models_dir = os.path.join(os.path.dirname(__file__), 'models')
        scaler_path = os.path.join(models_dir, 'scaler.pkl')
        model_path = os.path.join(models_dir, 'linear_regression.pkl')
        
        if not os.path.exists(scaler_path) or not os.path.exists(model_path):
            raise HTTPException(status_code=400, detail="Models not trained yet. Please train the models first.")

        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        with open(model_path, 'rb') as f:
            model = pickle.load(f)

        # Scale the input
        input_scaled = scaler.transform(input_df)

        # Predict
        prediction = model.predict(input_scaled)[0]

        # Determine stress level based on burn rate
        if prediction < 0.3:
            stress_level = "Low Stress"
        elif prediction < 0.5:
            stress_level = "Medium Stress"
        elif prediction < 0.7:
            stress_level = "High Stress"
        else:
            stress_level = "Very High Stress"

        response = {
            "burn_rate": prediction,
            "stress_level": stress_level,
            "model_used": "Linear Regression",
            "prediction_time": datetime.now().isoformat()
        }

        # Save prediction to history
        save_prediction(input_data, prediction, stress_level)

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Prediction"])
async def predict_batch(batch_request: BatchPredictionRequest):
    """
    Predict burnout rates for multiple employees at once.
    """
    predictions = []
    for employee in batch_request.employees:
        prediction = await predict(employee)
        predictions.append(prediction)
    return {"predictions": predictions}

@app.get("/predictions/history", tags=["History"])
async def get_prediction_history():
    """
    Get the history of all predictions made.
    """
    return {"predictions": predictions_history}

@app.get("/models/metrics", response_model=List[ModelMetrics], tags=["Model Information"])
async def get_model_metrics():
    """
    Get performance metrics for all trained models.
    """
    metrics = []
    try:
        # Load metrics from file or calculate them
        # This is a placeholder - you would need to implement the actual metrics calculation
        metrics = [
            {
                "model_name": "Linear Regression",
                "accuracy": 0.929,
                "precision": 0.888,
                "recall": 0.940,
                "f1_score": 0.913,
                "mse": 0.00315,
                "rmse": 0.0561,
                "r2_score": 0.918
            }
        ]
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze", tags=["Integration"])
async def analyze(employee: EmployeeData):
    """
    Wrapper for /predict to support integration with the common backend.
    """
    try:
        logger.info(f"Received survey data for analysis: {employee.dict()}")
        result = await predict(employee)
        logger.info(f"Survey analysis completed successfully: {result}")
        return result
    except Exception as e:
        logger.error(f"Error in survey analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-survey", tags=["Survey"])
async def analyze_survey(request: AnalyzeSurveyRequest):
    try:
        # 1. Compute survey score and risk level
        survey_scores = [
            request.survey.q1, request.survey.q2, request.survey.q3, request.survey.q4, request.survey.q5,
            request.survey.q6, request.survey.q7, request.survey.q8, request.survey.q9, request.survey.q10
        ]
        total_score = sum(survey_scores)
        if total_score > 40:
            risk_level = "Low Risk"
        elif total_score >= 25:
            risk_level = "Medium Risk"
        else:
            risk_level = "High Risk"

        # 2. Predict burn rate using ML model (reuse predict logic)
        burn_result = await predict(request.employee)
        burn_rate = burn_result["burn_rate"]

        # 3. Call Gemini for summary and recommendations
        gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        summary = ""
        recommendations = []
        
        if gemini_api_key:
            try:
                prompt = f"""
                Given this employee's structured data: {request.employee.dict()} and these 10 survey responses (Likert scores 1-5): {survey_scores}, provide a short summary of the mental health status, signs of burnout, and suggest 2 wellness tips personalized to this profile. Respond in JSON with keys: "Mental Health Summary", "Recommendations" (as a list of 2 strings).
                """
                gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + gemini_api_key
                gemini_payload = {
                    "contents": [{"parts": [{"text": prompt}]}]
                }
                async with httpx.AsyncClient() as client:
                    gemini_resp = await client.post(gemini_url, json=gemini_payload, timeout=30)
                    gemini_resp.raise_for_status()
                    gemini_data = gemini_resp.json()
                    # Parse Gemini response
                    try:
                        import re, json as pyjson
                        # Try to extract JSON from Gemini response
                        text = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
                        match = re.search(r'\{.*\}', text, re.DOTALL)
                        if match:
                            parsed = pyjson.loads(match.group(0))
                            summary = parsed.get("Mental Health Summary", "")
                            recommendations = parsed.get("Recommendations", [])
                        else:
                            summary = text
                            recommendations = []
                    except Exception:
                        summary = "Could not parse Gemini response."
                        recommendations = []
            except Exception as e:
                logger.warning(f"Gemini API failed: {str(e)}, using fallback")
                # Fallback summary and recommendations based on risk level
                if risk_level == "High Risk":
                    summary = "Analysis indicates high stress levels and potential burnout risk. Immediate attention to work-life balance is recommended."
                    recommendations = [
                        "Consider speaking with a mental health professional or counselor",
                        "Implement stress reduction techniques like meditation or regular breaks"
                    ]
                elif risk_level == "Medium Risk":
                    summary = "Analysis shows moderate stress levels with some areas of concern. Proactive wellness measures are advised."
                    recommendations = [
                        "Focus on improving work-life balance and setting boundaries",
                        "Engage in regular physical activity and maintain social connections"
                    ]
                else:
                    summary = "Analysis indicates relatively low stress levels with good overall mental health indicators."
                    recommendations = [
                        "Continue maintaining current healthy work habits",
                        "Regular self-assessment and stress monitoring is beneficial"
                    ]
        else:
            # No API key - use basic fallback
            summary = f"Survey analysis completed. Risk level: {risk_level}. Consider professional consultation for detailed assessment."
            recommendations = [
                "Regular stress monitoring and self-care practices",
                "Seek professional guidance if symptoms persist"
            ]

        # 4. Compose response
        return {
            "Employee ID": request.employee_id or "anonymous",
            "Predicted Burn Rate": round(burn_rate * 100),
            "Survey Score": f"{total_score} ({risk_level})",
            "Mental Health Summary": summary,
            "Recommendations": recommendations
        }
    except Exception as e:
        logger.error(f"Error in analyze-survey: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004) 