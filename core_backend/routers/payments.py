from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from services.orchestration import OrchestrationService
orchestrator = OrchestrationService()
from database.models import Payment, Appointment, QueueEntry, PatientJourney
import uuid
import datetime
# We need to import the broadcast function from main but that causes circular imports.
# We will just post an event to the orchestrator or directly trigger WS.
# For simplicity in this structure without circular imports, we can handle it in the orchestrator.
from services.orchestration import OrchestrationService
orchestrator = OrchestrationService()

router = APIRouter(prefix="/api/payments", tags=["payments"])

def get_db():
    db = orchestrator.Session()
    try:
        yield db
    finally:
        db.close()

@router.post("")
def create_payment(data: dict, db: Session = Depends(get_db)):
    appointment_id = data.get("appointment_id")
    patient_id = data.get("patient_id")
    amount = data.get("amount", 500.0)
    
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    payment_id = "PAY_" + str(uuid.uuid4())[:8]
    
    payment = Payment(
        id=payment_id,
        patient_id=patient_id,
        appointment_id=appointment_id,
        amount=amount,
        status="Processing",
        payment_method="sandbox",
        created_at=datetime.datetime.utcnow()
    )
    db.add(payment)
    db.commit()
    
    return {"message": "Payment initiated", "payment_id": payment_id}

@router.post("/{payment_id}/verify")
def verify_payment(payment_id: str, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    # Sandbox auto success
    payment.status = "Paid"
    payment.transaction_ref = "TXN_" + str(uuid.uuid4())[:12]
    
    # Update appointment
    appt = db.query(Appointment).filter(Appointment.id == payment.appointment_id).first()
    if appt:
        appt.payment_status = "Paid"
        appt.status = "Confirmed"
        
        # Generate token directly here for the workflow
        # Let's count today's appointments for this doctor to generate a token number
        today = datetime.datetime.utcnow().date()
        count = db.query(Appointment).filter(
            Appointment.doctor_id == appt.doctor_id, 
            Appointment.appointment_date >= datetime.datetime.combine(today, datetime.time.min)
        ).count()
        
        token_str = f"A-{count + 20}" # Just a nice format
        appt.token_status = token_str
        
        # Also initialize the queue entry as 'Scheduled' so the patient can see it in 'My Token'
        # The user said token is generated.
        queue_id = "Q_" + str(uuid.uuid4())[:8]
        queue = QueueEntry(
            id=queue_id,
            patient_id=appt.patient_id,
            appointment_id=appt.id,
            doctor_id=appt.doctor_id,
            status="Scheduled", # Before Check-in
            queue_position=count + 20,
            priority_score=0.0
        )
        db.add(queue)

    db.commit()
    
    # Normally we'd emit WS here, but we will rely on frontend to fetch state or we can call a webhook.
    # The frontend can just poll or we can trigger a simple notification
    return {"message": "Payment verified", "status": payment.status, "token": appt.token_status if appt else None}

@router.get("/{appointment_id}")
def get_payment(appointment_id: str, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.appointment_id == appointment_id).order_by(Payment.created_at.desc()).first()
    if not payment:
        raise HTTPException(status_code=404, detail="No payment found")
    return {"payment": payment}
