import tensorflow as tf
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
import os

# ✅ Correct Model Path
MODEL_PATH = os.path.abspath("AI/task_prediction_model.keras")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError("❌ Model file not found at AI/task_prediction_model.keras. Run `python task_prediction.py` first.")

# ✅ Load the trained model
model = tf.keras.models.load_model(MODEL_PATH)

# ✅ Load encoders and scalers
category_encoder = joblib.load("AI/category_encoder.pkl")
feature_scaler = joblib.load("AI/feature_scaler.pkl")
time_scaler = joblib.load("AI/time_scaler.pkl")

# ✅ Initialize Flask app
app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict_task_time():
    try:
        data = request.get_json()
        print(f"🔍 Incoming data: {data}")

        # ✅ Extract inputs with validation
        category = data.get("category")
        priority = data.get("priority")
        estimated_time = data.get("estimated_time")
        start_time = data.get("start_time")

        if not all([category, priority, estimated_time, start_time]):
            return jsonify({"error": "Missing required fields: category, priority, estimated_time, start_time"}), 400

        try:
            priority = int(priority)
            estimated_time = float(estimated_time)
            start_time_hour = pd.to_datetime(start_time).hour  # ✅ Fix: Use start_time_hour
        except ValueError:
            return jsonify({"error": "Invalid data type for priority, estimated_time, or start_time"}), 400

        # ✅ Encode category
        if category not in category_encoder.classes_:
            return jsonify({"error": f"Unknown category: {category}. Available: {list(category_encoder.classes_)}"}), 400

        category_encoded = category_encoder.transform([category])[0]

        # ✅ Prepare input data
        input_data = np.array([[category_encoded, priority, estimated_time, start_time_hour]])
        print(f"🔍 Processed Input Data: {input_data}")

        # ✅ Convert to DataFrame with correct column names
        input_data_df = pd.DataFrame(input_data, columns=["category_encoded", "priority", "estimated_time", "start_time_hour"])

        # ✅ Ensure the feature scaler has the correct column names
        input_data_scaled = feature_scaler.transform(input_data_df)

        print(f"🔍 Scaled Input Data: {input_data_scaled}")

        # ✅ Make Prediction
        predicted_time_scaled = model.predict(input_data_scaled)
        predicted_time = time_scaler.inverse_transform(predicted_time_scaled.reshape(-1, 1))[0][0]

        # ✅ Convert to standard float
        predicted_time = float(predicted_time)
        print(f"✅ Predicted Time (Minutes): {predicted_time}")

        return jsonify({
            "predicted_time_minutes": round(predicted_time, 2),
            "predicted_time_hours": round(predicted_time / 60, 2)
        })

    except Exception as e:
        print(f"❌ Error during prediction: {str(e)}")
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)
