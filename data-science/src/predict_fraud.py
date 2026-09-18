import pandas as pd
import joblib
import os


# Get the location of this Python file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load the saved model
model = joblib.load(
    os.path.join(BASE_DIR, "models", "fraud_detection_model.pkl")
)

# Load the saved feature information
feature_info = joblib.load(
    os.path.join(BASE_DIR, "models", "feature_info.pkl")
)

features = feature_info["features"]


def predict_fraud(
    amount,
    hour,
    failed_attempts,
    payment_method,
    location,
    device
):
    # Create an empty transaction with all required features
    transaction = pd.DataFrame(0, index=[0], columns=features)

    # Add numerical values
    transaction["amount"] = amount
    transaction["hour"] = hour
    transaction["failed_attempts"] = failed_attempts

    # Add payment method
    payment_column = f"payment_method_{payment_method}"
    if payment_column in transaction.columns:
        transaction[payment_column] = 1

    # Add location
    location_column = f"location_{location}"
    if location_column in transaction.columns:
        transaction[location_column] = 1

    # Add device
    device_column = f"device_{device}"
    if device_column in transaction.columns:
        transaction[device_column] = 1

    # Make prediction
    prediction = model.predict(transaction)[0]

    # Get fraud probability
    risk_score = model.predict_proba(transaction)[0][1]

    # Determine status
    if failed_attempts >= 3:
        status = "Failed"
    elif risk_score >= 0.30:
        status = "Suspicious"
    else:
        status = "Successful"

    return {
        "prediction": int(prediction),
        "risk_score": round(float(risk_score), 4),
        "status": status
    }

