import requests
import joblib
url = "http://127.0.0.1:5000/predict"
data = {
    "category": "coding",
    "priority": 2,
    "estimated_time": 60,
    "start_time": "2025-03-15T10:00:00"
}

response = requests.post(url, json=data)
print(response.json())  # Display the prediction response
