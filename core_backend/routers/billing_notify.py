
from fastapi import APIRouter
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import asyncio

router = APIRouter(tags=["billing"])
engine = create_engine("sqlite:///clinic_core_v2.db")
Session = sessionmaker(bind=engine)

@router.post("/api/appointments/{id}/notify-billing")
async def notify_billing(id: str):
    with Session() as session:
        row = session.execute(text("SELECT patient_id FROM appointments WHERE id = :id"), {"id": id}).first()
        if row and row.patient_id:
            from main import manager, sio
            await manager.broadcast({"type": "billing_notified", "patient_id": row.patient_id})
    return {"ok": True}

@router.post("/api/patient/{patient_id}/pay-bill")
async def pay_bill(patient_id: str):
    from main import manager, sio
    await manager.broadcast({"type": "payment_successful", "patient_id": patient_id})
    return {"ok": True}

