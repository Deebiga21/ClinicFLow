from fastapi import APIRouter
from services.ml_service import MLService
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

router = APIRouter(tags=["operational"])
ml_service = MLService()

engine = create_engine("sqlite:///clinic_core_v2.db")
Session = sessionmaker(bind=engine)

@router.get("/api/congestion/current")
def get_current_congestion():
    with Session() as session:
        waiting = session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'Waiting'")).scalar()
        if waiting > 10:
            status = "HIGH"
        elif waiting > 5:
            status = "MODERATE"
        else:
            status = "LOW"
        return {"current_waiting": waiting, "congestion_level": status}

@router.get("/api/congestion/forecast")
def get_congestion_forecast():
    return ml_service.get_congestion_forecast()

@router.get("/api/anomalies")
def get_anomalies():
    return ml_service.get_anomalies(recent=False)

@router.get("/api/anomalies/recent")
def get_recent_anomalies():
    return ml_service.get_anomalies(recent=True)

@router.get("/api/medicines")
def get_medicines():
    with Session() as session:
        res = session.execute(text("SELECT id, name, category, reorder_level FROM medicines")).fetchall()
        return {"medicines": [dict(row._mapping) for row in res]}

@router.get("/api/medicines/demand")
def get_medicines_demand():
    return {"status": "NOT_TRAINED", "reason": "Medicine demand model not implemented"}
