import pandas as pd
import numpy as np
from sqlalchemy import create_engine
import datetime
import os

class FeatureEngineer:
    def __init__(self, db_url="sqlite:///d:/clinic-queue -updated/core_backend/clinic_core_v2.db"):
        # The script is often run from core_backend/ml directory
        if not os.path.exists("../clinic_core_v2.db") and os.path.exists("clinic_core_v2.db"):
            db_url = "sqlite:///d:/clinic-queue -updated/core_backend/clinic_core_v2.db"
        elif not os.path.exists("../clinic_core_v2.db") and os.path.exists("core_backend/clinic_core_v2.db"):
            db_url = "sqlite:///core_backend/clinic_core_v2.db"
            
        self.engine = create_engine(db_url)

    def load_queue_data(self):
        query = """
            SELECT q.*, a.appointment_type, 
                   d.average_consultation_duration
            FROM queue_entries q
            JOIN appointments a ON q.appointment_id = a.id
            JOIN doctors d ON q.doctor_id = d.id
        """
        return pd.read_sql(query, self.engine)

    def build_waiting_time_features(self):
        df = self.load_queue_data()
        df['entered_queue_at'] = pd.to_datetime(df['entered_queue_at'], format='mixed', errors='coerce')
        df['called_at'] = pd.to_datetime(df['called_at'], format='mixed', errors='coerce')
        
        # Target
        # Only for training when called_at is available
        # But wait, actual_wait_minutes is already calculated in DB!
        target = df['actual_wait_minutes']
        
        # Features
        features = pd.DataFrame()
        features['patients_ahead'] = df['queue_position'] - 1
        features['queue_length'] = df['queue_position']
        # mock doctor workload as patients ahead * average duration
        features['doctor_workload'] = features['patients_ahead'] * df['average_consultation_duration']
        features['historical_consultation_duration'] = df['average_consultation_duration']
        
        # Time-based
        features['hour'] = df['entered_queue_at'].dt.hour
        features['day_of_week'] = df['entered_queue_at'].dt.dayofweek
        
        # Categorical
        features['appointment_type'] = df['appointment_type']
        
        # One-hot encoding for simplicity here, though XGBoost can handle categorical natively
        features = pd.get_dummies(features, columns=['appointment_type'])
        
        return features, target, df

    def build_consultation_features(self):
        query = """
            SELECT q.*, a.appointment_type, d.average_consultation_duration
            FROM queue_entries q
            JOIN appointments a ON q.appointment_id = a.id
            JOIN doctors d ON q.doctor_id = d.id
            WHERE q.consultation_started_at IS NOT NULL AND q.consultation_completed_at IS NOT NULL
        """
        df = pd.read_sql(query, self.engine)
        df['consultation_started_at'] = pd.to_datetime(df['consultation_started_at'], format='mixed', errors='coerce')
        df['consultation_completed_at'] = pd.to_datetime(df['consultation_completed_at'], format='mixed', errors='coerce')
        
        features = pd.DataFrame()
        features['historical_duration'] = df['average_consultation_duration']
        features['hour'] = df['consultation_started_at'].dt.hour
        features['day_of_week'] = df['consultation_started_at'].dt.dayofweek
        
        target = (df['consultation_completed_at'] - df['consultation_started_at']).dt.total_seconds() / 60.0
        
        features['appointment_type'] = df['appointment_type']
        features = pd.get_dummies(features, columns=['appointment_type'])
        
        return features, target, df

    def build_no_show_features(self):
        query = """
            SELECT a.*, p.created_at as patient_created
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
        """
        df = pd.read_sql(query, self.engine)
        df['appointment_date'] = pd.to_datetime(df['appointment_date'], format='mixed', errors='coerce')
        df['created_at'] = pd.to_datetime(df['created_at'], format='mixed', errors='coerce')
        
        # We don't have previous no-show counts easily in v2 without window functions, just use basic ones
        features = pd.DataFrame()
        
        # Lead time: days between created_at and appointment_date
        features['lead_time_days'] = (df['appointment_date'] - df['created_at']).dt.total_seconds() / 86400.0
        features['day_of_week'] = df['appointment_date'].dt.dayofweek
        
        try:
            features['hour'] = pd.to_datetime(df['appointment_time'], format='%H:%M').dt.hour
        except:
            # handle cases where format varies
            features['hour'] = 10 
        
        target = df['no_show'].fillna(0).astype(int)
        
        return features, target, df
