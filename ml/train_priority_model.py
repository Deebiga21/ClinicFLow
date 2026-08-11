import os
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

def generate_synthetic_triage_data(n_samples=3000, random_state=42):
    np.random.seed(random_state)

    # Features:
    # 1. age: 1 - 95
    # 2. systolic_bp: 80 - 200 mmHg
    # 3. diastolic_bp: 50 - 120 mmHg
    # 4. heart_rate: 50 - 160 bpm
    # 5. spo2: 75 - 100 %
    # 6. temperature: 35.5 - 41.0 C
    # 7. pain_score: 0 - 10
    # 8. symptom_severity: 1 (Mild), 2 (Moderate), 3 (Severe)

    age = np.random.randint(1, 95, n_samples)
    systolic_bp = np.random.normal(122, 22, n_samples).clip(80, 210)
    diastolic_bp = (systolic_bp * 0.65 + np.random.normal(0, 5, n_samples)).clip(50, 125)
    heart_rate = np.random.normal(78, 18, n_samples).clip(45, 170)
    spo2 = np.random.normal(97, 4, n_samples).clip(75, 100)
    temperature = np.random.normal(37.0, 0.8, n_samples).clip(35.5, 41.2)
    pain_score = np.random.randint(0, 11, n_samples)
    symptom_severity = np.random.choice([1, 2, 3], size=n_samples, p=[0.5, 0.35, 0.15])

    df = pd.DataFrame({
        'age': age,
        'systolic_bp': systolic_bp,
        'diastolic_bp': diastolic_bp,
        'heart_rate': heart_rate,
        'spo2': spo2,
        'temperature': temperature,
        'pain_score': pain_score,
        'symptom_severity': symptom_severity
    })

    # Rule-based synthetic triage assignment following ESI guidelines to create target class:
    # Class 0: LOW (Routine)
    # Class 1: MEDIUM (Urgent)
    # Class 2: HIGH (Emergency Alert)

    # Compute continuous risk score
    risk_score = np.zeros(n_samples)

    # Critical SpO2 < 90% -> heavy risk
    risk_score += np.where(spo2 < 90, 45, np.where(spo2 < 94, 20, 0))

    # Blood Pressure critical values (> 160 or < 90)
    risk_score += np.where(systolic_bp > 165, 30, np.where(systolic_bp > 140, 15, 0))
    risk_score += np.where(systolic_bp < 90, 35, 0)

    # Heart rate extremities (> 120 or < 55)
    risk_score += np.where((heart_rate > 120) | (heart_rate < 50), 25, np.where(heart_rate > 100, 10, 0))

    # Temperature fever / hypothermia
    risk_score += np.where((temperature > 39.2) | (temperature < 35.8), 20, np.where(temperature > 38.2, 10, 0))

    # Severe pain or symptoms
    risk_score += pain_score * 3.5
    risk_score += (symptom_severity - 1) * 20

    # Age vulnerability risk factor (very young or elderly)
    risk_score += np.where((age > 70) | (age < 5), 10, 0)

    # Add small Gaussian noise
    risk_score += np.random.normal(0, 3, n_samples)

    # Assign classes
    target = np.where(risk_score >= 50, 2, np.where(risk_score >= 25, 1, 0))

    df['target'] = target
    df['risk_score'] = np.clip(risk_score, 0, 100)

    return df

def train_model():
    print("Generating synthetic clinical triage dataset...")
    df = generate_synthetic_triage_data(n_samples=3000, random_state=42)

    feature_names = ['age', 'systolic_bp', 'diastolic_bp', 'heart_rate', 'spo2', 'temperature', 'pain_score', 'symptom_severity']
    X = df[feature_names]
    y = df['target']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print(f"Dataset split: {len(X_train)} train, {len(X_test)} test")
    print(f"Class distribution: {np.bincount(y)}")

    # Initialize XGBClassifier
    model = xgb.XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        objective='multi:softprob',
        num_class=3,
        random_state=42,
        eval_metric='mlogloss'
    )

    print("Training XGBoost Classifier...")
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {acc * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['LOW', 'MEDIUM', 'HIGH']))

    # Feature Importance
    importances = model.feature_importances_
    print("\nFeature Importances:")
    for f, imp in zip(feature_names, importances):
        print(f"  {f:20s}: {imp:.4f}")

    # Output directory
    output_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(output_dir, exist_ok=True)

    model_json_path = os.path.join(output_dir, 'priority_model.json')
    model.save_model(model_json_path)
    print(f"\nSaved XGBoost model to {model_json_path}")

    # Save feature metadata
    meta = {
        'feature_names': feature_names,
        'class_names': ['LOW', 'MEDIUM', 'HIGH'],
        'accuracy': float(acc),
        'feature_importances': {f: float(imp) for f, imp in zip(feature_names, importances)}
    }
    meta_path = os.path.join(output_dir, 'model_meta.json')
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)
    print(f"Saved metadata to {meta_path}")

if __name__ == '__main__':
    train_model()
