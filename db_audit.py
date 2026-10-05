import sqlite3
conn = sqlite3.connect(r'd:\ClinicFLow\core_backend\clinic_core_v2.db')
c = conn.cursor()

# Check doctor schema
print("DOCTORS SCHEMA:")
for row in c.execute("PRAGMA table_info(doctors)").fetchall():
    print(" ", row)

print("\nDOCTORS DATA:")
for row in c.execute("SELECT * FROM doctors LIMIT 5").fetchall():
    print(" ", row)

print("\nAPPOINTMENTS SCHEMA:")
for row in c.execute("PRAGMA table_info(appointments)").fetchall():
    print(" ", row)

print("\nQUEUE SCHEMA:")
for row in c.execute("PRAGMA table_info(queue_entries)").fetchall():
    print(" ", row)

print("\nPATIENT JOURNEYS SCHEMA:")
for row in c.execute("PRAGMA table_info(patient_journeys)").fetchall():
    print(" ", row)

print("\nAPPOINTMENT STATUS DISTRIBUTION:")
for row in c.execute("SELECT status, count(*) FROM appointments GROUP BY status").fetchall():
    print(" ", row)

print("\nQUEUE STATUS DISTRIBUTION:")
for row in c.execute("SELECT status, count(*) FROM queue_entries GROUP BY status").fetchall():
    print(" ", row)

print("\nTODAY'S APPOINTMENTS:")
from datetime import datetime
today = datetime.now().strftime('%Y-%m-%d')
for row in c.execute(f"SELECT * FROM appointments WHERE appointment_date LIKE '{today}%' LIMIT 5").fetchall():
    print(" ", row)

conn.close()
