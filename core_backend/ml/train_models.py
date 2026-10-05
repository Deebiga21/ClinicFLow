import os
import json
import uuid
import datetime
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score
import joblib
from sqlalchemy import text
from features.feature_engineering import FeatureEngineer

def register_model(fe, name, features, target, metrics, path):
    print(f"Registering {name} with metrics {metrics}")
    with fe.engine.begin() as conn:
        # Check if version exists, increment
        res = conn.execute(text("SELECT version FROM model_versions WHERE model_name = :name ORDER BY training_date DESC LIMIT 1"), {"name": name}).fetchone()
        v = "1.0"
        if res:
            v = str(float(res[0]) + 0.1)
            
        m_id = str(uuid.uuid4())
        
        # update previous to Inactive
        conn.execute(text("UPDATE model_versions SET status = 'Inactive' WHERE model_name = :name"), {"name": name})
        
        conn.execute(text("""
            INSERT INTO model_versions (id, model_name, version, training_date, training_rows, features, target, metrics, model_path, status)
            VALUES (:id, :name, :v, CURRENT_TIMESTAMP, :rows, :feats, :target, :metrics, :path, 'Active')
        """), {
            "id": m_id,
            "name": name,
            "v": v,
            "rows": len(features),
            "feats": json.dumps(list(features.columns)),
            "target": target,
            "metrics": json.dumps(metrics),
            "path": path
        })

def train_and_save_models():
    fe = FeatureEngineer()
    os.makedirs('saved_models', exist_ok=True)
    
    # 1. Waiting Time Model (Regressor)
    print("Training Waiting Time Model...")
    X_wait, y_wait, df_wait = fe.build_waiting_time_features()
    valid_idx = y_wait.notna()
    X_wait_valid = X_wait[valid_idx]
    y_wait_valid = y_wait[valid_idx]
    
    if len(X_wait_valid) > 50:
        X_train, X_test, y_train, y_test = train_test_split(X_wait_valid, y_wait_valid, test_size=0.2, random_state=42)
        xgb_wait = xgb.XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.1)
        xgb_wait.fit(X_train, y_train)
        
        y_pred = xgb_wait.predict(X_test)
        metrics = {
            "MAE": round(mean_absolute_error(y_test, y_pred), 2),
            "RMSE": round((mean_squared_error(y_test, y_pred) ** 0.5), 2),
            "R2": round(r2_score(y_test, y_pred), 2)
        }
        
        joblib.dump(xgb_wait, 'saved_models/waiting_time_model.pkl')
        joblib.dump(list(X_wait.columns), 'saved_models/waiting_time_columns.pkl')
        register_model(fe, "Waiting Time", X_wait_valid, "actual_wait_minutes", metrics, "saved_models/waiting_time_model.pkl")
    
    # 2. Consultation Duration Model (Regressor)
    print("Training Consultation Duration Model...")
    X_dur, y_dur, df_dur = fe.build_consultation_features()
    valid_idx = y_dur.notna()
    X_dur_valid = X_dur[valid_idx]
    y_dur_valid = y_dur[valid_idx]
    
    if len(X_dur_valid) > 50:
        X_train, X_test, y_train, y_test = train_test_split(X_dur_valid, y_dur_valid, test_size=0.2, random_state=42)
        xgb_dur = xgb.XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.1)
        xgb_dur.fit(X_train, y_train)
        
        y_pred = xgb_dur.predict(X_test)
        metrics = {
            "MAE": round(mean_absolute_error(y_test, y_pred), 2),
            "RMSE": round((mean_squared_error(y_test, y_pred) ** 0.5), 2),
            "R2": round(r2_score(y_test, y_pred), 2)
        }
        
        joblib.dump(xgb_dur, 'saved_models/consultation_duration_model.pkl')
        joblib.dump(list(X_dur.columns), 'saved_models/consultation_duration_columns.pkl')
        register_model(fe, "Consultation Duration", X_dur_valid, "consultation_duration_minutes", metrics, "saved_models/consultation_duration_model.pkl")
    
    # 3. No-Show Model (Classifier)
    print("Training No-Show Model...")
    X_ns, y_ns, df_ns = fe.build_no_show_features()
    if len(X_ns) > 50 and len(y_ns.unique()) > 1:
        X_train, X_test, y_train, y_test = train_test_split(X_ns, y_ns, test_size=0.2, random_state=42)
        xgb_ns = xgb.XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, use_label_encoder=False, eval_metric='logloss')
        xgb_ns.fit(X_train, y_train)
        
        y_pred = xgb_ns.predict(X_test)
        y_prob = xgb_ns.predict_proba(X_test)[:, 1]
        
        metrics = {
            "Precision": round(precision_score(y_test, y_pred, zero_division=0), 2),
            "Recall": round(recall_score(y_test, y_pred, zero_division=0), 2),
            "F1": round(f1_score(y_test, y_pred, zero_division=0), 2),
            "ROC-AUC": round(roc_auc_score(y_test, y_prob), 2)
        }
        
        joblib.dump(xgb_ns, 'saved_models/no_show_model.pkl')
        joblib.dump(list(X_ns.columns), 'saved_models/no_show_columns.pkl')
        register_model(fe, "No-Show", X_ns, "no_show", metrics, "saved_models/no_show_model.pkl")
    
    # 4. Anomaly Detection (Isolation Forest)
    print("Training Anomaly Detection Model...")
    if len(X_wait_valid) > 50:
        X_anom = pd.concat([X_wait_valid['doctor_workload'], y_wait_valid], axis=1)
        X_anom.columns = ['doctor_workload', 'waiting_time']
        X_anom = X_anom.fillna(0)
        iso = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        iso.fit(X_anom)
        joblib.dump(iso, 'saved_models/anomaly_model.pkl')
        register_model(fe, "Anomaly Detection", X_anom, "anomaly_score", {"contamination": 0.05}, "saved_models/anomaly_model.pkl")
        
    
    # 5. Medicine Demand Model (Mock regression model for demo)
    print("Training Medicine Demand Model...")
    # Generate some mock data for training
    import numpy as np
    X_demand = pd.DataFrame({
        'day_of_week': np.random.randint(0, 7, 200),
        'season': np.random.randint(0, 4, 200),
        'prev_day_usage': np.random.randint(10, 100, 200)
    })
    y_demand = X_demand['prev_day_usage'] * 1.1 + np.random.normal(0, 5, 200)
    
    xgb_demand = xgb.XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1)
    xgb_demand.fit(X_demand, y_demand)
    
    y_pred_d = xgb_demand.predict(X_demand)
    metrics_demand = {
        "MAE": round(mean_absolute_error(y_demand, y_pred_d), 2),
        "RMSE": round((mean_squared_error(y_demand, y_pred_d) ** 0.5), 2),
        "R2": round(r2_score(y_demand, y_pred_d), 2)
    }
    
    joblib.dump(xgb_demand, 'saved_models/medicine_demand_model.pkl')
    register_model(fe, "medicine_demand_model", X_demand, "demand", metrics_demand, "saved_models/medicine_demand_model.pkl")

    print("All models trained and saved in 'saved_models/'")


if __name__ == "__main__":
    train_and_save_models()
