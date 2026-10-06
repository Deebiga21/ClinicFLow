import os
import sys
import random
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.models import *

db_path = 'sqlite:///d:/clinic-queue -updated/core_backend/clinic_core_v2.db'
engine = create_engine(db_path)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# 1. Patients
print("Seeding Patients...")
patients = []
for i in range(1, 1001):
    p = Patient(
        id=f"P_{i}",
        patient_code=f"PC{i:04d}",
        name=f"Patient {i}",
        age=random.randint(5, 85),
        gender=random.choice(["Male", "Female", "Other"]),
        phone=f"555-{random.randint(1000,9999)}",
        email=f"patient{i}@example.com"
    )
    patients.append(p)
session.add_all(patients)
session.commit()

# 2. Doctors
print("Seeding Doctors...")
docs = [
    ("D_1", "Dr. Smith", "Cardiology", "Cardio", 20.0),
    ("D_2", "Dr. Jones", "General Practice", "GP", 12.0),
    ("D_3", "Dr. Lee", "Pediatrics", "Peds", 15.0),
    ("D_4", "Dr. Patel", "Orthopedics", "Ortho", 25.0)
]
for d in docs:
    session.add(Doctor(
        id=d[0], name=d[1], specialization=d[2], department=d[3], average_consultation_duration=d[4]
    ))
session.commit()

# 3. Medicines
print("Seeding Medicines...")
meds = [
    ("M_1", "Amoxicillin", "Antibiotic", "mg", 500),
    ("M_2", "Ibuprofen", "Painkiller", "mg", 1000),
    ("M_3", "Lisinopril", "Blood Pressure", "mg", 300),
    ("M_4", "Metformin", "Diabetes", "mg", 400)
]
for m in meds:
    session.add(Medicine(id=m[0], name=m[1], category=m[2], unit=m[3], reorder_level=m[4]))
    session.add(MedicineBatch(
        id=f"B_{m[0]}_1", medicine_id=m[0], batch_number=f"BATCH-{random.randint(1000,9999)}",
        quantity=5000, expiry_date=datetime.datetime.now() + datetime.timedelta(days=365),
        received_date=datetime.datetime.now() - datetime.timedelta(days=30)
    ))
session.commit()

# 4. Generate Historical Pipeline (5,000 records)
print("Seeding Historical Pipeline (Appointments, Queue, Consultations, etc)...")
base_date = datetime.datetime.now() - datetime.timedelta(days=180)

for i in range(1, 5001):
    # Time progression
    appt_date = base_date + datetime.timedelta(days=i//30)
    hour = random.randint(8, 17)
    minute = random.choice([0, 15, 30, 45])
    appt_time = appt_date.replace(hour=hour, minute=minute)
    
    patient_id = f"P_{random.randint(1, 1000)}"
    doc_id = f"D_{random.randint(1, 4)}"
    appt_id = f"A_{i}"
    
    # 1. Appointment
    session.add(Appointment(
        id=appt_id, patient_id=patient_id, doctor_id=doc_id,
        appointment_date=appt_time.strftime("%Y-%m-%d"),
        appointment_time=appt_time.strftime("%H:%M"),
        appointment_type=random.choice(["Routine", "Follow-up", "Urgent"]),
        status="Completed", check_in_time=appt_time
    ))
    
    # 2. Queue
    wait_time = random.uniform(5, 45)
    called_at = appt_time + datetime.timedelta(minutes=wait_time)
    consult_duration = random.uniform(8, 30)
    consult_end = called_at + datetime.timedelta(minutes=consult_duration)
    
    session.add(QueueEntry(
        id=f"Q_{i}", appointment_id=appt_id, patient_id=patient_id, doctor_id=doc_id,
        token_number=i, queue_position=0, status="Completed",
        entered_queue_at=appt_time, called_at=called_at,
        consultation_started_at=called_at, consultation_completed_at=consult_end,
        actual_wait_minutes=wait_time
    ))
    
    # 3. Consultation
    consult_id = f"C_{i}"
    session.add(Consultation(
        id=consult_id, appointment_id=appt_id, patient_id=patient_id, doctor_id=doc_id,
        started_at=called_at, completed_at=consult_end,
        actual_duration_minutes=consult_duration, status="Completed"
    ))
    
    # 4. Prescription (30% chance)
    if random.random() < 0.3:
        rx_id = f"RX_{i}"
        med_id = f"M_{random.randint(1, 4)}"
        session.add(Prescription(
            id=rx_id, patient_id=patient_id, appointment_id=appt_id, doctor_id=doc_id,
            consultation_id=consult_id, medicine_id=med_id, medicine_name="Medication",
            dosage="1 tab", frequency="Twice daily", duration_days=5,
            instructions="Take after meals", prescribed_at=consult_end, status="Active"
        ))
        
    if i % 1000 == 0:
        session.commit()
        print(f"Generated {i} historical records...")

session.commit()
print("Synthetic dataset successfully built!")
