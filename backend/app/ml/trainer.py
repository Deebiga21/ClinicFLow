import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.clinicflow

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

async def train_wait_time_model():
    print("Training Wait Time Model...")
    cursor = db.ml_historical_queue.find({})
    docs = await cursor.to_list(length=None)
    
    if not docs:
        print("No historical queue data found.")
        return
        
    df = pd.DataFrame(docs)
    
    # Features: hour_of_day, day_of_week, queue_length_at_arrival, active_doctors
    # Target: actual_wait_time_mins
    X = df[['hour_of_day', 'day_of_week', 'queue_length_at_arrival', 'active_doctors']]
    y = df['actual_wait_time_mins']
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    joblib.dump(model, os.path.join(MODELS_DIR, "wait_time_model.pkl"))
    print(f"Wait Time Model trained on {len(df)} samples and saved.")

async def train_consultation_model():
    print("Training Consultation Duration Model...")
    cursor = db.ml_historical_consultations.find({})
    docs = await cursor.to_list(length=None)
    
    if not docs:
        print("No historical consultation data found.")
        return
        
    df = pd.DataFrame(docs)
    
    # We need to encode categorical variables: doctor, visit_type
    le_doctor = LabelEncoder()
    le_visit = LabelEncoder()
    
    df['doctor_encoded'] = le_doctor.fit_transform(df['doctor'])
    df['visit_type_encoded'] = le_visit.fit_transform(df['visit_type'])
    
    # Save encoders
    joblib.dump(le_doctor, os.path.join(MODELS_DIR, "le_doctor.pkl"))
    joblib.dump(le_visit, os.path.join(MODELS_DIR, "le_visit.pkl"))
    
    # Features: doctor_encoded, visit_type_encoded, patient_age
    # Target: actual_duration_mins
    X = df[['doctor_encoded', 'visit_type_encoded', 'patient_age']]
    y = df['actual_duration_mins']
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    joblib.dump(model, os.path.join(MODELS_DIR, "consultation_model.pkl"))
    print(f"Consultation Model trained on {len(df)} samples and saved.")

async def main():
    await train_wait_time_model()
    await train_consultation_model()

if __name__ == "__main__":
    asyncio.run(main())
