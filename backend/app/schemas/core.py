from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class PatientBase(BaseModel):
    name: str
    age: int
    gender: str
    contact: str
    registration_date: datetime = Field(default_factory=datetime.utcnow)
    visit_count: int = 0
    previous_no_show_count: int = 0
    status: str = "Active"

class Patient(PatientBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DoctorBase(BaseModel):
    name: str
    specialization: str
    department: str
    working_start: str = "09:00"
    working_end: str = "17:00"
    historical_average_consultation_duration: float = 15.0
    capacity: int = 40
    status: str = "Active"

class Doctor(DoctorBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AppointmentBase(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_date: str # YYYY-MM-DD
    appointment_time: str # HH:MM
    booking_time: datetime = Field(default_factory=datetime.utcnow)
    appointment_type: str = "General"
    lead_time_hours: float = 0.0
    status: str = "Scheduled"
    no_show: bool = False

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    arrival_time: Optional[datetime] = None
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class QueueBase(BaseModel):
    appointment_id: str
    patient_id: str
    doctor_id: str
    token_number: int
    arrival_time: datetime
    check_in_time: datetime
    queue_position: int
    patients_ahead: int
    status: str = "Waiting"

class QueueItem(QueueBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    call_time: Optional[datetime] = None
    consultation_start: Optional[datetime] = None
    consultation_end: Optional[datetime] = None
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class PatientJourneyBase(BaseModel):
    patient_id: str
    appointment_id: str

class PatientJourney(PatientJourneyBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    current_stage: str = "Registration"
    arrival_time: Optional[datetime] = None
    registration_time: Optional[datetime] = None
    nurse_start: Optional[datetime] = None
    doctor_start: Optional[datetime] = None
    doctor_end: Optional[datetime] = None
    diagnostic_start: Optional[datetime] = None
    diagnostic_end: Optional[datetime] = None
    pharmacy_start: Optional[datetime] = None
    pharmacy_end: Optional[datetime] = None
    exit_time: Optional[datetime] = None
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ConsultationBase(BaseModel):
    appointment_id: str
    patient_id: str
    doctor_id: str
    start_time: datetime
    visit_type: str = "General"

class Consultation(ConsultationBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    end_time: Optional[datetime] = None
    consultation_duration_minutes: Optional[float] = None
    notes: Optional[str] = ""
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class PrescriptionBase(BaseModel):
    consultation_id: str
    patient_id: str
    medicine_id: str
    dose: str
    frequency: str
    duration_days: int
    approved_by_doctor: bool = True

class Prescription(PrescriptionBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MedicationScheduleBase(BaseModel):
    prescription_id: str
    patient_id: str
    scheduled_time: datetime
    status: str = "Pending" # Pending, Taken, Missed

class MedicationSchedule(MedicationScheduleBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MedicationEvent(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    schedule_id: str
    action_time: datetime
    status: str
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MedicineBase(BaseModel):
    medicine_name: str
    category: str

class Medicine(MedicineBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MedicineBatch(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    medicine_id: str
    quantity: int
    purchase_date: datetime
    expiry_date: datetime
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class InventoryTransaction(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    medicine_id: str
    batch_id: Optional[str] = None
    quantity_change: int
    transaction_date: datetime = Field(default_factory=datetime.utcnow)
    transaction_type: str # Dispense, Restock, Expired
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Prediction(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: Optional[str] = None
    appointment_id: Optional[str] = None
    prediction_type: str # waiting_time, consultation_duration, no_show, congestion, doctor_workload, medicine_demand
    model_name: str
    model_version: str
    input_timestamp: datetime = Field(default_factory=datetime.utcnow)
    prediction_value: float
    confidence_or_uncertainty: float
    status: str = "Predicted"
    features_used: Dict[str, Any] = {}
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class PredictionOutcome(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    prediction_id: str
    actual_value: float
    absolute_error: float
    percentage_error: float
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Recommendation(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    prediction_id: str
    action_suggested: str
    status: str = "Pending"
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ModelVersion(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_name: str
    version: str
    trained_at: datetime
    metrics: Dict[str, float]
    is_active: bool = False
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class StandardResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
