import sqlite3

db_path = r'd:\ClinicFLow\core_backend\clinic_core_v2.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("""
CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    appointment_id TEXT,
    consultation_id TEXT,
    amount REAL,
    status TEXT,
    created_at DATETIME
)
""")

# Also add receipt table or just receipt_url to payments
try:
    c.execute("ALTER TABLE payments ADD COLUMN bill_id TEXT")
except:
    pass

try:
    c.execute("ALTER TABLE payments ADD COLUMN receipt_generated BOOLEAN DEFAULT 0")
except:
    pass

conn.commit()
conn.close()

with open(r"d:\ClinicFLow\core_backend\database\models.py", "r") as f:
    content = f.read()

new_model = """
class Bill(Base):
    __tablename__ = 'bills'
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey('patients.id'))
    appointment_id = Column(String, ForeignKey('appointments.id'))
    consultation_id = Column(String, nullable=True)
    amount = Column(Float)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
"""
if "class Bill(" not in content:
    content = content.replace("class Payment(Base):", new_model + "\nclass Payment(Base):")
    content = content.replace("transaction_ref = Column(String)", "transaction_ref = Column(String)\n    bill_id = Column(String, nullable=True)\n    receipt_generated = Column(Boolean, default=False)")
    with open(r"d:\ClinicFLow\core_backend\database\models.py", "w") as f:
        f.write(content)

print("DB and Models Updated for Billing")
