import os
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score, precision_score, recall_score, f1_score

def train_models():
    # Read the data
    data = pd.read_csv('train.csv')

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

    # Create models directory if it doesn't exist
    os.makedirs('models', exist_ok=True)

    # Save the scaler
    with open('models/scaler.pkl', 'wb') as scaler_file:
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

    # Save the linear regression model
    with open('models/linear_regression.pkl', 'wb') as model_file:
        pickle.dump(linear_regression_model, model_file)

    # Print feature names
    feature_names = X.columns.tolist()
    print("\nFeature names used:", feature_names)

if __name__ == "__main__":
    train_models()


