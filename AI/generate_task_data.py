import os
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from tensorflow import keras
import joblib
from datetime import datetime

app = Flask(__name__)

# ✅ Use relative paths based on script's location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "task_prediction_model.keras")
category_encoder_path = os.path.join(BASE_DIR, "category_encoder.pkl")
feature_scaler_path = os.path.join(BASE_DIR, "feature_scaler.pkl")
time_scaler_path = os.path.join(BASE_DIR, "time_scaler.pkl")
user_encoder_path = os.path.join(BASE_DIR, "user_encoder.pkl")

# ✅ Load model and encoders
print("📌 Checking AI Model and Encoders Before Loading...")

print("🔄 Loading AI model...")
model = keras.models.load_model(model_path)
print("✅ Model loaded successfully!")

print("🔄 Loading category encoder...")
category_encoder = joblib.load(category_encoder_path)
print("✅ Category Encoder Loaded!")

print("🔄 Loading feature scaler...")
feature_scaler = joblib.load(feature_scaler_path)
print(f"✅ Feature Scaler Loaded! Expected Features: {len(feature_scaler.mean_)}")

print("🔄 Loading time scaler...")
time_scaler = joblib.load(time_scaler_path)
print("✅ Time Scaler Loaded!")

print("🔄 Loading user encoder...")
user_encoder = joblib.load(user_encoder_path)
print("✅ User Encoder Loaded!")

print("✅ AI Model and Encoders Loaded Successfully!")
