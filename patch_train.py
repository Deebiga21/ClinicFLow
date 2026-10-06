import sys

with open('core_backend/ml/train_models.py', 'r', encoding='utf-8') as f:
    content = f.read()

train_demand_code = """
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
"""

content = content.replace('print("All models trained and saved in \'saved_models/\'")', train_demand_code)

with open('core_backend/ml/train_models.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("train_models.py patched!")
