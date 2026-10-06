import os
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import pandas as pd

Base = declarative_base()

class Patient(Base):
    __tablename__ = 'patients'
    patient_id = Column(String, primary_key=True)
    age = Column(Integer)
    gender = Column(String)
    registration_date = Column(DateTime)
    visit_count = Column(Integer)
    previous_no_show_count = Column(Integer)
    
    appointments = relationship("Appointment", back_populates="patient")

class Doctor(Base):
    __tablename__ = 'doctors'
    doctor_id = Column(String, primary_key=True)
    specialization = Column(String)
    working_start = Column(String)
    working_end = Column(String)
    historical_average_consultation_duration = Column(Float)

    appointments = relationship("Appointment", back_populates="doctor")

class Appointment(Base):
    __tablename__ = 'appointments'
    appointment_id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey('patients.patient_id'))
    doctor_id = Column(String, ForeignKey('doctors.doctor_id'))
    appointment_date = Column(String)
    appointment_time = Column(String)
    booking_time = Column(DateTime)
    appointment_type = Column(String)
    lead_time_hours = Column(Float)
    status = Column(String)
    no_show = Column(Boolean)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    queue_entry = relationship("QueueEntry", back_populates="appointment", uselist=False)
    consultation = relationship("Consultation", back_populates="appointment", uselist=False)

class QueueEntry(Base):
    __tablename__ = 'queue_entries'
    queue_id = Column(String, primary_key=True)
    appointment_id = Column(String, ForeignKey('appointments.appointment_id'))
    patient_id = Column(String, ForeignKey('patients.patient_id'))
    doctor_id = Column(String, ForeignKey('doctors.doctor_id'))
    token_number = Column(Integer)
    arrival_time = Column(DateTime)
    check_in_time = Column(DateTime)
    queue_position = Column(Integer)
    patients_ahead = Column(Integer)
    call_time = Column(DateTime, nullable=True)
    status = Column(String)

    appointment = relationship("Appointment", back_populates="queue_entry")

class Consultation(Base):
    __tablename__ = 'consultations'
    consultation_id = Column(String, primary_key=True)
    appointment_id = Column(String, ForeignKey('appointments.appointment_id'))
    patient_id = Column(String, ForeignKey('patients.patient_id'))
    doctor_id = Column(String, ForeignKey('doctors.doctor_id'))
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    consultation_duration_minutes = Column(Float, nullable=True)
    visit_type = Column(String)

    appointment = relationship("Appointment", back_populates="consultation")
    prescription = relationship("Prescription", back_populates="consultation", uselist=False)

class Prescription(Base):
    __tablename__ = 'prescriptions'
    prescription_id = Column(String, primary_key=True)
    consultation_id = Column(String, ForeignKey('consultations.consultation_id'))
    patient_id = Column(String, ForeignKey('patients.patient_id'))
    medicine_id = Column(String, ForeignKey('medicines.medicine_id'))
    dose = Column(String)
    frequency = Column(String)
    duration_days = Column(Integer)
    approved_by_doctor = Column(Boolean)

    consultation = relationship("Consultation", back_populates="prescription")
    medication_schedules = relationship("MedicationSchedule", back_populates="prescription")

class MedicationSchedule(Base):
    __tablename__ = 'medication_schedules'
    schedule_id = Column(String, primary_key=True)
    prescription_id = Column(String, ForeignKey('prescriptions.prescription_id'))
    patient_id = Column(String, ForeignKey('patients.patient_id'))
    scheduled_time = Column(DateTime)
    status = Column(String)

    prescription = relationship("Prescription", back_populates="medication_schedules")

class Medicine(Base):
    __tablename__ = 'medicines'
    medicine_id = Column(String, primary_key=True)
    medicine_name = Column(String)
    category = Column(String)

class InventoryTransaction(Base):
    __tablename__ = 'inventory_transactions'
    batch_id = Column(String, primary_key=True)
    medicine_id = Column(String, ForeignKey('medicines.medicine_id'))
    quantity = Column(Integer)
    purchase_date = Column(DateTime)
    expiry_date = Column(DateTime)

class Prediction(Base):
    __tablename__ = 'predictions'
    prediction_id = Column(String, primary_key=True)
    patient_id = Column(String)
    appointment_id = Column(String)
    prediction_type = Column(String)
    model_name = Column(String)
    model_version = Column(String)
    input_timestamp = Column(DateTime)
    prediction_value = Column(Float)
    confidence_or_uncertainty = Column(Float)
    status = Column(String)

class PredictionOutcome(Base):
    __tablename__ = 'prediction_outcomes'
    outcome_id = Column(String, primary_key=True)
    prediction_id = Column(String, ForeignKey('predictions.prediction_id'))
    actual_value = Column(Float)
    absolute_error = Column(Float)
    percentage_error = Column(Float)
    recorded_at = Column(DateTime)

# Generation Logic
def generate_dataset():
    engine = create_engine('sqlite:///clinic_core.db')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Clear existing
    with engine.connect() as conn:
        for tbl in reversed(Base.metadata.sorted_tables):
            conn.execute(tbl.delete())
        conn.commit()

    # Generate Doctors
    doctors = [
        Doctor(doctor_id="D001", specialization="Cardiology", working_start="09:00", working_end="17:00", historical_average_consultation_duration=15.0),
        Doctor(doctor_id="D002", specialization="General", working_start="08:00", working_end="16:00", historical_average_consultation_duration=10.0),
        Doctor(doctor_id="D003", specialization="Pediatrics", working_start="10:00", working_end="18:00", historical_average_consultation_duration=12.0)
    ]
    session.add_all(doctors)

    # Generate Medicines
    medicines = [
        Medicine(medicine_id="M001", medicine_name="Aspirin", category="Painkiller"),
        Medicine(medicine_id="M002", medicine_name="Amoxicillin", category="Antibiotic"),
        Medicine(medicine_id="M003", medicine_name="Lisinopril", category="Blood Pressure")
    ]
    session.add_all(medicines)

    # Generate Patients, Appointments, etc.
    base_date = datetime.now() - timedelta(days=30)
    
    patients = []
    for i in range(1, 201):
        pid = f"P{i:03d}"
        p = Patient(
            patient_id=pid,
            age=random.randint(10, 80),
            gender=random.choice(['M', 'F']),
            registration_date=base_date - timedelta(days=random.randint(0, 365)),
            visit_count=random.randint(1, 10),
            previous_no_show_count=random.choices([0, 1, 2, 3], weights=[0.7, 0.2, 0.08, 0.02])[0]
        )
        patients.append(p)
    session.add_all(patients)
    
    appointment_id_counter = 1
    queue_id_counter = 1
    consult_id_counter = 1
    presc_id_counter = 1
    sched_id_counter = 1
    pred_id_counter = 1

    current_date = base_date
    while current_date < datetime.now():
        # Generate daily appointments
        num_appts = random.randint(15, 30)
        daily_appts = []
        for _ in range(num_appts):
            p = random.choice(patients)
            d = random.choice(doctors)
            hour = random.randint(9, 16)
            minute = random.choice([0, 15, 30, 45])
            appt_datetime = current_date.replace(hour=hour, minute=minute)
            
            is_no_show = random.random() < (0.2 if p.previous_no_show_count > 0 else 0.05)
            status = "No-Show" if is_no_show else "Completed"
            
            appt = Appointment(
                appointment_id=f"A{appointment_id_counter:04d}",
                patient_id=p.patient_id,
                doctor_id=d.doctor_id,
                appointment_date=appt_datetime.strftime("%Y-%m-%d"),
                appointment_time=appt_datetime.strftime("%H:%M"),
                booking_time=appt_datetime - timedelta(days=random.randint(1, 14)),
                appointment_type=random.choice(["Follow-up", "New Issue", "Routine"]),
                lead_time_hours=random.randint(24, 336),
                status=status,
                no_show=is_no_show
            )
            daily_appts.append(appt)
            session.add(appt)
            
            if not is_no_show:
                # Arrived, Queue, Consult
                arrival = appt_datetime - timedelta(minutes=random.randint(-10, 30))
                q = QueueEntry(
                    queue_id=f"Q{queue_id_counter:04d}",
                    appointment_id=appt.appointment_id,
                    patient_id=p.patient_id,
                    doctor_id=d.doctor_id,
                    token_number=random.randint(1, 100),
                    arrival_time=arrival,
                    check_in_time=arrival + timedelta(minutes=random.randint(1, 5)),
                    queue_position=random.randint(1, 5),
                    patients_ahead=random.randint(0, 4),
                    call_time=arrival + timedelta(minutes=random.randint(10, 40)),
                    status="Completed"
                )
                session.add(q)
                
                # Prediction
                pred = Prediction(
                    prediction_id=f"PRED_W_{pred_id_counter:04d}",
                    patient_id=p.patient_id,
                    appointment_id=appt.appointment_id,
                    prediction_type="waiting_time",
                    model_name="XGBoost_Wait",
                    model_version="v1.0",
                    input_timestamp=q.check_in_time,
                    prediction_value=random.uniform(10, 35),
                    confidence_or_uncertainty=0.9,
                    status="Completed"
                )
                session.add(pred)
                
                actual_wait = (q.call_time - q.check_in_time).total_seconds() / 60.0
                outc = PredictionOutcome(
                    outcome_id=f"OUT_W_{pred_id_counter:04d}",
                    prediction_id=pred.prediction_id,
                    actual_value=actual_wait,
                    absolute_error=abs(pred.prediction_value - actual_wait),
                    percentage_error=abs(pred.prediction_value - actual_wait) / max(actual_wait, 1),
                    recorded_at=q.call_time
                )
                session.add(outc)
                pred_id_counter += 1

                c = Consultation(
                    consultation_id=f"C{consult_id_counter:04d}",
                    appointment_id=appt.appointment_id,
                    patient_id=p.patient_id,
                    doctor_id=d.doctor_id,
                    start_time=q.call_time,
                    end_time=q.call_time + timedelta(minutes=random.randint(5, 25)),
                    visit_type=appt.appointment_type
                )
                c.consultation_duration_minutes = (c.end_time - c.start_time).total_seconds() / 60.0
                session.add(c)
                
                if random.random() < 0.6:
                    pr = Prescription(
                        prescription_id=f"PR{presc_id_counter:04d}",
                        consultation_id=c.consultation_id,
                        patient_id=p.patient_id,
                        medicine_id=random.choice(medicines).medicine_id,
                        dose="1 pill",
                        frequency="Twice a day",
                        duration_days=random.randint(3, 7),
                        approved_by_doctor=True
                    )
                    session.add(pr)
                    ms = MedicationSchedule(
                        schedule_id=f"MS{sched_id_counter:04d}",
                        prescription_id=pr.prescription_id,
                        patient_id=p.patient_id,
                        scheduled_time=c.end_time + timedelta(hours=12),
                        status="Pending"
                    )
                    session.add(ms)
                    presc_id_counter += 1
                    sched_id_counter += 1

                queue_id_counter += 1
                consult_id_counter += 1
            
            appointment_id_counter += 1
            
        current_date += timedelta(days=1)
        
    session.commit()
    print("Database and synthetic dataset created successfully at clinic_core.db")

if __name__ == "__main__":
    generate_dataset()
