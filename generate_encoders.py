import joblib
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler

# Define valid categories
categories = ["coding", "reading", "writing", "exercising", "General"]

# ✅ Encode categories
category_encoder = LabelEncoder()
category_encoder.fit(categories)

# ✅ Scale encoded categories
category_encoded = category_encoder.transform(categories).reshape(-1, 1)
category_scaler = StandardScaler()
category_scaler.fit(category_encoded)

# ✅ Scale task time (Assuming task time varies from 30 to 240 minutes)
time_scaler = StandardScaler()
time_scaler.fit(np.array([[30], [60], [120], [180], [240]]))  # Example task durations

# ✅ Save encoders and scalers
joblib.dump(category_encoder, "AI/category_encoder.pkl")
joblib.dump(category_scaler, "AI/category_scaler.pkl")
joblib.dump(time_scaler, "AI/time_scaler.pkl")

print("✅ Encoders and scalers regenerated successfully!")
