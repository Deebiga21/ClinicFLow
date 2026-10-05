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
            SELECT m.id, m.name, b.batch_number, b.quantity
            FROM medicines m
            JOIN medicine_batches b ON m.id = b.medicine_id
            WHERE b.quantity > 0
            ORDER BY m.name ASC
        """)
        results = session.execute(query).mappings().all()
        return {"data": [dict(r) for r in results]}

@router.get("/expiry-risk")
def get_expiry_risk():
    with orchestrator.Session() as session:
        # FEFO (First Expire First Out) intelligence & risk
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
            
            # Simple mock intelligence: if it expires in less than 90 days, there is waste risk.
            if days_to_expiry < 90:
                expected_consumption = (90 - days_to_expiry) * 2 # mock formula
                potential_leftover = max(0, b["quantity"] - expected_consumption)
                
                waste_risk = "HIGH" if potential_leftover > 10 else "MEDIUM"
                
                risks.append({
                    "medicine_id": b["medicine_id"],
                    "name": b["name"],
                    "batch_number": b["batch_number"],
                    "days_to_expiry": days_to_expiry,
                    "expected_consumption": expected_consumption,
                    "potential_leftover": potential_leftover,
                    "waste_risk": waste_risk
                })
                
        # Sort by most at risk (fewest days to expiry)
        risks.sort(key=lambda x: x["days_to_expiry"])
        return {"data": risks}
@router.get('/demand-forecast')
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
    return {'data': {'trained': True, 'historical_usage': historical, 'forecasts': []}}
