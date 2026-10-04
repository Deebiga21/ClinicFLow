import sqlite3
import os

db_path = r'd:\ClinicFLow\core_backend\clinic_core_v2.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Create Auth Users table
c.execute("""
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    role TEXT,
    phone TEXT,
    email TEXT,
    password_hash TEXT,
    patient_id TEXT,
    created_at DATETIME
)
""")

# Create Payments table
c.execute("""
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    appointment_id TEXT,
    amount REAL,
    status TEXT,
    payment_method TEXT,
    transaction_ref TEXT,
    created_at DATETIME
)
""")

# Also let's add these missing columns safely to appointment if needed
try:
    c.execute("ALTER TABLE appointments ADD COLUMN payment_status TEXT DEFAULT 'Pending'")
    c.execute("ALTER TABLE appointments ADD COLUMN token_status TEXT DEFAULT 'Pending'")
except:
    pass

conn.commit()
conn.close()
print("Schema updated.")
