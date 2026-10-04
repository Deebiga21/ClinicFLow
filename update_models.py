with open(r"d:\ClinicFLow\core_backend\database\models.py", "r") as f:
    content = f.read()

new_models = """
class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True)
    role = Column(String)
    phone = Column(String)
    email = Column(String)
    password_hash = Column(String)
    patient_id = Column(String, nullable=True)
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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
"""

if "class User(" not in content:
    content = content.replace("class Patient(Base):", new_models + "\nclass Patient(Base):")
    
    # Also update Appointment
    content = content.replace(
        "appointment_type = Column(String)",
        "appointment_type = Column(String)\n    payment_status = Column(String, default='Pending')\n    token_status = Column(String, default='Pending')"
    )

with open(r"d:\ClinicFLow\core_backend\database\models.py", "w") as f:
    f.write(content)
print("Updated models.py")
