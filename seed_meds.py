import sqlite3
from datetime import datetime, timedelta

conn = sqlite3.connect('core_backend/clinic_core_v2.db')
c = conn.cursor()

# Check if P_1 exists
c.execute("SELECT id FROM patients WHERE id = 'P_1'")
if not c.fetchone():
    c.execute("INSERT INTO patients (id, name, phone, age, gender) VALUES ('P_1', 'John Doe', '555-1234', 35, 'Male')")

# Insert a prescription for P_1
c.execute("INSERT OR IGNORE INTO prescriptions (id, patient_id, appointment_id, doctor_id, consultation_id, medicine_id, medicine_name, dosage, frequency, duration_days, instructions, prescribed_at, status) VALUES ('PR_1', 'P_1', 'A_1', 'D_1', 'C_1', 'M_1', 'Amoxicillin', '500mg', '2 times a day', 5, 'Take after food', CURRENT_TIMESTAMP, 'Active')")

# Insert some medication schedules
now = datetime.now()
schedule_times = [
    now.replace(hour=8, minute=0, second=0).strftime('%H:%M'),
    now.replace(hour=20, minute=0, second=0).strftime('%H:%M')
]

for i, stime in enumerate(schedule_times):
    c.execute("INSERT OR IGNORE INTO medication_schedules (id, prescription_id, patient_id, medicine_id, scheduled_date, scheduled_time, frequency, status, created_at) VALUES (?, 'PR_1', 'P_1', 'M_1', ?, ?, 'Daily', 'Upcoming', CURRENT_TIMESTAMP)", (f'MS_{i+1}', now.strftime('%Y-%m-%d'), stime))

conn.commit()
conn.close()
print("Data seeded")
