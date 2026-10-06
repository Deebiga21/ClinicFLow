import sys

with open('core_backend/routers/medicines.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_func = """@router.get('/demand-forecast')
def get_demand_forecast():
    from services.ml_service import MLService
    ml = MLService()
    model = ml._load_model('medicine_demand_model', 'medicine_demand_model.pkl')
    if not model:
        return {'data': {'trained': False, 'message': 'NOT TRAINED'}}
    return {'data': {'trained': True, 'forecasts': []}}"""

new_func = """@router.get('/demand-forecast')
def get_demand_forecast():
    from services.ml_service import MLService
    ml = MLService()
    model = ml._load_model('medicine_demand_model', 'medicine_demand_model.pkl')
    if not model:
        return {'data': {'trained': False, 'message': 'NOT TRAINED'}}
    
    # Mock data for the chart to render beautifully
    historical = [
        {"date": "Mon", "Amoxicillin": 12, "Paracetamol": 45, "Ibuprofen": 20},
        {"date": "Tue", "Amoxicillin": 15, "Paracetamol": 50, "Ibuprofen": 22},
        {"date": "Wed", "Amoxicillin": 20, "Paracetamol": 40, "Ibuprofen": 25},
        {"date": "Thu", "Amoxicillin": 18, "Paracetamol": 55, "Ibuprofen": 30},
        {"date": "Fri", "Amoxicillin": 25, "Paracetamol": 60, "Ibuprofen": 35},
        {"date": "Sat", "Amoxicillin": 10, "Paracetamol": 30, "Ibuprofen": 15},
        {"date": "Sun", "Amoxicillin": 8,  "Paracetamol": 25, "Ibuprofen": 10}
    ]
    return {'data': {'trained': True, 'historical_usage': historical, 'forecasts': []}}"""

if old_func in content:
    content = content.replace(old_func, new_func)
    with open('core_backend/routers/medicines.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Router patched!")
else:
    print("Could not find the function to patch!")
