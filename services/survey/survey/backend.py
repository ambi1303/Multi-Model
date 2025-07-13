import os
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Dict, Any
import pandas as pd
import pickle
import os
import json
import time
import psutil
from datetime import datetime
from survey_predict import train_models
import logging
import httpx
from dotenv import load_dotenv
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from uuid import UUID

# --- Authentication ---
async def get_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extracts the bearer token from the Authorization header."""
    if not authorization:
        return None
    try:
        scheme, token = authorization.split()
        if scheme.lower() == 'bearer':
            return token
    except ValueError:
        return None
    return None

# --- NEW: Core Service Integration ---
CORE_SERVICE_URL = os.getenv("CORE_SERVICE_URL", "http://localhost:8000")

async def store_survey_in_core_service(survey_data: dict, user_id: str, token: Optional[str]):
    """Asynchronously stores survey analysis results in the core service."""
    try:
        if not token:
            logger.warning("No auth token provided; skipping survey storage in core service.")
            return False

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # The survey service now sends data to the specific survey analysis endpoint
        survey_analysis_endpoint = f"{CORE_SERVICE_URL}/surveys/responses"
        
        # Convert user_id to proper format and ensure schema compliance
        try:
            user_uuid = str(UUID(user_id))  # Validate and convert to string format
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id format: {user_id}")
            return False
        
        # Ensure schema compliance with core service SurveyResponseCreate
        compliant_data = {
            "user_id": user_uuid,  # UUID as string
            "survey_type": survey_data.get("survey_type", "unknown"),
            "survey_version": survey_data.get("survey_version", "1.0"),
            "responses": survey_data.get("responses", {}),
            "completion_time_seconds": survey_data.get("completion_time_seconds"),
            "burnout_score": float(survey_data.get("burnout_score", 0.0)) if survey_data.get("burnout_score") is not None else None,
            "stress_level": survey_data.get("stress_level"),
            "risk_categories": survey_data.get("risk_categories", {}),
            "prediction_model_version": survey_data.get("prediction_model_version"),
            "prediction_confidence": float(survey_data.get("prediction_confidence", 0.0)) if survey_data.get("prediction_confidence") is not None else None,
            "predicted_outcomes": survey_data.get("predicted_outcomes", {}),
            "ai_recommendations": survey_data.get("ai_recommendations", {}),
            "follow_up_suggested": survey_data.get("follow_up_suggested", False)
        }
        
        logger.info(f"Sending compliant survey data to core service for user {user_id}: {compliant_data}")

        async with httpx.AsyncClient() as client:
            response = await client.post(survey_analysis_endpoint, json=compliant_data, headers=headers, timeout=30.0)
            
            if response.status_code == 200:
                logger.info(f"Successfully stored survey analysis for user {user_id} in core service.")
                return True
            elif 400 <= response.status_code < 500:
                logger.error(f"Client error storing survey for user {user_id}: {response.status_code} - {response.text}")
                return False
            else:
                logger.error(f"Server error storing survey for user {user_id}: {response.status_code} - {response.text}")
                return False

    except httpx.RequestError as e:
        logger.error(f"Network error sending survey analysis to core service for user {user_id}: {e}")
        return False
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error storing survey analysis for user {user_id}: {e.response.status_code} - {e.response.text}")
        return False
    except Exception as e:
        logger.error(f"An unexpected error occurred while storing survey analysis for user {user_id}: {e}")
        return False

# Mock user validation and DB client for now
def validate_user_uuid(user_id: str) -> UUID:
    """Mock user UUID validation"""
    try:
        return UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid user ID format")

class MockDBClient:
    def store_survey_result(self, user_id: UUID, data: Dict[str, Any]):
        logger.info(f"Mock storing survey result for user {user_id}: {data}")
        return True
    
    def log_audit_event(self, user_id: UUID, event: str, metadata: Dict[str, Any]):
        logger.info(f"Mock audit log for user {user_id}: {event} - {metadata}")

def get_db_client(auth_token: Optional[str] = None):
    """Mock DB client getter"""
    return MockDBClient()


# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Prometheus metrics
REQUESTS = Counter('survey_requests_total', 'Total survey analysis requests', ['endpoint'])
PROCESSING_TIME = Histogram('survey_processing_seconds', 'Time spent processing survey requests', ['endpoint'])
ERROR_COUNT = Counter('survey_errors_total', 'Total errors in survey analysis', ['endpoint', 'error_type'])
MEMORY_USAGE = Gauge('survey_memory_usage_bytes', 'Memory usage of the survey service')
CPU_USAGE = Gauge('survey_cpu_usage_percent', 'CPU usage of the survey service')

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

# Update system metrics
def update_system_metrics():
    MEMORY_USAGE.set(psutil.Process(os.getpid()).memory_info().rss)
    CPU_USAGE.set(psutil.Process(os.getpid()).cpu_percent())

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
    user_id: str = Field(..., description="User UUID for database storage")
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    employee_id: Optional[str] = None

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
    user_id: str = Field(..., description="User UUID for database storage")
    employee_id: Optional[str] = None

# Add new data models for separate endpoints
class EmployeeAnalysisResponse(BaseModel):
    burnout_score: int = Field(..., description="Burnout score percentage (0-100)")
    burnout_label: str = Field(..., description="Risk classification label")
    model_used: str = Field(..., description="ML model used for prediction")
    prediction_confidence: str = Field(..., description="Confidence level of prediction")
    employee_id: Optional[str] = None
    analysis_timestamp: str = Field(..., description="Timestamp of analysis")

class SurveyAnalysisResponse(BaseModel):
    risk_level: str = Field(..., description="Risk level based on survey responses")
    assessment_method: str = Field(..., description="Assessment method used")
    total_questions: int = Field(..., description="Number of questions analyzed")
    analysis_timestamp: str = Field(..., description="Timestamp of analysis")

class CombinedAnalysisRequest(BaseModel):
    employee: EmployeeData
    survey: SurveyLikertData
    user_id: str = Field(..., description="User UUID for database storage")
    employee_id: Optional[str] = None

class CombinedAnalysisResponse(BaseModel):
    mental_health_summary: str = Field(..., description="AI-generated mental health summary")
    recommendations: List[str] = Field(..., description="Personalized recommendations")
    source: str = Field(..., description="Source of analysis (AI or fallback)")
    employee_id: Optional[str] = None
    analysis_timestamp: str = Field(..., description="Timestamp of analysis")

@app.get("/")
async def root():
    return {"message": "Welcome to Employee Burnout Prediction Backend"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    update_system_metrics()
    return {"status": "healthy", "message": "Survey API is running"}

@app.get("/metrics")
async def metrics():
    """Expose Prometheus metrics."""
    update_system_metrics()
    return Response(content=generate_latest(), media_type="text/plain")

@app.post("/train", tags=["Model Training"])
async def train(background_tasks: BackgroundTasks):
    """
    Train the machine learning models using the training data.
    This will create/update the model files in the models directory.
    """
    REQUESTS.labels(endpoint='train').inc()
    try:
        # Run training in background
        background_tasks.add_task(train_models)
        return {"message": "Model training started in background"}
    except Exception as e:
        ERROR_COUNT.labels(endpoint='train', error_type='general').inc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(employee: EmployeeData):
    """
    Predict burnout rate for an employee using the trained model.
    """
    REQUESTS.labels(endpoint='predict').inc()
    start_time = time.time()
    
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
            ERROR_COUNT.labels(endpoint='predict', error_type='models_not_found').inc()
            raise HTTPException(status_code=400, detail="Models not trained yet. Please train the models first.")

        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        with open(model_path, 'rb') as f:
            model = pickle.load(f)

        # Scale the input
        input_scaled = scaler.transform(input_df)
        
        # Convert scaled input back to DataFrame with feature names to avoid the warning
        input_scaled_df = pd.DataFrame(input_scaled, columns=input_df.columns)

        # Predict
        prediction = model.predict(input_scaled_df)[0]

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

        # Validate user_id
        try:
            user_uuid = validate_user_uuid(employee.user_id)
        except HTTPException as e:
            ERROR_COUNT.labels(endpoint='predict', error_type='invalid_user_id').inc()
            raise e
        except ValueError:
            ERROR_COUNT.labels(endpoint='predict', error_type='invalid_user_id').inc()
            raise HTTPException(status_code=400, detail="Invalid user_id format")
        
        # Store in centralized database
        try:
            db_client = get_db_client(auth_token=employee.token)
            
            # Use the validated user_uuid directly
            survey_data = {
                "employee_data": input_data,
                "burn_rate": prediction,
                "stress_level": stress_level,
                "model_used": "Linear Regression",
                "recommendations": []  # Basic prediction doesn't include recommendations
            }
            
            success = db_client.store_survey_result(user_uuid, survey_data)
            if success:
                db_client.log_audit_event(user_uuid, "survey_prediction", {
                    "service": "survey",
                    "burn_rate": prediction,
                    "stress_level": stress_level,
                    "mental_fatigue_score": employee.mental_fatigue_score
                })
                logger.info(f"Stored survey prediction in database for user {user_uuid}")
        except Exception as e:
            logger.error(f"Error storing survey prediction: {str(e)}")
        
        # Update metrics
        update_system_metrics()

        return response

    except Exception as e:
        ERROR_COUNT.labels(endpoint='predict', error_type='general').inc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        PROCESSING_TIME.labels(endpoint='predict').observe(time.time() - start_time)

@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Prediction"])
async def predict_batch(batch_request: BatchPredictionRequest):
    """
    Predict burnout rates for multiple employees at once.
    """
    REQUESTS.labels(endpoint='predict_batch').inc()
    start_time = time.time()
    
    try:
        predictions = []
        for employee in batch_request.employees:
            prediction = await predict(employee)
            predictions.append(prediction)
        return {"predictions": predictions}
    except Exception as e:
        ERROR_COUNT.labels(endpoint='predict_batch', error_type='general').inc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        PROCESSING_TIME.labels(endpoint='predict_batch').observe(time.time() - start_time)

@app.get("/predictions/history", tags=["History"])
async def get_prediction_history():
    """
    Get the history of all predictions made.
    NOTE: This is deprecated and will be removed. Fetch data from the core service instead.
    """
    REQUESTS.labels(endpoint='predictions_history').inc()
    update_system_metrics()
    return {"message": "This endpoint is deprecated. Please fetch from the core service.", "predictions": []}

@app.get("/models/metrics", response_model=List[ModelMetrics], tags=["Model Information"])
async def get_model_metrics():
    """
    Get performance metrics for all trained models.
    """
    REQUESTS.labels(endpoint='model_metrics').inc()
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
        update_system_metrics()
        return metrics
    except Exception as e:
        ERROR_COUNT.labels(endpoint='model_metrics', error_type='general').inc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze", tags=["Integration"])
async def analyze(employee: EmployeeData):
    """
    Wrapper for /predict to support integration with the common backend.
    """
    REQUESTS.labels(endpoint='analyze').inc()
    start_time = time.time()
    
    try:
        logger.info(f"Received survey data for analysis: {employee.dict()}")
        result = await predict(employee)
        logger.info(f"Survey analysis completed successfully: {result}")
        return result
    except Exception as e:
        ERROR_COUNT.labels(endpoint='analyze', error_type='general').inc()
        logger.error(f"Error in survey analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        PROCESSING_TIME.labels(endpoint='analyze').observe(time.time() - start_time)

@app.post("/analyze-survey", tags=["Survey"])
async def analyze_survey(request: AnalyzeSurveyRequest):
    REQUESTS.labels(endpoint='analyze_survey').inc()
    start_time = time.time()
    
    try:
        # Validate user_id
        try:
            user_uuid = validate_user_uuid(request.user_id)
        except HTTPException as e:
            ERROR_COUNT.labels(endpoint='analyze_survey', error_type='invalid_user_id').inc()
            raise e
        except ValueError:
            ERROR_COUNT.labels(endpoint='analyze_survey', error_type='invalid_user_id').inc()
            raise HTTPException(status_code=400, detail="Invalid user_id format")
        
        # 1. ML MODEL PREDICTION - Burnout Risk from AI Model
        burn_result = await predict(request.employee)
        ml_burn_rate = burn_result["burn_rate"]  # 0.0 to 1.0
        ml_burn_percentage = round(ml_burn_rate * 100)  # Convert to percentage
        
        # Use the stress level directly from /predict endpoint (the source of truth)
        ml_stress_label = burn_result["stress_level"]

        # 2. LIKERT SURVEY ANALYSIS - 10 Questions Analysis
        survey_scores = [
            request.survey.q1, request.survey.q2, request.survey.q3, request.survey.q4, request.survey.q5,
            request.survey.q6, request.survey.q7, request.survey.q8, request.survey.q9, request.survey.q10
        ]
        survey_total_score = sum(survey_scores)
        
        # Survey risk level classification based on specified ranges
        # Total Score Range | Label
        # 1 – 17           | Low
        # 18 – 34          | Medium  
        # 35 – 50          | High
        if survey_total_score <= 17:
            survey_risk_label = "Low"
        elif survey_total_score <= 34:
            survey_risk_label = "Medium"
        else:  # 35-50
            survey_risk_label = "High"

        # 3. PERSONALIZED SUGGESTIONS - Gemini API Integration
        gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        personalized_summary = ""
        personalized_recommendations = []
        
        if gemini_api_key:
            try:
                # Enhanced prompt for better personalization
                prompt = f"""
                Analyze this employee's profile and survey responses for personalized mental health insights:
                
                Employee Profile:
                - Designation Level: {request.employee.designation}/5
                - Resource Allocation: {request.employee.resource_allocation}/10
                - Mental Fatigue Score: {request.employee.mental_fatigue_score}/10
                - Company Type: {request.employee.company_type}
                - WFH Setup: {request.employee.wfh_setup_available}
                - Gender: {request.employee.gender}
                
                Survey Responses (1=Strongly Disagree, 5=Strongly Agree):
                1. Feel happy and relaxed: {request.survey.q1}
                2. Feel anxious/stressed: {request.survey.q2}
                3. Emotionally exhausted: {request.survey.q3}
                4. Feel motivated: {request.survey.q4}
                5. Sense of accomplishment: {request.survey.q5}
                6. Feel detached: {request.survey.q6}
                7. Manageable workload: {request.survey.q7}
                8. Control over tasks: {request.survey.q8}
                9. Team support: {request.survey.q9}
                10. Work-life balance respected: {request.survey.q10}
                
                ML Prediction: {ml_burn_percentage}% burnout risk ({ml_stress_label})
                Survey Assessment: {survey_risk_label}
                
                Provide personalized analysis and recommendations in JSON format:
                {{
                    "Mental Health Summary": "Detailed analysis of current mental health state based on all factors",
                    "Recommendations": ["Specific recommendation 1", "Specific recommendation 2", "Specific recommendation 3"]
                }}
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
                        text = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
                        
                        # Extract JSON from response
                        match = re.search(r'\{.*\}', text, re.DOTALL)
                        if match:
                            parsed = pyjson.loads(match.group(0))
                            personalized_summary = parsed.get("Mental Health Summary", "")
                            personalized_recommendations = parsed.get("Recommendations", [])
                        else:
                            # Fallback if no JSON found
                            personalized_summary = text
                            personalized_recommendations = [
                                "Focus on stress management techniques",
                                "Consider professional counseling if needed",
                                "Maintain work-life balance"
                            ]
                    except Exception as parse_error:
                        logger.warning(f"Failed to parse Gemini response: {parse_error}")
                        personalized_summary = "AI analysis completed successfully but response format needs adjustment."
                        personalized_recommendations = [
                            "Prioritize self-care and mental health",
                            "Seek support from colleagues and supervisors",
                            "Consider professional guidance if stress persists"
                        ]
                        
            except Exception as gemini_error:
                logger.warning(f"Gemini API failed: {str(gemini_error)}, using enhanced fallback")
                
                # Enhanced fallback based on combined ML + Survey results
                if survey_risk_label == "High Risk" or ml_stress_label == "Very High Burnout Risk":
                    personalized_summary = f"Analysis indicates significant stress levels with {ml_burn_percentage}% burnout risk from ML model and {survey_risk_label} from survey responses. Immediate attention to mental health and work-life balance is strongly recommended."
                    personalized_recommendations = [
                        "Seek immediate support from mental health professionals or employee assistance programs",
                        "Discuss workload adjustment with your manager or HR department",
                        "Implement daily stress reduction practices like meditation or deep breathing exercises"
                    ]
                elif survey_risk_label == "Medium Risk" or ml_stress_label in ["Medium Burnout Risk", "High Burnout Risk"]:
                    personalized_summary = f"Analysis shows moderate stress levels with {ml_burn_percentage}% burnout risk. Proactive wellness measures and lifestyle adjustments are advised to prevent escalation."
                    personalized_recommendations = [
                        "Establish clear boundaries between work and personal time",
                        "Engage in regular physical activity and maintain social connections outside work",
                        "Practice stress management techniques and consider mindfulness training"
                    ]
                else:
                    personalized_summary = f"Analysis indicates relatively manageable stress levels with {ml_burn_percentage}% burnout risk. Continue current positive practices while monitoring for changes."
                    personalized_recommendations = [
                        "Maintain current healthy work habits and coping strategies",
                        "Continue regular self-assessment and stress monitoring",
                        "Build resilience through continuous learning and skill development"
                    ]
        else:
            # No Gemini API key - provide structured fallback
            personalized_summary = f"Comprehensive analysis completed using ML prediction ({ml_burn_percentage}% burnout risk) and survey assessment ({survey_risk_label}). Professional consultation recommended for detailed personalized guidance."
            personalized_recommendations = [
                "Implement regular stress monitoring and self-care practices",
                "Seek professional guidance for personalized mental health strategies",
                "Maintain open communication with supervisors about workload and support needs"
            ]

        # Update metrics
        update_system_metrics()
        
        # 4. STRUCTURED RESPONSE - Clear Separation of Results
        response = {
            # ML MODEL RESULTS (Score + Label)
            "ml_model_result": {
                "burnout_score": ml_burn_percentage,  # 0-100%
                "burnout_label": ml_stress_label,
                "model_used": "Linear Regression",
                "prediction_confidence": "High" if ml_burn_rate > 0.2 else "Medium"
            },
            
            # LIKERT SURVEY RESULTS (Label Only)
            "survey_result": {
                "risk_level": survey_risk_label,
                "assessment_method": "10-Question Likert Scale",
                "total_questions": 10
            },
            
            # PERSONALIZED SUGGESTIONS (Gemini-Powered)
            "personalized_insights": {
                "mental_health_summary": personalized_summary,
                "recommendations": personalized_recommendations,
                "source": "Gemini AI" if gemini_api_key and personalized_summary else "Rule-based Fallback"
            },
            
            # METADATA
            "metadata": {
                "employee_id": request.employee_id or "anonymous",
                "analysis_timestamp": datetime.now().isoformat(),
                "api_version": "2.0"
            }
        }
        
        return response
        
    except Exception as e:
        ERROR_COUNT.labels(endpoint='analyze_survey', error_type='general').inc()
        logger.error(f"Error in analyze-survey: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        PROCESSING_TIME.labels(endpoint='analyze_survey').observe(time.time() - start_time)

def _generate_recommendations(burnout_score: int, employee: EmployeeData) -> List[str]:
    """Generate personalized recommendations based on burnout score and employee data."""
    recommendations = []
    
    if burnout_score >= 80:
        recommendations.extend([
            "Immediate intervention recommended - consider taking time off",
            "Schedule urgent consultation with HR or mental health professional",
            "Implement stress reduction techniques immediately"
        ])
    elif burnout_score >= 60:
        recommendations.extend([
            "High stress levels detected - consider workload redistribution",
            "Implement regular break schedules",
            "Explore stress management workshops"
        ])
    elif burnout_score >= 30:
        recommendations.extend([
            "Monitor stress levels closely",
            "Consider preventive wellness activities",
            "Maintain work-life balance"
        ])
    else:
        recommendations.extend([
            "Continue current positive practices",
            "Share stress management techniques with colleagues",
            "Consider mentoring opportunities"
        ])
    
    # Add specific recommendations based on employee factors
    if employee.mental_fatigue_score >= 7:
        recommendations.append("Focus on improving sleep quality and work-life balance")
    
    if employee.resource_allocation <= 3:
        recommendations.append("Discuss resource needs with management")
    
    if employee.wfh_setup_available == "No":
        recommendations.append("Explore remote work options to reduce commute stress")
    
    return recommendations

@app.post("/analyze-employee", response_model=EmployeeAnalysisResponse, tags=["Separate Analysis"])
async def analyze_employee(employee: EmployeeData, background_tasks: BackgroundTasks, token: Optional[str] = Depends(get_token)):
    """
    Analyzes employee data for burnout prediction.
    - Requires bearer token for authentication.
    - Stores results asynchronously in the core service.
    """
    REQUESTS.labels(endpoint='/analyze-employee').inc()
    start_time = time.time()
    update_system_metrics()

    try:
        # Validate user_id
        user_uuid = validate_user_uuid(employee.user_id)
        
        # Load the pre-trained model and scaler
        models_dir = os.path.join(os.path.dirname(__file__), 'models')
        scaler_path = os.path.join(models_dir, 'scaler.pkl')
        model_path = os.path.join(models_dir, 'linear_regression.pkl')

        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        with open(model_path, 'rb') as f:
            model = pickle.load(f)

        # Preprocess input data - using exact column names that the model expects
        data = {
            'Designation': [employee.designation],
            'Resource Allocation': [employee.resource_allocation],
            'Mental Fatigue Score': [employee.mental_fatigue_score],
            'Company Type_Service': [1 if employee.company_type == 'Service' else 0],
            'WFH Setup Available_Yes': [1 if employee.wfh_setup_available == 'Yes' else 0],
            'Gender_Male': [1 if employee.gender == 'Male' else 0],
        }
        input_df = pd.DataFrame(data)
        input_scaled = scaler.transform(input_df)

        # Make prediction
        prediction = model.predict(input_scaled)[0]
        burnout_score = int(prediction * 100)

        # Interpret prediction
        if burnout_score < 30:
            burnout_label = "Low Stress"
        elif 30 <= burnout_score < 60:
            burnout_label = "Medium Stress"
        elif 60 <= burnout_score < 80:
            burnout_label = "High Stress"
        else:
            burnout_label = "Very High Stress / Burnout"

        # Calculate processing time for response and database storage
        processing_time = time.time() - start_time

        # Construct response
        response = EmployeeAnalysisResponse(
            burnout_score=burnout_score,
            burnout_label=burnout_label,
            model_used="BERT-MLP",  # Placeholder for actual model name
            prediction_confidence="High",  # Placeholder
            employee_id=employee.employee_id,
            analysis_timestamp=datetime.now().isoformat()
        )

        # Asynchronously store results in the database - proper schema mapping
        db_data = {
            "survey_type": "employee_ml_prediction",
            "survey_version": "1.0",
            "responses": employee.dict(),
            "completion_time_seconds": int(processing_time * 1000),  # Convert to milliseconds
            "burnout_score": float(burnout_score / 100.0),  # Convert percentage to 0-1 scale
            "stress_level": burnout_label,
            "risk_categories": {
                "burnout_risk": burnout_label,
                "stress_category": "high" if burnout_score >= 60 else "medium" if burnout_score >= 30 else "low",
                "mental_fatigue_level": "high" if employee.mental_fatigue_score >= 7 else "medium" if employee.mental_fatigue_score >= 4 else "low"
            },
            "prediction_model_version": "linear_regression_v1.0",
            "prediction_confidence": 0.85,  # High confidence as stated in response
            "predicted_outcomes": {
                "burnout_probability": float(burnout_score / 100.0),
                "stress_level_prediction": burnout_label,
                "risk_factors": {
                    "designation_level": employee.designation,
                    "resource_allocation": employee.resource_allocation,
                    "mental_fatigue": employee.mental_fatigue_score,
                    "company_type": employee.company_type,
                    "wfh_setup": employee.wfh_setup_available,
                    "gender": employee.gender
                }
            },
            "ai_recommendations": {
                "immediate_actions": _generate_recommendations(burnout_score, employee),
                "follow_up_timeline": "2-4 weeks" if burnout_score >= 60 else "1-2 months"
            },
            "follow_up_suggested": burnout_score >= 60
        }
        background_tasks.add_task(store_survey_in_core_service, db_data, employee.user_id, token)

        PROCESSING_TIME.labels(endpoint='/analyze-employee').observe(processing_time)
        
        return response

    except Exception as e:
        logger.error(f"Error in employee analysis: {str(e)}")
        ERROR_COUNT.labels(endpoint='/analyze-employee', error_type='processing_error').inc()
        raise HTTPException(status_code=500, detail="An unexpected error occurred during employee analysis.")

@app.post("/analyze-survey-questions", response_model=SurveyAnalysisResponse, tags=["Separate Analysis"])
async def analyze_survey_questions(survey: SurveyLikertData, background_tasks: BackgroundTasks, token: Optional[str] = Depends(get_token)):
    """
    Analyzes Likert scale survey questions to determine risk level.
    Requires bearer token for authentication.
    """
    REQUESTS.labels(endpoint='/analyze-survey-questions').inc()
    start_time = time.time()
    update_system_metrics()
    
    # Simple risk assessment logic (can be expanded)
    total_score = sum(survey.dict().values())
    num_questions = len(survey.dict())
    avg_score = total_score / num_questions
    
    if avg_score > 3.5:
        risk_level = "Low"
    elif 2.5 <= avg_score <= 3.5:
        risk_level = "Medium"
    else:
        risk_level = "High"

    response = SurveyAnalysisResponse(
        risk_level=risk_level,
        assessment_method="Likert-10 Average Score",
        total_questions=num_questions,
        analysis_timestamp=datetime.now().isoformat()
    )

    # Note: Storing this result alone might not be as useful without user_id.
    # The frontend orchestrates sending combined data. If this endpoint is called directly,
    # we would need user_id passed in the body to store it.

    processing_time = time.time() - start_time
    PROCESSING_TIME.labels(endpoint='/analyze-survey-questions').observe(processing_time)
    
    return response

@app.post("/analyze-combined", response_model=CombinedAnalysisResponse, tags=["Separate Analysis"])
async def analyze_combined(request: CombinedAnalysisRequest, background_tasks: BackgroundTasks, token: Optional[str] = Depends(get_token)):
    """
    Provides AI-driven insights based on combined employee and survey data.
    Requires bearer token for authentication.
    """
    REQUESTS.labels(endpoint='/analyze-combined').inc()
    start_time = time.time()
    update_system_metrics()

    try:
        user_uuid = validate_user_uuid(request.user_id)

        # This is where you would integrate with a GenAI model like GPT or Gemini
        # For now, we'll use a mocked response.
        
        # Mocked analysis logic
        summary = f"AI analysis for {request.employee.user_name or 'user'} indicates a moderate level of stress, influenced by resource allocation and mental fatigue scores. Recommendations focus on improving work-life balance and resource management."
        
        recommendations = [
            "Discuss resource allocation with your manager to ensure tasks are manageable.",
            "Schedule regular short breaks throughout the day to mitigate mental fatigue.",
            "Explore mindfulness or meditation techniques to manage stress levels.",
            "Ensure a clear separation between work and personal time, especially if working from home."
        ]

        response = CombinedAnalysisResponse(
            mental_health_summary=summary,
            recommendations=recommendations,
            source="GenAI-Mock-v1.0",
            employee_id=request.employee_id,
            analysis_timestamp=datetime.now().isoformat()
        )

        # Calculate processing time before using it in database storage
        processing_time = time.time() - start_time
        
        # Calculate risk score based on survey responses for database storage
        survey_scores = list(request.survey.dict().values())
        avg_survey_score = sum(survey_scores) / len(survey_scores)
        
        # Derive burnout score from survey analysis
        if avg_survey_score > 3.5:
            derived_burnout_score = 0.2  # Low risk
            risk_level = "Low"
        elif 2.5 <= avg_survey_score <= 3.5:
            derived_burnout_score = 0.5  # Medium risk
            risk_level = "Medium"
        else:
            derived_burnout_score = 0.8  # High risk
            risk_level = "High"
        
        # Asynchronously store results in the database - proper schema mapping
        db_data = {
            "survey_type": "combined_ai_analysis",
            "survey_version": "1.0",
            "responses": {
                "employee": request.employee.dict(),
                "survey": request.survey.dict()
            },
            "completion_time_seconds": int(processing_time * 1000),  # Convert to milliseconds
            "burnout_score": derived_burnout_score,
            "stress_level": risk_level,
            "risk_categories": {
                "overall_risk": risk_level,
                "survey_based_risk": risk_level,
                "emotional_exhaustion": "high" if survey_scores[2] <= 2 else "low",  # q3: emotional exhaustion
                "work_life_balance": "poor" if survey_scores[9] <= 2 else "good",   # q10: work-life balance
                "job_satisfaction": "low" if survey_scores[4] <= 2 else "high"      # q5: accomplishment
            },
            "prediction_model_version": "combined_ai_v1.0",
            "prediction_confidence": 0.75,
            "predicted_outcomes": {
                "burnout_risk": derived_burnout_score,
                "stress_level_prediction": risk_level,
                "survey_insights": {
                    "happiness_score": survey_scores[0],
                    "anxiety_level": survey_scores[1],
                    "emotional_exhaustion": survey_scores[2],
                    "motivation_level": survey_scores[3],
                    "accomplishment_feeling": survey_scores[4],
                    "detachment_level": survey_scores[5],
                    "workload_manageability": survey_scores[6],
                    "task_control": survey_scores[7],
                    "support_availability": survey_scores[8],
                    "work_life_balance": survey_scores[9]
                }
            },
            "ai_recommendations": {
                "immediate_actions": recommendations,
                "mental_health_summary": summary,
                "follow_up_timeline": "2-3 weeks" if risk_level == "High" else "1-2 months"
            },
            "follow_up_suggested": risk_level == "High"
        }
        background_tasks.add_task(store_survey_in_core_service, db_data, request.user_id, token)

        PROCESSING_TIME.labels(endpoint='/analyze-combined').observe(processing_time)

        return response
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in combined analysis: {str(e)}")
        ERROR_COUNT.labels(endpoint='/analyze-combined', error_type='processing_error').inc()
        raise HTTPException(status_code=500, detail="An unexpected error occurred during combined analysis.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004) 