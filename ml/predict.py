import sys
import os
import json
import numpy as np
import pandas as pd
import xgboost as xgb

def predict_priority(vitals):
    """
    Predict priority level and priority score using trained XGBoost model.
    Expected dict vitals:
    {
      "age": 45,
      "systolic_bp": 120,
      "diastolic_bp": 80,
      "heart_rate": 75,
      "spo2": 98,
      "temperature": 37.0,
      "pain_score": 4,
      "symptom_severity": 1
    }
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'priority_model.json')
    meta_path = os.path.join(script_dir, 'model_meta.json')

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")

    with open(meta_path, 'r') as f:
        meta = json.load(f)

    feature_names = meta.get('feature_names', [
        'age', 'systolic_bp', 'diastolic_bp', 'heart_rate', 'spo2', 'temperature', 'pain_score', 'symptom_severity'
    ])

    # Default missing fields safely
    defaults = {
        'age': 35,
        'systolic_bp': 120,
        'diastolic_bp': 80,
        'heart_rate': 75,
        'spo2': 98,
        'temperature': 37.0,
        'pain_score': 0,
        'symptom_severity': 1
    }

    input_data = {}
    for f in feature_names:
        input_data[f] = float(vitals.get(f, defaults.get(f, 0)))

    df_input = pd.DataFrame([input_data])[feature_names]

    model = xgb.XGBClassifier()
    model.load_model(model_path)

    probas = model.predict_proba(df_input)[0]
    pred_class_idx = int(np.argmax(probas))
    class_names = meta.get('class_names', ['LOW', 'MEDIUM', 'HIGH'])
    predicted_level = class_names[pred_class_idx]

    # Calculate continuous priority score from weighted probabilities (LOW=10..35, MEDIUM=36..70, HIGH=71..100)
    score = float((probas[0] * 20.0 + probas[1] * 55.0 + probas[2] * 90.0))
    score = round(min(max(score, 5.0), 99.0), 1)

    is_emergency_alert = (predicted_level == 'HIGH') or (score >= 68.0) or (input_data['spo2'] < 90) or (input_data['systolic_bp'] > 170)

    result = {
        'priorityLevel': predicted_level,
        'priorityScore': score,
        'isEmergencyAlert': is_emergency_alert,
        'probabilities': {
            'LOW': round(float(probas[0]), 3),
            'MEDIUM': round(float(probas[1]), 3),
            'HIGH': round(float(probas[2]), 3)
        },
        'vitalsEvaluated': input_data
    }
    return result

def predict_disease(features):
    """
    Predict disease based on symptoms using trained XGBoost model.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'disease_model.json')
    meta_path = os.path.join(script_dir, 'disease_model_meta.json')

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")

    with open(meta_path, 'r') as f:
        meta = json.load(f)

    feature_names = meta.get('feature_names', ['fever', 'cough', 'fatigue', 'nausea', 'muscle_pain', 'headache', 'diarrhea'])
    
    defaults = {
        'fever': 37.0,
        'cough': 0,
        'fatigue': 0,
        'nausea': 0,
        'muscle_pain': 0,
        'headache': 0,
        'diarrhea': 0
    }

    input_data = {}
    for f in feature_names:
        input_data[f] = float(features.get(f, defaults.get(f, 0)))

    df_input = pd.DataFrame([input_data])[feature_names]

    model = xgb.XGBClassifier()
    model.load_model(model_path)

    probas = model.predict_proba(df_input)[0]
    pred_class_idx = int(np.argmax(probas))
    class_names = meta.get('class_names', ['Healthy / Minor Ailment', 'Viral Flu', 'Gastroenteritis', 'Dengue / Malaria', 'Respiratory Infection'])
    predicted_disease = class_names[pred_class_idx]
    
    # Calculate confidence percentage
    confidence = round(float(probas[pred_class_idx]) * 100, 2)

    prob_dict = {}
    for i, class_name in enumerate(class_names):
        prob_dict[class_name] = round(float(probas[i]), 3)

    result = {
        'disease': predicted_disease,
        'confidence': confidence,
        'probabilities': prob_dict,
        'featuresEvaluated': input_data
    }
    return result

if __name__ == '__main__':
    try:
        mode = 'priority'
        if len(sys.argv) > 1:
            if sys.argv[1] == '--disease':
                mode = 'disease'
                raw_json = sys.argv[2] if len(sys.argv) > 2 else sys.stdin.read()
            elif sys.argv[1] == '--priority':
                mode = 'priority'
                raw_json = sys.argv[2] if len(sys.argv) > 2 else sys.stdin.read()
            else:
                raw_json = sys.argv[1]
        else:
            raw_json = sys.stdin.read()
        
        data = json.loads(raw_json) if raw_json.strip() else {}
        
        if mode == 'disease':
            output = predict_disease(data)
        else:
            output = predict_priority(data)
            
        print(json.dumps(output))
    except Exception as e:
        error_res = {
            'error': str(e),
            'priorityLevel': 'LOW',
            'priorityScore': 15.0,
            'isEmergencyAlert': False,
            'disease': 'Unknown',
            'confidence': 0.0
        }
        print(json.dumps(error_res))
