import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
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

# --- NEW: Core Service Integration ---
CORE_SERVICE_URL = os.getenv("CORE_SERVICE_URL", "http://localhost:8000")

async def store_survey_in_core_service(survey_data: dict, user_id: str, token: Optional[str]):
    """Asynchronously stores survey analysis results in the core service."""
    try:
        if not token:
            logger.warning("No auth token provided; skipping survey storage in core service.")
            return

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # The survey service now sends data to the specific survey analysis endpoint
        survey_analysis_endpoint = f"{CORE_SERVICE_URL}/surveys/responses"
        
        logger.info(f"Sending survey data to core service for user {user_id}: {survey_data}")

        async with httpx.AsyncClient() as client:
            response = await client.post(survey_analysis_endpoint, json=survey_data, headers=headers, timeout=30.0)
            
            if 400 <= response.status_code < 500:
                logger.error(f"Client error storing survey for user {user_id}: {response.status_code} - {response.text}")
            
            response.raise_for_status()
            logger.info(f"Successfully stored survey analysis for user {user_id} in core service.")

    except httpx.RequestError as e:
        logger.error(f"Network error sending survey analysis to core service for user {user_id}: {e}")
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error storing survey analysis for user {user_id}: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        logger.error(f"An unexpected error occurred while storing survey analysis for user {user_id}: {e}")

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
    token: Optional[str] = None

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
    token: Optional[str] = None

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
    token: Optional[str] = None

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

@app.post("/analyze-employee", response_model=EmployeeAnalysisResponse, tags=["Separate Analysis"])
async def analyze_employee(employee: EmployeeData, employee_id: Optional[str] = None):
    """
    Analyze employee data using ML model only - returns burnout prediction with score and label.
    """
    REQUESTS.labels(endpoint='analyze_employee').inc()
    start_time = time.time()
    
    try:
        # Get ML model prediction directly from /predict endpoint
        burn_result = await predict(employee)
        ml_burn_rate = burn_result["burn_rate"]  # 0.0 to 1.0
        ml_burn_percentage = round(ml_burn_rate * 100)  # Convert to percentage
        
        # Use the stress level directly from /predict endpoint (the source of truth)
        ml_stress_label = burn_result["stress_level"]

        # --- NEW: Store in Core Service ---
        try:
            survey_payload = {
                "user_id": employee.user_id,
                "survey_type": "employee_ml_burnout",
                "responses": employee.dict(exclude={'user_id', 'token'}),
                "burnout_score": ml_burn_rate,
                "stress_level": ml_stress_label,
                "prediction_model_version": burn_result["model_used"],
                "prediction_confidence": 0.9 if ml_burn_rate > 0.2 else 0.75,
            }
            if employee.user_id and employee.token:
                await store_survey_in_core_service(survey_payload, employee.user_id, employee.token)
            else:
                logger.warning("Cannot store survey in core service: missing user_id or token.")
        except Exception as e:
            logger.error(f"Failed to store employee analysis in core service: {e}")

        # Update metrics
        update_system_metrics()
        
        return EmployeeAnalysisResponse(
            burnout_score=ml_burn_percentage,
            burnout_label=ml_stress_label,
            model_used=burn_result["model_used"],
            prediction_confidence="High" if ml_burn_rate > 0.2 else "Medium",
            employee_id=employee_id,
            analysis_timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        ERROR_COUNT.labels(endpoint='analyze_employee', error_type='general').inc()
        logger.error(f"Error in analyze-employee: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        PROCESSING_TIME.labels(endpoint='analyze_employee').observe(time.time() - start_time)

@app.post("/analyze-survey-questions", response_model=SurveyAnalysisResponse, tags=["Separate Analysis"])
async def analyze_survey_questions(survey: SurveyLikertData, user_id: Optional[str] = None, token: Optional[str] = None):
    """
    Analyze Likert scale survey questions only - returns risk level label (no score exposed).
    """
    REQUESTS.labels(endpoint='analyze_survey_questions').inc()
    start_time = time.time()
    
    try:
        # Calculate survey scores
        survey_scores = [
            survey.q1, survey.q2, survey.q3, survey.q4, survey.q5,
            survey.q6, survey.q7, survey.q8, survey.q9, survey.q10
        ]
        survey_total_score = sum(survey_scores)
        
        # Survey risk level classification based on your specified ranges
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

        # --- NEW: Store in Core Service ---
        try:
            if user_id and token:
                survey_payload = {
                    "user_id": user_id,
                    "survey_type": "likert_10_question",
                    "responses": survey.dict(),
                    "stress_level": survey_risk_label,
                }
                await store_survey_in_core_service(survey_payload, user_id, token)
            else:
                logger.warning("Cannot store survey questions analysis in core service: missing user_id or token.")
        except Exception as e:
            logger.error(f"Failed to store survey questions analysis in core service: {e}")

        # Update metrics
        update_system_metrics()
        
        return SurveyAnalysisResponse(
            risk_level=survey_risk_label,
            assessment_method="10-Question Likert Scale",
            total_questions=10,
            analysis_timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        ERROR_COUNT.labels(endpoint='analyze_survey_questions', error_type='general').inc()
        logger.error(f"Error in analyze-survey-questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        PROCESSING_TIME.labels(endpoint='analyze_survey_questions').observe(time.time() - start_time)

@app.post("/analyze-combined", response_model=CombinedAnalysisResponse, tags=["Separate Analysis"])
async def analyze_combined(request: CombinedAnalysisRequest):
    """
    Combine employee and survey data for AI-powered personalized insights and recommendations.
    """
    REQUESTS.labels(endpoint='analyze_combined').inc()
    start_time = time.time()
    
    try:
        # Validate user_id
        try:
            user_uuid = validate_user_uuid(request.user_id)
        except HTTPException as e:
            ERROR_COUNT.labels(endpoint='analyze_combined', error_type='invalid_user_id').inc()
            raise e
        except ValueError:
            ERROR_COUNT.labels(endpoint='analyze_combined', error_type='invalid_user_id').inc()
            raise HTTPException(status_code=400, detail="Invalid user_id format")
        
        # Get ML prediction for context directly from /predict endpoint
        burn_result = await predict(request.employee)
        ml_burn_rate = burn_result["burn_rate"]
        ml_burn_percentage = round(ml_burn_rate * 100)
        
        # Use the stress level directly from /predict endpoint (the source of truth)
        ml_stress_label = burn_result["stress_level"]
        
        # Get survey analysis for context
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

        # AI-Powered Personalized Analysis
        gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        personalized_summary = ""
        personalized_recommendations = []
        analysis_source = "Rule-based Fallback"
        
        if gemini_api_key:
            try:
                prompt = f"""
                You are a mental health expert analyzing an employee's burnout risk and stress levels. Provide personalized insights based on both ML model prediction and survey responses.

                EMPLOYEE PROFILE:
                - Designation Level: {request.employee.designation}/5 (1=entry level, 5=senior executive)
                - Resource Allocation: {request.employee.resource_allocation}/10 (workload distribution)
                - Mental Fatigue Score: {request.employee.mental_fatigue_score}/10 (current mental exhaustion)
                - Company Type: {request.employee.company_type}
                - WFH Setup Available: {request.employee.wfh_setup_available}
                - Gender: {request.employee.gender}

                ML MODEL ANALYSIS:
                - Burnout Rate: {ml_burn_rate:.4f} ({ml_burn_percentage}%)
                - AI Prediction: {ml_stress_label}
                - Model Used: {burn_result["model_used"]}

                SURVEY ANALYSIS:
                - Total Score: {survey_total_score}/50
                - Survey Classification: {survey_risk_label}
                - Score Breakdown (1=Strongly Disagree, 5=Strongly Agree):
                  * Feel happy and relaxed at work: {request.survey.q1}/5
                  * Feel anxious/stressed due to work: {request.survey.q2}/5
                  * Feel emotionally exhausted after work: {request.survey.q3}/5
                  * Feel motivated and excited about work: {request.survey.q4}/5
                  * Feel sense of accomplishment: {request.survey.q5}/5
                  * Feel detached/indifferent about work: {request.survey.q6}/5
                  * Workload is manageable: {request.survey.q7}/5
                  * Have control over tasks: {request.survey.q8}/5
                  * Receive team/manager support: {request.survey.q9}/5
                  * Work-life balance is respected: {request.survey.q10}/5

                ANALYSIS CORRELATION:
                - ML Model says: {ml_stress_label}
                - Survey indicates: {survey_risk_label} risk level
                - Agreement level: {"High" if (ml_stress_label.lower() in survey_risk_label.lower() or survey_risk_label.lower() in ml_stress_label.lower()) else "Moderate"}

                Please provide a comprehensive analysis in JSON format:
                {{
                    "Mental Health Summary": "Detailed 2-3 sentence analysis combining ML prediction ({ml_burn_percentage}% burnout risk) and survey results ({survey_total_score}/50 points, {survey_risk_label} risk). Explain any discrepancies between AI model and self-reported survey.",
                    "Recommendations": [
                        "Specific actionable recommendation based on highest risk factors",
                        "Workplace-specific suggestion considering company type and WFH setup",
                        "Personal wellness strategy tailored to their designation level and mental fatigue",
                        "Long-term prevention strategy based on survey responses"
                    ]
                }}
                """
                
                gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + gemini_api_key
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
                            analysis_source = "Gemini AI"
                        else:
                            personalized_summary = text
                            personalized_recommendations = [
                                "Focus on stress management techniques",
                                "Consider professional counseling if needed",
                                "Maintain work-life balance"
                            ]
                            analysis_source = "Gemini AI (Unstructured)"
                    except Exception as parse_error:
                        logger.warning(f"Failed to parse Gemini response: {parse_error}")
                        personalized_summary = "AI analysis completed but response format needs adjustment."
                        personalized_recommendations = [
                            "Prioritize self-care and mental health",
                            "Seek support from colleagues and supervisors",
                            "Consider professional guidance if stress persists"
                        ]
                        analysis_source = "Gemini AI (Parse Error)"
                        
            except Exception as gemini_error:
                logger.warning(f"Gemini API failed: {str(gemini_error)}, using enhanced fallback")
                analysis_source = "Rule-based Fallback"
        
        # Enhanced fallback if Gemini fails or no API key
        if not personalized_summary:
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
        
        # --- NEW: Store Combined Analysis in Core Service ---
        try:
            combined_payload = {
                "user_id": request.user_id,
                "survey_type": "combined_burnout_assessment",
                "responses": {
                    "employee_data": request.employee.dict(exclude={'user_id', 'token'}),
                    "survey_questions": request.survey.dict()
                },
                "burnout_score": ml_burn_rate,
                "stress_level": f"{ml_stress_label} (ML) / {survey_risk_label} (Survey)",
                "risk_categories": {
                    "ml_prediction": ml_stress_label,
                    "survey_assessment": survey_risk_label
                },
                "prediction_model_version": burn_result["model_used"],
                "prediction_confidence": burn_result.get("prediction_confidence_score", 0.85),
                "ai_recommendations": {
                    "source": analysis_source,
                    "summary": personalized_summary,
                    "recommendations": personalized_recommendations
                },
                "follow_up_suggested": survey_risk_label in ["High", "Medium"]
            }
            if request.user_id and request.token:
                await store_survey_in_core_service(combined_payload, request.user_id, request.token)
            else:
                logger.warning("Cannot store combined analysis in core service: missing user_id or token.")
        except Exception as e:
            logger.error(f"Failed to store combined analysis in core service: {e}")

        # Final response
        return CombinedAnalysisResponse(
            mental_health_summary=personalized_summary,
            recommendations=personalized_recommendations,
            source=analysis_source,
            employee_id=request.employee_id,
            analysis_timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        ERROR_COUNT.labels(endpoint='analyze_combined', error_type='general').inc()
        logger.error(f"Error in analyze-combined: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        PROCESSING_TIME.labels(endpoint='analyze_combined').observe(time.time() - start_time)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004) 