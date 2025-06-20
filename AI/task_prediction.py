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
            SELECT category, priority, estimated_time, start_time, actual_time, time_taken, user_id
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

# Load and merge data
df_db = fetch_task_data()
df_csv = load_csv_data()
df = pd.concat([df_db, df_csv], ignore_index=True)

# Filter allowed categories
df = df[df["category"].isin(ALLOWED_CATEGORIES)]

# Convert and clean time values
df["time_taken"] = df["time_taken"].apply(convert_to_minutes)
df["estimated_time"] = pd.to_numeric(df["estimated_time"], errors="coerce")
df["time_taken"] = pd.to_numeric(df["time_taken"], errors="coerce")

# Fill missing time fields with median
df["estimated_time"].fillna(df["estimated_time"].median(), inplace=True)
df["time_taken"].fillna(df["time_taken"].median(), inplace=True)

# Remove outliers
df["time_taken"] = df["time_taken"].clip(lower=1, upper=1000)
df["estimated_time"] = df["estimated_time"].clip(lower=1, upper=1000)

# Extract hour from start_time
df["start_time_hour"] = pd.to_datetime(df["start_time"], errors="coerce").dt.hour
df["start_time_hour"].fillna(df["start_time_hour"].median(), inplace=True)

# Encode categories
combined_categories = pd.concat([df["category"], pd.Series(ALLOWED_CATEGORIES)], ignore_index=True)
label_encoder = LabelEncoder()
label_encoder.fit(combined_categories)
df["category_encoded"] = label_encoder.transform(df["category"])

# Add fallback row for unseen user
fallback_user_id = -1
if fallback_user_id not in df["user_id"].values:
    fallback_row = {
        "category": "General",
        "priority": 2,
        "estimated_time": 60,
        "start_time": pd.Timestamp("2025-01-01 12:00:00"),
        "time_taken": df["time_taken"].median(),
        "user_id": fallback_user_id,
        "start_time_hour": 12,
        "category_encoded": label_encoder.transform(["General"])[0]
    }
    df = pd.concat([df, pd.DataFrame([fallback_row])], ignore_index=True)

# Encode user_id
user_encoder = LabelEncoder()
df["user_encoded"] = user_encoder.fit_transform(df["user_id"])

# Drop rows with any invalid required features
df.dropna(subset=["category_encoded", "priority", "estimated_time", "start_time_hour", "time_taken", "user_encoded"], inplace=True)

# Save list of seen user_ids
seen_user_ids = df["user_id"].unique().tolist()
joblib.dump(seen_user_ids, "seen_user_ids.pkl")

# Prepare input and output for model
feature_cols = ["category_encoded", "priority", "estimated_time", "start_time_hour", "user_encoded"]
X = df[feature_cols]
y = df["time_taken"]

# Validate data
if X.isnull().any().any() or np.isinf(X.values).any():
    raise ValueError("❌ X contains NaN or Inf")
if y.isnull().any() or np.isinf(y.values).any():
    raise ValueError("❌ y contains NaN or Inf")

# Scale input features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Scale output
time_scaler = StandardScaler()
y_scaled = time_scaler.fit_transform(y.values.reshape(-1, 1))

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_scaled, test_size=0.2, random_state=42)

# Build and train model
model = keras.Sequential([
    keras.layers.Input(shape=(5,)),
    keras.layers.Dense(32, activation="relu"),
    keras.layers.Dense(16, activation="relu"),
    keras.layers.Dense(1)
])
model.compile(optimizer="adam", loss="mse", metrics=["mae"])
model.fit(X_train, y_train, validation_data=(X_test, y_test), epochs=50, batch_size=8)

# Save model and preprocessing tools
model.save("task_prediction_model.keras")
joblib.dump(scaler, "feature_scaler.pkl")
joblib.dump(label_encoder, "category_encoder.pkl")
joblib.dump(time_scaler, "time_scaler.pkl")
joblib.dump(user_encoder, "user_encoder.pkl")

# Final log
print(f"📊 Final dataset shape: {df.shape}")
print(f"🔍 Input feature count: {X.shape[1]}")
print(f"✅ Model trained & saved with {len(X_train)} training samples and {len(X_test)} test samples.")
