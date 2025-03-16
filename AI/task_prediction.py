import os
import re
import tensorflow as tf
from tensorflow import keras
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("SQLALCHEMY_DATABASE_URI")

# ✅ Connect to the database
engine = create_engine(DATABASE_URL)

def fetch_task_data():
    query = text("""
        SELECT category, priority, estimated_time, start_time, actual_time, time_taken 
        FROM PersonalTasks 
        WHERE actual_time IS NOT NULL AND start_time IS NOT NULL
    """)
    with engine.connect() as conn:
        result = conn.execute(query).fetchall()

    df = pd.DataFrame(result, columns=['category', 'priority', 'estimated_time', 'start_time', 'actual_time', 'time_taken'])

    # ✅ Convert 'time_taken' to total minutes (if available)
    def convert_time(text):
        if not isinstance(text, str) or not text.strip():
            return None
        hours, minutes = 0, 0
        match_hours = re.search(r'(\d+)\s*hours?', text)
        match_minutes = re.search(r'(\d+)\s*minutes?', text)
        if match_hours:
            hours = int(match_hours.group(1))
        if match_minutes:
            minutes = int(match_minutes.group(1))
        return (hours * 60) + minutes

    df["time_taken_minutes"] = df["time_taken"].apply(convert_time)

    # ✅ Convert 'actual_time' and 'start_time' to timestamps
    df["start_time"] = pd.to_datetime(df["start_time"])
    df["actual_time"] = pd.to_datetime(df["actual_time"])

    # ✅ Drop rows where start_time or actual_time is missing
    df.dropna(subset=["start_time", "actual_time"], inplace=True)

    # ✅ Calculate `total_time_minutes`
    df["total_time_minutes"] = df["time_taken_minutes"].fillna(
        (df["actual_time"] - df["start_time"]).dt.total_seconds() / 60
    )

    # ✅ Handle missing estimated_time (Replace NULL with actual duration)
    df["estimated_time"] = df["estimated_time"].fillna(df["total_time_minutes"])

    # ✅ Extract start hour feature
    df["start_time_hour"] = df["start_time"].dt.hour

    # ✅ Drop remaining missing values
    df.dropna(inplace=True)

    return df

# ✅ Load data
df = fetch_task_data()

# ✅ Print features before training
print("Training Features:", df.columns.tolist())

# ✅ Check if df is empty before processing
if df.empty:
    raise ValueError("❌ No data found in the database. Ensure 'PersonalTasks' table has valid task records.")

# ✅ Print sample data to confirm it's loaded
print("Sample Data Loaded:\n", df.head())

# ✅ Get all unique categories from the database
all_categories = df["category"].unique().tolist()

# ✅ Train LabelEncoder on all known categories
encoder = LabelEncoder()
encoder.fit(all_categories)  # Train encoder on all categories
df["category_encoded"] = encoder.transform(df["category"])

# ✅ Define Feature Columns
X_features = ["category_encoded", "priority", "estimated_time", "start_time_hour"]

# ✅ Scale Input Features Properly
X_scaler = StandardScaler()
X_scaled = X_scaler.fit_transform(df[X_features])

# ✅ Debug: Print Scaler Shape
print(f"✅ Feature Scaler Trained with {X_scaler.n_features_in_} Features!")  # Expect 4

# ✅ Scale target variable (total time taken)
y_scaler = StandardScaler()
y_scaled = y_scaler.fit_transform(df["total_time_minutes"].values.reshape(-1, 1))

# ✅ Train-test split
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_scaled, test_size=0.2, random_state=42)

# ✅ Build & Train Model
model = keras.Sequential([
    keras.layers.Input(shape=(len(X_features),)),  # Ensure input shape matches 4 features
    keras.layers.Dense(64, activation='relu'),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dense(16, activation='relu'),
    keras.layers.Dense(1)
])

model.compile(optimizer=keras.optimizers.Adam(learning_rate=0.001), loss='mse', metrics=['mae'])
model.fit(X_train, y_train, epochs=50, batch_size=16, validation_data=(X_test, y_test), verbose=1)

# ✅ Save model & encoders
os.makedirs("AI", exist_ok=True)
model.save("AI/task_prediction_model.keras")
joblib.dump(encoder, "AI/category_encoder.pkl")
joblib.dump(X_scaler, "AI/feature_scaler.pkl")
joblib.dump(y_scaler, "AI/time_scaler.pkl")

print(f"✅ Model and encoders saved successfully with {X_scaler.n_features_in_} input features!")
print(encoder.classes_)
