
from fastapi import APIRouter
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import asyncio

router = APIRouter(tags=["billing"])
engine = create_engine("sqlite:///d:/clinic-queue -updated/core_backend/clinic_core_v2.db")
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
    with Session() as session:
        session.execute(text("UPDATE bills SET status = 'Paid' WHERE patient_id = :pid"), {"pid": patient_id})
        session.execute(text("UPDATE appointments SET token_status = 'Paid' WHERE patient_id = :pid AND status = 'Completed'"), {"pid": patient_id})
        session.commit()
    from main import manager, sio
    await manager.broadcast({"type": "payment_successful", "patient_id": patient_id})
    return {"ok": True}

