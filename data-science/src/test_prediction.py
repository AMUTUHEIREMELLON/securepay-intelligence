from predict_fraud import predict_fraud


# Test 1: Normal transaction
normal_result = predict_fraud(
    amount=50000,
    hour=14,
    failed_attempts=0,
    payment_method="Mobile Money",
    location="Mbarara",
    device="Android"
)

print("NORMAL TRANSACTION")
print("Prediction:", normal_result["prediction"])
print("Risk score:", normal_result["risk_score"])
print("Status:", normal_result["status"])


print("\n" + "-" * 40 + "\n")


# Test 2: High-risk transaction
suspicious_result = predict_fraud(
    amount=480000,
    hour=2,
    failed_attempts=0,
    payment_method="Card",
    location="Kampala",
    device="Android"
)

print("HIGH-RISK TRANSACTION")
print("Prediction:", suspicious_result["prediction"])
print("Risk score:", suspicious_result["risk_score"])
print("Status:", suspicious_result["status"])


print("\n" + "-" * 40 + "\n")


# Test 3: Failed transaction
failed_result = predict_fraud(
    amount=100000,
    hour=15,
    failed_attempts=4,
    payment_method="Bank Transfer",
    location="Gulu",
    device="Web"
)

print("FAILED TRANSACTION")
print("Prediction:", failed_result["prediction"])
print("Risk score:", failed_result["risk_score"])
print("Status:", failed_result["status"])