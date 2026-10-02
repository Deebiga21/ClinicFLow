import re

with open("core_backend/database/models.py", "r") as f:
    code = f.read()

new_models = """
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
"""

if "class Anomaly(Base):" not in code:
    code = code.replace('if __name__ == "__main__":', new_models + '\n\nif __name__ == "__main__":')
    with open("core_backend/database/models.py", "w") as f:
        f.write(code)
