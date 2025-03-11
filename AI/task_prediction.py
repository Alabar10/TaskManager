import tensorflow as tf
from tensorflow import keras
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib  # For saving the trained model

# Generate sample data
num_samples = 1000
priority_levels = [1, 2, 3, 4]  # Priority categories
np.random.seed(42)

# Create synthetic dataset
data = {
    "priority": np.random.choice(priority_levels, num_samples),
    "historical_avg_time": np.random.randint(30, 240, num_samples),  # Time in minutes
}

# Target variable: Estimated time to complete the task
data["estimated_time"] = (
    data["historical_avg_time"] * (1 + 0.1 * np.random.randn(num_samples))
).astype(int)

# Convert to DataFrame
df = pd.DataFrame(data)

# Split data into training and testing sets
X = df[["priority"]].values  # Input feature (priority)
y = df["estimated_time"].values  # Target (estimated time)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Normalize target variable (helps with training stability)
scaler = StandardScaler()
y_train_scaled = scaler.fit_transform(y_train.reshape(-1, 1))
y_test_scaled = scaler.transform(y_test.reshape(-1, 1))

# Build the neural network model
model = keras.Sequential([
    keras.layers.Dense(16, activation='relu', input_shape=(1,)),  # Input layer (1 feature: priority)
    keras.layers.Dense(8, activation='relu'),  # Hidden layer
    keras.layers.Dense(1)  # Output layer (Predicted estimated time)
])

# Compile the model
model.compile(optimizer='adam', loss='mse', metrics=['mae'])

# Train the model
model.fit(X_train, y_train_scaled, epochs=50, batch_size=16, validation_data=(X_test, y_test_scaled), verbose=1)

# Evaluate the model
loss, mae = model.evaluate(X_test, y_test_scaled, verbose=1)
mae_original_scale = scaler.inverse_transform([[mae]])[0][0]  # Convert back to original scale

print(f"Model Evaluation - Mean Absolute Error (MAE): {mae_original_scale:.2f} minutes")

# Save the trained model and scaler
model.save("task_prediction_model.h5")
joblib.dump(scaler, "scaler.pkl")

print("Model and scaler saved successfully!")
