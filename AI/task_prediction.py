import os
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow import keras
from sqlalchemy import create_engine
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib

# ✅ Database connection
SQLALCHEMY_DATABASE_URI = "mssql+pyodbc://database:task1234!@takmanager.database.windows.net:1433/TaskManager?driver=ODBC+Driver+17+for+SQL+Server"
engine = create_engine(SQLALCHEMY_DATABASE_URI)

csv_path = r"C:\Users\alabr\Desktop\TaskManager\AI\task_data.csv"
ALLOWED_CATEGORIES = ["General", "coding", "writing", "reading", "exercising"]

def fetch_task_data():
    try:
        query = """
            SELECT category, priority, estimated_time, start_time, actual_time, time_taken
            FROM PersonalTasks
            WHERE actual_time IS NOT NULL AND time_taken IS NOT NULL
        """
        return pd.read_sql(query, engine)
    except Exception as e:
        print(f"⚠️ DB error: {e}")
        return pd.DataFrame()

def load_csv_data():
    return pd.read_csv(csv_path) if os.path.exists(csv_path) else pd.DataFrame()

def convert_to_minutes(time_str):
    if isinstance(time_str, str):
        minutes = 0
        parts = time_str.split()
        for i in range(len(parts)):
            if "hour" in parts[i]:
                minutes += int(parts[i - 1]) * 60
            elif "minute" in parts[i]:
                minutes += int(parts[i - 1])
        return minutes
    return time_str

# Load and filter data
df = pd.concat([fetch_task_data(), load_csv_data()], ignore_index=True)
df = df[df["category"].isin(ALLOWED_CATEGORIES)]

df["time_taken"] = df["time_taken"].apply(convert_to_minutes)
df["estimated_time"] = pd.to_numeric(df["estimated_time"], errors="coerce").fillna(df["estimated_time"].median())
df["time_taken"] = pd.to_numeric(df["time_taken"], errors="coerce").fillna(df["time_taken"].median())

# Optionally remove extreme outliers
df = df[df["time_taken"] <= 1000]

# Extract additional features
df["start_time_hour"] = pd.to_datetime(df["start_time"]).dt.hour

# Encode category
label_encoder = LabelEncoder()
df["category_encoded"] = label_encoder.fit_transform(df["category"])

# Define input features and target
feature_cols = ["category_encoded", "priority", "estimated_time", "start_time_hour"]
X = df[feature_cols]
y = df["time_taken"]  # Raw target in minutes

# Scale only input features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ----- NEW: Scale the target variable -----
time_scaler = StandardScaler()
y_scaled = time_scaler.fit_transform(y.values.reshape(-1, 1))
# -------------------------------------------

# Split data
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_scaled, test_size=0.2, random_state=42)

# Build & train model on scaled target
model = keras.Sequential([
    keras.layers.Input(shape=(4,)),
    keras.layers.Dense(32, activation="relu"),
    keras.layers.Dense(16, activation="relu"),
    keras.layers.Dense(1)
])
model.compile(optimizer="adam", loss="mse", metrics=["mae"])
model.fit(X_train, y_train, validation_data=(X_test, y_test), epochs=50, batch_size=8)

# Save the model and preprocessing objects
model.save("task_time_model.keras")
joblib.dump(scaler, "scaler.pkl")
joblib.dump(label_encoder, "label_encoder.pkl")
joblib.dump(time_scaler, "time_scaler.pkl")

print(f"✅ Model trained & saved with {len(X_train)} training samples.")
