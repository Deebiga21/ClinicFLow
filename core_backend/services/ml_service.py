import os
import joblib
import pandas as pd
import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

class MLService:
    def __init__(self, db_url="sqlite:///clinic_core_v2.db"):
        self.engine = create_engine(db_url)
        self.Session = sessionmaker(bind=self.engine)
        self.base_path = os.path.join(os.path.dirname(__file__), '..', 'saved_models')
        
    def _load_model(self, model_name_db, pkl_name):
        # Check DB first
        with self.Session() as session:
            res = session.execute(text(f"SELECT model_path FROM model_versions WHERE model_name = '{model_name_db}' ORDER BY training_date DESC LIMIT 1")).fetchone()
            if res and res[0] and os.path.exists(res[0]):
                return joblib.load(res[0])
            
        # Fallback to saved_models
        fallback_path = os.path.join(self.base_path, pkl_name)
        if os.path.exists(fallback_path):
            return joblib.load(fallback_path)
            
        return None

    def _align_features(self, df, required_columns):
        for col in required_columns:
            if col not in df.columns:
                df[col] = 0
        return df[required_columns]

    def get_waiting_time_prediction(self, queue_id):
        model = self._load_model('waiting_time_model', 'waiting_time_model.pkl')
        cols = self._load_model('waiting_time_columns', 'waiting_time_columns.pkl')
        
        if not model or not cols:
            return {"status": "NOT_TRAINED"}
            
        with self.Session() as session:
            q_res = session.execute(text(f"SELECT appointment_id, patient_id, doctor_id, queue_position FROM queue_entries WHERE id = '{queue_id}'")).fetchone()
            if not q_res:
                return {"status": "INSUFFICIENT_DATA", "reason": "Queue entry not found"}
                
            appt_id, pat_id, doc_id, q_pos = q_res
            
            ahead = q_pos - 1
            hist_dur = session.execute(text(f"SELECT average_consultation_duration FROM doctors WHERE id = '{doc_id}'")).scalar() or 15.0
            appt_type = session.execute(text(f"SELECT appointment_type FROM appointments WHERE id = '{appt_id}'")).scalar() or 'Routine'
            
            now = datetime.datetime.now()
            df = pd.DataFrame([{
                'patients_ahead': ahead,
                'queue_length': ahead + 1,
                'doctor_workload': ahead * hist_dur,
                'historical_consultation_duration': hist_dur,
                'hour': now.hour,
                'day_of_week': now.weekday()
            }])
            df[f'appointment_type_{appt_type}'] = 1
            df = self._align_features(df, cols)
            
            pred = float(model.predict(df)[0])
            
            shap_data = {"natural_explanation": "Explanation unavailable."}
            try:
                import shap
                explainer = shap.TreeExplainer(model)
                shap_vals = explainer.shap_values(df)
                
                base_value = float(explainer.expected_value) if not isinstance(explainer.expected_value, list) else float(explainer.expected_value[0])
                contributions = []
                for i, col in enumerate(cols):
                    val = float(shap_vals[0][i])
                    if abs(val) > 0.1:
                        contributions.append({
                            "feature": col,
                            "contribution": val,
                            "value": float(df.iloc[0][i])
                        })
                
                contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
                if contributions:
                    top_feature = contributions[0]['feature'].replace('_', ' ')
                    direction = "increasing" if contributions[0]['contribution'] > 0 else "decreasing"
                    shap_data["natural_explanation"] = f"The estimated waiting time is mainly influenced by the {top_feature}, {direction} your wait."
                    shap_data["base_value"] = base_value
                    shap_data["contributions"] = contributions
            except Exception as e:
                import traceback
                traceback.print_exc()
                shap_data["error"] = str(e)

            return {"status": "SUCCESS", "predicted_waiting_time": pred, "queue_id": queue_id, "shap": shap_data}

    def get_consultation_duration_prediction(self, appointment_id):
        model = self._load_model('consultation_duration_model', 'consultation_duration_model.pkl')
        cols = self._load_model('consultation_duration_columns', 'consultation_duration_columns.pkl')
        
        if not model or not cols:
            return {"status": "NOT_TRAINED"}
            
        with self.Session() as session:
            res = session.execute(text(f"SELECT doctor_id FROM appointments WHERE id = '{appointment_id}'")).fetchone()
            if not res:
                return {"status": "INSUFFICIENT_DATA", "reason": "Appointment not found"}
            
            doc_id = res[0]
            hist_dur = session.execute(text(f"SELECT average_consultation_duration FROM doctors WHERE id = '{doc_id}'")).scalar() or 15.0
            
            now = datetime.datetime.now()
            df = pd.DataFrame([{
                'historical_duration': hist_dur,
                'hour': now.hour,
                'day_of_week': now.weekday()
            }])
            df = self._align_features(df, cols)
            
            pred = float(model.predict(df)[0])
            
            shap_data = {"natural_explanation": "Explanation unavailable."}
            try:
                import shap
                explainer = shap.TreeExplainer(model)
                shap_vals = explainer.shap_values(df)
                
                base_value = float(explainer.expected_value) if not isinstance(explainer.expected_value, list) else float(explainer.expected_value[0])
                contributions = []
                for i, col in enumerate(cols):
                    val = float(shap_vals[0][i])
                    if abs(val) > 0.1:
                        contributions.append({
                            "feature": col,
                            "contribution": val,
                            "value": float(df.iloc[0][i])
                        })
                
                contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
                if contributions:
                    top_feature = contributions[0]['feature'].replace('_', ' ')
                    direction = "increasing" if contributions[0]['contribution'] > 0 else "decreasing"
                    shap_data["natural_explanation"] = f"The estimated consultation time is mainly influenced by the {top_feature}, {direction} the duration."
                    shap_data["base_value"] = base_value
                    shap_data["contributions"] = contributions
            except Exception as e:
                import traceback
                traceback.print_exc()
                shap_data["error"] = str(e)

            return {"status": "SUCCESS", "predicted_duration": pred, "appointment_id": appointment_id, "shap": shap_data}

    def get_no_show_prediction(self, appointment_id):
        model = self._load_model('no_show_model', 'no_show_model.pkl')
        cols = self._load_model('no_show_columns', 'no_show_columns.pkl')
        
        if not model or not cols:
            return {"status": "NOT_TRAINED"}
            
        with self.Session() as session:
            res = session.execute(text(f"SELECT patient_id, doctor_id, appointment_type FROM appointments WHERE id = '{appointment_id}'")).fetchone()
            if not res:
                return {"status": "INSUFFICIENT_DATA", "reason": "Appointment not found"}
            
            pat_id, doc_id, appt_type = res
            
            # Simple features for no-show
            now = datetime.datetime.now()
            df = pd.DataFrame([{
                'hour': now.hour,
                'day_of_week': now.weekday()
            }])
            df[f'appointment_type_{appt_type}'] = 1
            df = self._align_features(df, cols)
            
            # Predict probability if possible, else just 0/1
            try:
                prob = float(model.predict_proba(df)[0][1])
            except:
                prob = float(model.predict(df)[0])
                
            return {"status": "SUCCESS", "no_show_probability": prob, "appointment_id": appointment_id}

    def get_arrival_forecast(self):
        # Not typically a simple tabular model, perhaps returning DB aggregations or INSUFFICIENT_DATA if no model
        return {"status": "NOT_TRAINED", "reason": "Arrival forecast model not implemented"}

    def get_congestion_forecast(self):
        return {"status": "NOT_TRAINED", "reason": "Congestion forecast model not implemented"}

    def get_anomalies(self, recent=False):
        model = self._load_model('anomaly_model', 'anomaly_model.pkl')
        if not model:
            # Maybe check DB for anomalies
            with self.Session() as session:
                query = "SELECT id, type, description, severity, timestamp FROM anomalies"
                if recent:
                    query += " ORDER BY timestamp DESC LIMIT 10"
                res = session.execute(text(query)).fetchall()
                if not res:
                    return {"status": "INSUFFICIENT_DATA"}
                return {"status": "SUCCESS", "anomalies": [dict(row._mapping) for row in res]}
        
        # If model exists, could predict anomalies but no context provided, returning from DB
        return {"status": "NOT_TRAINED"}
