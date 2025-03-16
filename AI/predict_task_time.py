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

