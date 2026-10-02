
import json
import sys

from predict_fraud import predict_fraud

def main():
    transaction = json.loads(sys.argv[1])

    result = predict_fraud(
        amount=float(transaction["amount"]),
        hour=int(transaction["hour"]),
        failed_attempts=int(transaction["failed_attempts"]),
        payment_method=transaction["payment_method"],
        location=transaction["location"],
        device=transaction["device"]
    )

    print(json.dumps(result))

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
