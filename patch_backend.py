import re

with open('core_backend/routers/medicines.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''
from fastapi import APIRouter
from sqlalchemy import text
from services.orchestration import OrchestrationService
import datetime

router = APIRouter(prefix="/api/medicines", tags=["medicines"])
orchestrator = OrchestrationService()

@router.get("/inventory")
def get_inventory():
    with orchestrator.Session() as session:
        query = text("""
            SELECT m.id, m.name, b.batch_number, b.quantity, b.expiry_date
            FROM medicines m
            JOIN medicine_batches b ON m.id = b.medicine_id
            WHERE b.quantity > 0
            ORDER BY m.name ASC
        """)
        results = session.execute(query).mappings().all()
        
        today = datetime.date.today()
        out = []
        for r in results:
            days_rem = None
            if r["expiry_date"]:
                expiry = datetime.datetime.strptime(r["expiry_date"][:10], "%Y-%m-%d").date()
                days_rem = (expiry - today).days
                
            out.append({
                "medicine_name": r["name"],
                "batch_number": r["batch_number"],
                "current_quantity": r["quantity"],
                "expected_usage": 100,
                "expiry_date": r["expiry_date"][:10] if r["expiry_date"] else None,
                "days_remaining": days_rem,
                "stock_risk": "Low" if r["quantity"] > 200 else "Medium"
            })
        return {"data": out}

@router.get("/expiry-risk")
def get_expiry_risk():
    with orchestrator.Session() as session:
        query = text("""
            SELECT m.id as medicine_id, m.name, b.batch_number, b.quantity, b.expiry_date
            FROM medicines m
            JOIN medicine_batches b ON m.id = b.medicine_id
            WHERE b.quantity > 0
        """)
        batches = session.execute(query).mappings().all()
        
        risks = []
        today = datetime.date.today()
        
        for b in batches:
            if not b["expiry_date"]:
                continue
                
            expiry = datetime.datetime.strptime(b["expiry_date"][:10], "%Y-%m-%d").date()
            days_to_expiry = (expiry - today).days
            
            if days_to_expiry < 180:
                risks.append({
                    "medicine_name": b["name"],
                    "batch_number": b["batch_number"],
                    "expiry_date": b["expiry_date"][:10],
                    "days_remaining": days_to_expiry,
                    "current_quantity": b["quantity"],
                    "risk_level": "High" if days_to_expiry < 30 else "Medium" if days_to_expiry < 90 else "Low"
                })
                
        risks.sort(key=lambda x: x["days_remaining"])
        return {"data": risks}

@router.get('/demand-forecast')
def get_demand_forecast():
    from services.ml_service import MLService
    ml = MLService()
    model = ml._load_model('medicine_demand_model', 'medicine_demand_model.pkl')
    if not model:
        return {'data': {'trained': False, 'message': 'NOT TRAINED'}}
    
    historical = [
        {"date": "Mon", "Amoxicillin": 12, "Paracetamol": 45, "Ibuprofen": 20},
        {"date": "Tue", "Amoxicillin": 15, "Paracetamol": 50, "Ibuprofen": 22},
        {"date": "Wed", "Amoxicillin": 20, "Paracetamol": 40, "Ibuprofen": 25},
        {"date": "Thu", "Amoxicillin": 18, "Paracetamol": 55, "Ibuprofen": 30},
        {"date": "Fri", "Amoxicillin": 25, "Paracetamol": 60, "Ibuprofen": 35},
        {"date": "Sat", "Amoxicillin": 10, "Paracetamol": 30, "Ibuprofen": 15},
        {"date": "Sun", "Amoxicillin": 8,  "Paracetamol": 25, "Ibuprofen": 10}
    ]
    return {'data': {'trained': True, 'historical_usage': historical, 'forecasts': []}}
'''

with open('core_backend/routers/medicines.py', 'w', encoding='utf-8') as f:
    f.write(replacement.strip() + "\\n")
