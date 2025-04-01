import os
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow import keras
from sqlalchemy import create_engine
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib

# ✅ Database connection to Azure SQL Server
SQLALCHEMY_DATABASE_URI = "mssql+pyodbc://database:task1234!@takmanager.database.windows.net:1433/TaskManager?driver=ODBC+Driver+17+for+SQL+Server"
engine = create_engine(SQLALCHEMY_DATABASE_URI)

# ✅ Path to CSV file
csv_path = r"C:\Users\alabr\Desktop\TaskManager\AI\task_data.csv"

# ✅ Allowed categories
ALLOWED_CATEGORIES = ["General", "coding", "writing", "reading", "exercising"]

# ✅ Function to fetch data from the database
def fetch_task_data():
    try:
        query = """
            SELECT category, priority, estimated_time, start_time, actual_time, time_taken
            FROM PersonalTasks
            WHERE actual_time IS NOT NULL AND time_taken IS NOT NULL
        """
        df_db = pd.read_sql(query, engine)
    except Exception as e:
        print(f"⚠️ Warning: Could not load data from database. Error: {e}")
        df_db = pd.DataFrame()  # Empty DataFrame if query fails

    return df_db

# ✅ Function to load CSV data
def load_csv_data():
    if os.path.exists(csv_path):
        df_csv = pd.read_csv(csv_path)
    else:
        print(f"⚠️ Warning: CSV file not found at {csv_path}")
        df_csv = pd.DataFrame()  # Empty DataFrame if file missing

    return df_csv

# ✅ Load both database and CSV data
df_db = fetch_task_data()
df_csv = load_csv_data()

# ✅ Combine both datasets
df = pd.concat([df_db, df_csv], ignore_index=True)

# ✅ Filter only the allowed categories
df = df[df["category"].isin(ALLOWED_CATEGORIES)]

# ✅ Convert time_taken to minutes if it's not already numeric
def convert_time_to_minutes(time_str):
    if isinstance(time_str, str):
        parts = time_str.split()
        minutes = 0
        for i in range(len(parts)):
            if "hour" in parts[i]:
                minutes += int(parts[i-1]) * 60
            elif "minute" in parts[i]:
                minutes += int(parts[i-1])
        return minutes
    return time_str

df["time_taken"] = df["time_taken"].apply(convert_time_to_minutes)

# ✅ Handle missing values
df["estimated_time"] = df["estimated_time"].infer_objects(copy=False).fillna(df["estimated_time"].median())
df["time_taken"] = df["time_taken"].fillna(df["time_taken"].median())

# ✅ Encode categorical labels
label_encoder = LabelEncoder()
df["category"] = label_encoder.fit_transform(df["category"])

# ✅ Normalize numerical features
scaler = StandardScaler()
try:
    df[["priority", "estimated_time", "time_taken"]] = scaler.fit_transform(df[["priority", "estimated_time", "time_taken"]])
except ValueError as e:
    print(f"❌ ERROR: Not enough data for scaling. Skipping training. {e}")
    exit()

# ✅ Split data into training and testing sets
X = df[["category", "priority", "estimated_time", "time_taken"]]
y = df["time_taken"]  # Target is time_taken

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ✅ Build model
model = keras.Sequential([
    keras.layers.Dense(16, activation="relu", input_shape=(4,)),
    keras.layers.Dense(8, activation="relu"),
    keras.layers.Dense(1)
])

model.compile(optimizer="adam", loss="mse", metrics=["mae"])

# ✅ Train model
model.fit(X_train, y_train, validation_data=(X_test, y_test), epochs=50, batch_size=4)

# ✅ Save model and encoders
model.save("task_time_model.keras")  # Modern Keras format
joblib.dump(scaler, "scaler.pkl")
joblib.dump(label_encoder, "label_encoder.pkl")

print(f"✅ Model trained & saved successfully with {len(X_train)} training samples!")
