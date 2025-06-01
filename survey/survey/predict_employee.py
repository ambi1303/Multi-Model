import pandas as pd
import pickle

# Get user input for employee data
print("Please enter the employee details:")
employee = {}
employee['Designation'] = float(input("Designation (1-5, 1 being lowest): "))
employee['Resource Allocation'] = float(input("Resource Allocation (1-10): "))
employee['Mental Fatigue Score'] = float(input("Mental Fatigue Score (1-10): "))
employee['Company Type'] = input("Company Type (Service/Product): ")
employee['WFH Setup Available'] = input("WFH Setup Available (Yes/No): ")
employee['Gender'] = input("Gender (Male/Female): ")

# Convert to DataFrame
input_df = pd.DataFrame([employee])

# One-hot encode categorical columns
input_df = pd.get_dummies(input_df, columns=['Company Type', 'WFH Setup Available', 'Gender'], drop_first=True)

# Ensure the input has the same columns as the model was trained on
trained_features = ['Designation', 'Resource Allocation', 'Mental Fatigue Score', 'Company Type_Service', 'WFH Setup Available_Yes', 'Gender_Male']
for col in trained_features:
    if col not in input_df.columns:
        input_df[col] = 0
input_df = input_df[trained_features]

# Load scaler and model
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

print(f"Predicted Burn Rate: {prediction:.2%}")
print(f"Stress Level: {stress_level}") 