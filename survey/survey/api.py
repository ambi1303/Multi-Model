from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
import pandas as pd
import pickle
import os
from survey_predict import train_models  # We'll create this function in survey_predict.py

app = FastAPI(
    title="Employee Burnout Prediction API",
    description="API for predicting employee burnout rates using machine learning models",
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

@app.get("/")
async def root():
    return {"message": "Welcome to Employee Burnout Prediction API"}

@app.post("/train", tags=["Model Training"])
async def train():
    """
    Train the machine learning models using the training data.
    This will create/update the model files in the models directory.
    """
    try:
        train_models()
        return {"message": "Models trained successfully"}
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

        return {
            "burn_rate": prediction,
            "stress_level": stress_level,
            "model_used": "Linear Regression"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 