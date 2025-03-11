import tensorflow as tf
import joblib
import numpy as np

# Define custom objects (needed to load the model correctly)
custom_objects = {
    "mse": tf.keras.losses.MeanSquaredError()
}

# Load the saved model and scaler
model = tf.keras.models.load_model("task_prediction_model.h5", custom_objects=custom_objects)
scaler = joblib.load("scaler.pkl")

def predict_task_time(priority):
    """Predicts estimated task completion time based on priority."""
    priority = np.array([[priority]])  # Ensure correct shape
    predicted_time_scaled = model.predict(priority)
    predicted_time = scaler.inverse_transform(predicted_time_scaled)[0][0]  # Convert back to minutes
    return round(predicted_time, 2)  # Return rounded value

# Example Test
if __name__ == "__main__":
    test_priority = 2  # Change this value to test different priorities
    prediction = predict_task_time(test_priority)
    print(f"Predicted estimated time for priority {test_priority}: {prediction} minutes")
