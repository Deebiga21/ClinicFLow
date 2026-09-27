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
    status: str = "Active"

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class DoctorBase(BaseModel):
    name: str
    specialization: str
    department: str
    working_hours: str
    capacity: int = 40
    status: str = "Active"

class DoctorCreate(DoctorBase):
    pass

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
    visit_type: str = "General"

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    status: str = "Scheduled"
    arrival_time: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class QueueBase(BaseModel):
    appointment_id: str
    patient_id: str
    doctor_id: str
    token_number: int

class QueueCreate(QueueBase):
    pass

class QueueItem(QueueBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    queue_position: int
    arrival_time: datetime
    called_at: Optional[datetime] = None
    consultation_start: Optional[datetime] = None
    consultation_end: Optional[datetime] = None
    status: str = "Waiting" # Waiting, In Consultation, Completed, Cancelled
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
    visit_type: str

class Consultation(ConsultationBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    start_time: datetime
    end_time: Optional[datetime] = None
    actual_duration: Optional[int] = None # in seconds
    predicted_duration: Optional[int] = None # in seconds
    complexity: Optional[str] = "Low"
    notes: Optional[str] = ""
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class StandardResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
