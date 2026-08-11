import os
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

def generate_synthetic_disease_data(n_samples=4000, random_state=42):
    np.random.seed(random_state)
    
    # Target Diseases:
    # 0: Healthy / Minor Ailment
    # 1: Viral Flu
    # 2: Gastroenteritis (Food Poisoning)
    # 3: Dengue / Malaria
    # 4: Respiratory Infection
    
    classes = []
    
    # Features
    # fever: 36.0 - 41.0
    # cough: 0 (No), 1 (Mild), 2 (Severe)
    # fatigue: 0 - 10
    # nausea: 0 (No), 1 (Yes)
    # muscle_pain: 0 - 10
    # headache: 0 - 10
    # diarrhea: 0 (No), 1 (Yes)

    features = {
        'fever': [], 'cough': [], 'fatigue': [], 'nausea': [], 
        'muscle_pain': [], 'headache': [], 'diarrhea': []
    }
    
    for _ in range(n_samples):
        c = np.random.choice([0, 1, 2, 3, 4], p=[0.2, 0.3, 0.2, 0.1, 0.2])
        classes.append(c)
        
        if c == 0: # Minor Ailment
            features['fever'].append(np.random.normal(37.0, 0.3))
            features['cough'].append(np.random.choice([0, 1], p=[0.8, 0.2]))
            features['fatigue'].append(np.random.randint(0, 4))
            features['nausea'].append(0)
            features['muscle_pain'].append(np.random.randint(0, 3))
            features['headache'].append(np.random.randint(0, 3))
            features['diarrhea'].append(0)
            
        elif c == 1: # Viral Flu
            features['fever'].append(np.random.normal(38.5, 0.5))
            features['cough'].append(np.random.choice([1, 2], p=[0.7, 0.3]))
            features['fatigue'].append(np.random.randint(4, 9))
            features['nausea'].append(np.random.choice([0, 1], p=[0.8, 0.2]))
            features['muscle_pain'].append(np.random.randint(3, 8))
            features['headache'].append(np.random.randint(4, 8))
            features['diarrhea'].append(0)
            
        elif c == 2: # Gastroenteritis
            features['fever'].append(np.random.normal(37.5, 0.4))
            features['cough'].append(0)
            features['fatigue'].append(np.random.randint(5, 9))
            features['nausea'].append(1)
            features['muscle_pain'].append(np.random.randint(1, 5))
            features['headache'].append(np.random.randint(2, 6))
            features['diarrhea'].append(1)
            
        elif c == 3: # Dengue/Malaria
            features['fever'].append(np.random.normal(39.5, 0.6))
            features['cough'].append(0)
            features['fatigue'].append(np.random.randint(7, 11))
            features['nausea'].append(np.random.choice([0, 1], p=[0.6, 0.4]))
            features['muscle_pain'].append(np.random.randint(8, 11))
            features['headache'].append(np.random.randint(7, 11))
            features['diarrhea'].append(np.random.choice([0, 1], p=[0.9, 0.1]))
            
        elif c == 4: # Respiratory Infection
            features['fever'].append(np.random.normal(38.0, 0.5))
            features['cough'].append(2)
            features['fatigue'].append(np.random.randint(4, 8))
            features['nausea'].append(0)
            features['muscle_pain'].append(np.random.randint(2, 6))
            features['headache'].append(np.random.randint(3, 7))
            features['diarrhea'].append(0)
            
    df = pd.DataFrame(features)
    df['fever'] = df['fever'].clip(35.5, 41.5)
    df['target'] = classes
    return df

def train_disease_model():
    print("Generating synthetic disease dataset...")
    df = generate_synthetic_disease_data(n_samples=4000, random_state=42)
    
    feature_names = ['fever', 'cough', 'fatigue', 'nausea', 'muscle_pain', 'headache', 'diarrhea']
    X = df[feature_names]
    y = df['target']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    class_names = ['Healthy / Minor Ailment', 'Viral Flu', 'Gastroenteritis', 'Dengue / Malaria', 'Respiratory Infection']
    
    print(f"Dataset split: {len(X_train)} train, {len(X_test)} test")
    
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        objective='multi:softprob',
        num_class=5,
        random_state=42,
        eval_metric='mlogloss'
    )
    
    print("Training XGBoost Disease Classifier...")
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    print(f"\nDisease Model Accuracy: {acc * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=class_names))
    
    output_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(output_dir, exist_ok=True)
    
    model_json_path = os.path.join(output_dir, 'disease_model.json')
    model.save_model(model_json_path)
    print(f"\nSaved XGBoost model to {model_json_path}")
    
    meta = {
        'feature_names': feature_names,
        'class_names': class_names,
        'accuracy': float(acc),
        'feature_importances': {f: float(imp) for f, imp in zip(feature_names, model.feature_importances_)}
    }
    
    meta_path = os.path.join(output_dir, 'disease_model_meta.json')
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)
    print(f"Saved metadata to {meta_path}")

if __name__ == '__main__':
    train_disease_model()
