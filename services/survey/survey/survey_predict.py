import os
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score, precision_score, recall_score, f1_score


def _generate_synthetic_train_csv(path: str):
    """Generate synthetic employee burnout training data when train.csv is missing."""
    rng = np.random.RandomState(42)
    n = 500
    designation = rng.randint(1, 6, n).astype(float)
    resource_allocation = rng.randint(1, 11, n).astype(float)
    mental_fatigue_score = np.round(rng.uniform(1.0, 10.0, n), 1)
    company_type = rng.choice(["Service", "Product"], n)
    wfh = rng.choice(["Yes", "No"], n)
    gender = rng.choice(["Male", "Female"], n)

    burn_rate = np.clip(
        0.1 * mental_fatigue_score / 10
        + 0.3 * (1 - designation / 5)
        + 0.2 * resource_allocation / 10
        + 0.1 * (np.array(company_type) == "Service").astype(float)
        + 0.1 * (np.array(wfh) == "No").astype(float)
        + rng.normal(0, 0.08, n),
        0, 1,
    )
    burn_rate = np.round(burn_rate, 2)

    df = pd.DataFrame({
        "Designation": designation,
        "Resource Allocation": resource_allocation,
        "Mental Fatigue Score": mental_fatigue_score,
        "Company Type": company_type,
        "WFH Setup Available": wfh,
        "Gender": gender,
        "Burn Rate": burn_rate,
    })
    df.to_csv(path, index=True)
    print(f"[Survey] Generated synthetic train.csv with {n} rows at {path}")

def train_models():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'train.csv')
    if not os.path.exists(csv_path):
        _generate_synthetic_train_csv(csv_path)
    data = pd.read_csv(csv_path)

    # Drop the first column if it's an ID or non-numeric
    if data.columns[0] not in ['Burn Rate', 'Gender', 'Company Type', 'WFH Setup Available']:
        data = data.drop(data.columns[0], axis=1)

    data = data.dropna()

    # Drop unwanted columns if they exist
    columns_to_drop = ['Date of Joining', 'Days']
    data = data.drop([col for col in columns_to_drop if col in data.columns], axis=1)

    # One-hot encode categorical columns
    categorical_columns = ['Company Type', 'WFH Setup Available', 'Gender']
    data = pd.get_dummies(data, columns=[col for col in categorical_columns if col in data.columns], drop_first=True)

    # Feature-target split
    y = data['Burn Rate']
    X = data.drop('Burn Rate', axis=1)

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, train_size=0.7, shuffle=True, random_state=1)

    # Scale the features
    scaler = StandardScaler()
    scaler.fit(X_train)
    X_train = pd.DataFrame(scaler.transform(X_train), index=X_train.index, columns=X_train.columns)
    X_test = pd.DataFrame(scaler.transform(X_test), index=X_test.index, columns=X_test.columns)

    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)

    with open(os.path.join(models_dir, 'scaler.pkl'), 'wb') as scaler_file:
        pickle.dump(scaler, scaler_file)

    # Train Linear Regression model
    linear_regression_model = LinearRegression()
    linear_regression_model.fit(X_train, y_train)

    print("\nLinear Regression Model Performance Metrics:")
    y_pred = linear_regression_model.predict(X_test)
    print("Mean Squared Error:", mean_squared_error(y_test, y_pred))
    mse_lr = mean_squared_error(y_test, y_pred)
    print("Root Mean Squared Error:", np.sqrt(mse_lr))
    print("Mean Absolute Error:", mean_absolute_error(y_test, y_pred))
    print("R-squared Score:", r2_score(y_test, y_pred))

    # Convert burn rate to binary classification
    y_test_binary = (y_test > 0.5).astype(int)
    y_pred_binary = (y_pred > 0.5).astype(int)

    # Calculate additional metrics for Linear Regression
    print("\nLinear Regression Model Additional Metrics:")
    print("Accuracy:", accuracy_score(y_test_binary, y_pred_binary))
    print("Precision:", precision_score(y_test_binary, y_pred_binary))
    print("Recall:", recall_score(y_test_binary, y_pred_binary))
    print("F1 Score:", f1_score(y_test_binary, y_pred_binary))

    with open(os.path.join(models_dir, 'linear_regression.pkl'), 'wb') as model_file:
        pickle.dump(linear_regression_model, model_file)

    # Print feature names
    feature_names = X.columns.tolist()
    print("\nFeature names used:", feature_names)

if __name__ == "__main__":
    train_models()


