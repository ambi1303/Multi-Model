# Employee Burnout Prediction

This project predicts employee burnout rates using machine learning models trained on survey data.

## Setup

1. Install required packages:
```bash
pip install pandas numpy scikit-learn
```

2. Make sure you have the following files in your directory:
- train.csv (training data)
- test.csv (test data)
- models/ (directory for saved models)

## Usage

1. First, train the models:
```bash
python survey_predict.py
```
This will create and save the trained models in the `models/` directory.

2. To predict burnout for an employee, edit the employee data in `predict_employee.py`:
```python
employee = {
    'Designation': 2.0,              # 1-5 (1 being lowest)
    'Resource Allocation': 5.0,      # 1-10
    'Mental Fatigue Score': 6.5,     # 1-10
    'Company Type': 'Service',       # 'Service' or 'Product'
    'WFH Setup Available': 'Yes',    # 'Yes' or 'No'
    'Gender': 'Male'                 # 'Male' or 'Female'
}
```

3. Run the prediction:
```bash
python predict_employee.py
```

## Output
The script will show:
- Predicted Burn Rate (as percentage)
- Stress Level (Low/Medium/High/Very High)

## Stress Level Thresholds
- Low Stress: 0-30%
- Medium Stress: 30-50%
- High Stress: 50-70%
- Very High Stress: 70-100% 