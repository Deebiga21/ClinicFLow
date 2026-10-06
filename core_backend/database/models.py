import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()


class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True)
    role = Column(String)
    phone = Column(String)
    email = Column(String)
    password_hash = Column(String)
    patient_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Bill(Base):
    __tablename__ = 'bills'
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey('patients.id'))
    appointment_id = Column(String, ForeignKey('appointments.id'))
    consultation_id = Column(String, nullable=True)
    amount = Column(Float)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Payment(Base):
    __tablename__ = 'payments'
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey('patients.id'))
    appointment_id = Column(String, ForeignKey('appointments.id'))
    amount = Column(Float)
    status = Column(String)
    payment_method = Column(String)
    transaction_ref = Column(String)
    bill_id = Column(String, nullable=True)
    receipt_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Patient(Base):
    __tablename__ = 'patients'
    id = Column(String, primary_key=True)
    patient_code = Column(String)
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    phone = Column(String)
    email = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Doctor(Base):
    __tablename__ = 'doctors'
    id = Column(String, primary_key=True)
    name = Column(String)
    specialization = Column(String)
    department = Column(String)
    average_consultation_duration = Column(Float)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Appointment(Base):
    __tablename__ = 'appointments'
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey('patients.id'))
    doctor_id = Column(String, ForeignKey('doctors.id'))
    appointment_date = Column(String)
    appointment_time = Column(String)
    appointment_type = Column(String)
    payment_status = Column(String, default='Pending')
    token_status = Column(String, default='Pending')
    status = Column(String)
    check_in_time = Column(DateTime, nullable=True)
    cancellation_time = Column(DateTime, nullable=True)
    no_show = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class QueueEntry(Base):
    __tablename__ = 'queue_entries'
    id = Column(String, primary_key=True)
    appointment_id = Column(String, ForeignKey('appointments.id'))
    patient_id = Column(String, ForeignKey('patients.id'))
    doctor_id = Column(String, ForeignKey('doctors.id'))
    token_number = Column(Integer)
    queue_position = Column(Integer)
    status = Column(String)
    entered_queue_at = Column(DateTime)
    called_at = Column(DateTime, nullable=True)
    consultation_started_at = Column(DateTime, nullable=True)
    consultation_completed_at = Column(DateTime, nullable=True)
    estimated_wait_minutes = Column(Float, nullable=True)
    actual_wait_minutes = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class PatientJourney(Base):
    __tablename__ = 'patient_journeys'
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey('patients.id'))
    appointment_id = Column(String, ForeignKey('appointments.id'))
    current_stage = Column(String)
    previous_stage = Column(String, nullable=True)
    stage_started_at = Column(DateTime)
    stage_completed_at = Column(DateTime, nullable=True)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PatientReadiness(Base):
    __tablename__ = 'patient_readiness'
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey('patients.id'))
    appointment_id = Column(String, ForeignKey('appointments.id'))
    visit_type = Column(String)
    intake_status = Column(String)
    required_information = Column(JSON)
    completed_information = Column(JSON)
    missing_information = Column(JSON)
    readiness_score = Column(Float)
    estimated_complexity = Column(String)
    predicted_consultation_duration = Column(Float, nullable=True)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Consultation(Base):
    __tablename__ = 'consultations'
    id = Column(String, primary_key=True)
    appointment_id = Column(String, ForeignKey('appointments.id'))
    patient_id = Column(String, ForeignKey('patients.id'))
    doctor_id = Column(String, ForeignKey('doctors.id'))
    started_at = Column(DateTime)
    completed_at = Column(DateTime, nullable=True)
    actual_duration_minutes = Column(Float, nullable=True)
    predicted_duration_minutes = Column(Float, nullable=True)
    duration_error = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String)

class Prescription(Base):
    __tablename__ = 'prescriptions'
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey('patients.id'))
    appointment_id = Column(String, ForeignKey('appointments.id'))
    doctor_id = Column(String, ForeignKey('doctors.id'))
    consultation_id = Column(String, ForeignKey('consultations.id'))
    medicine_id = Column(String)
    medicine_name = Column(String)
    dosage = Column(String)
    frequency = Column(String)
    duration_days = Column(Integer)
    instructions = Column(Text)
    prescribed_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String)

class MedicationSchedule(Base):
    __tablename__ = 'medication_schedules'
    id = Column(String, primary_key=True)
    prescription_id = Column(String, ForeignKey('prescriptions.id'))
    patient_id = Column(String, ForeignKey('patients.id'))
    medicine_id = Column(String)
    scheduled_date = Column(String)
    scheduled_time = Column(String)
    frequency = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class MedicationEvent(Base):
    __tablename__ = 'medication_events'
    id = Column(String, primary_key=True)
    medication_schedule_id = Column(String, ForeignKey('medication_schedules.id'))
    patient_id = Column(String, ForeignKey('patients.id'))
    scheduled_time = Column(DateTime)
    event_time = Column(DateTime, nullable=True)
    status = Column(String)
    recorded_at = Column(DateTime, nullable=True)

class Medicine(Base):
    __tablename__ = 'medicines'
    id = Column(String, primary_key=True)
    name = Column(String)
    category = Column(String)
    unit = Column(String)
    reorder_level = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class MedicineBatch(Base):
    __tablename__ = 'medicine_batches'
    id = Column(String, primary_key=True)
    medicine_id = Column(String, ForeignKey('medicines.id'))
    batch_number = Column(String)
    quantity = Column(Integer)
    expiry_date = Column(DateTime)
    received_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class InventoryTransaction(Base):
    __tablename__ = 'inventory_transactions'
    id = Column(String, primary_key=True)
    medicine_id = Column(String, ForeignKey('medicines.id'))
    batch_id = Column(String, ForeignKey('medicine_batches.id'))
    transaction_type = Column(String)
    quantity = Column(Integer)
    reference_type = Column(String)
    reference_id = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Prediction(Base):
    __tablename__ = 'predictions'
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey('patients.id'), nullable=True)
    appointment_id = Column(String, ForeignKey('appointments.id'), nullable=True)
    prediction_type = Column(String)
    model_name = Column(String)
    model_version = Column(String)
    input_timestamp = Column(DateTime)
    prediction_value = Column(Float)
    uncertainty = Column(Float, nullable=True)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PredictionOutcome(Base):
    __tablename__ = 'prediction_outcomes'
    id = Column(String, primary_key=True)
    prediction_id = Column(String, ForeignKey('predictions.id'))
    actual_value = Column(Float)
    absolute_error = Column(Float)
    percentage_error = Column(Float)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

class ModelVersion(Base):
    __tablename__ = 'model_versions'
    id = Column(String, primary_key=True)
    model_name = Column(String)
    version = Column(String)
    training_date = Column(DateTime)
    training_rows = Column(Integer)
    features = Column(JSON)
    target = Column(String)
    metrics = Column(JSON)
    model_path = Column(String)
    status = Column(String)

class Recommendation(Base):
    __tablename__ = 'recommendations'
    id = Column(String, primary_key=True)
    recommendation_type = Column(String)
    related_patient_id = Column(String, ForeignKey('patients.id'), nullable=True)
    related_doctor_id = Column(String, ForeignKey('doctors.id'), nullable=True)
    message = Column(String)
    reason = Column(String)
    priority = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Anomaly(Base):
    __tablename__ = 'anomalies'
    id = Column(String, primary_key=True)
    type = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    observed_value = Column(Float, nullable=True)
    expected_value = Column(Float, nullable=True)
    severity = Column(String)
    status = Column(String)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey('patients.id'), nullable=True)
    type = Column(String)
    title = Column(String)
    message = Column(String)
    severity = Column(String)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    id = Column(String, primary_key=True)
    sender_id = Column(String)
    sender_role = Column(String)
    receiver_id = Column(String, nullable=True) # Optional direct receiver
    channel = Column(String) # 'clinic_operations', 'nurse_chat', 'bot'
    message = Column(Text)
    message_type = Column(String, default="text") # 'text', 'alert', 'system'
    related_entity_type = Column(String, nullable=True) # 'patient', 'queue', 'doctor'
    related_entity_id = Column(String, nullable=True)
    status = Column(String, default="sent") # 'sent', 'read'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

if __name__ == "__main__":
    db_path = 'sqlite:///d:/clinic-queue -updated/core_backend/clinic_core_v2.db' # Fixed path for execution
    engine = create_engine(db_path)
    Base.metadata.create_all(engine)
    print("Database clinic_core_v2.db created with all tables.")
