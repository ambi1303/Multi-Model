from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Literal, Optional, List
import pandas as pd
import pickle
import os
import json
from datetime import datetime
from survey_predict import train_models

app = FastAPI(
    title="Employee Burnout Prediction Backend",
    description="Backend API for employee burnout prediction system with additional features",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Data Models
class EmployeeData(BaseModel):
    Designation: float = Field(..., ge=1, le=5, description="Employee designation level (1-5, 1 being lowest)")
    Resource_Allocation: float = Field(..., ge=1, le=10, description="Resource allocation score (1-10)")
    Mental_Fatigue_Score: float = Field(..., ge=1, le=10, description="Mental fatigue score (1-10)")
    Company_Type: Literal["Service", "Product"] = Field(..., description="Type of company")
    WFH_Setup_Available: Literal["Yes", "No"] = Field(..., description="Whether WFH setup is available")
    Gender: Literal["Male", "Female"] = Field(..., description="Gender of the employee")

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
            'Designation': employee.Designation,
            'Resource Allocation': employee.Resource_Allocation,
            'Mental Fatigue Score': employee.Mental_Fatigue_Score,
            'Company Type': employee.Company_Type,
            'WFH Setup Available': employee.WFH_Setup_Available,
            'Gender': employee.Gender
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
        if not os.path.exists('models/scaler.pkl') or not os.path.exists('models/linear_regression.pkl'):
            raise HTTPException(status_code=400, detail="Models not trained yet. Please train the models first.")

        with open('models/scaler.pkl', 'rb') as f:
            scaler = pickle.load(f)
        with open('models/linear_regression.pkl', 'rb') as f:
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 