from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from services.orchestration import OrchestrationService
orchestrator = OrchestrationService()
from database.models import User, Patient
import uuid
import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])

def get_db():
    db = orchestrator.Session()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(data: dict, db: Session = Depends(get_db)):
    # Basic logic to create user and patient
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")
    name = data.get("name")
    
    if db.query(User).filter((User.email == email) | (User.phone == phone)).first():
        raise HTTPException(status_code=400, detail="User already exists")
        
    patient_id = "P_" + str(uuid.uuid4())[:8]
    user_id = "U_" + str(uuid.uuid4())[:8]
    
    patient = Patient(
        id=patient_id,
        name=name,
        email=email,
        phone=phone,
        created_at=datetime.datetime.utcnow()
    )
    
    user = User(
        id=user_id,
        role="patient",
        phone=phone,
        email=email,
        password_hash=password, # In production this must be hashed
        patient_id=patient_id,
        created_at=datetime.datetime.utcnow()
    )
    
    db.add(patient)
    db.add(user)
    db.commit()
    
    return {"message": "Registration successful", "user": {"id": user_id, "role": user.role, "patient_id": patient_id, "name": name}}

@router.post("/login")
def login(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")
    
    if email: email = email.lower().strip()
    if phone: phone = phone.lower().strip()
    if password: password = password.strip()
    
    user = None
    if email:
        user = db.query(User).filter(User.email == email, User.password_hash == password).first()
    elif phone:
        user = db.query(User).filter(User.phone == phone, User.password_hash == password).first()
        
    print(f"DEBUG USER: {user}")
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    patient = db.query(Patient).filter(Patient.id == user.patient_id).first()
    name = patient.name if patient else "User"
    
    return {"message": "Login successful", "user": {"id": user.id, "role": user.role, "patient_id": user.patient_id, "name": name}}

@router.get("/me")
def me(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    patient = db.query(Patient).filter(Patient.id == user.patient_id).first()
    return {"user": {"id": user.id, "role": user.role, "patient_id": user.patient_id, "name": patient.name if patient else "User"}}
