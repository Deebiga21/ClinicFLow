import sqlite3
import uuid
from datetime import datetime, timedelta

db_path = 'd:/clinic-queue -updated/core_backend/clinic_core_v2.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

now = datetime.now()
today_str = now.strftime('%Y-%m-%d')
tomorrow_str = (now + timedelta(days=1)).strftime('%Y-%m-%d')

patient_id = 'P_demo_1'

meds = [
    ('Amoxicillin 500mg', '500mg', 'Twice daily', '7', 'Take after meals'),
    ('Paracetamol 650mg', '650mg', 'Three times daily', '3', 'Take when fever > 100F'),
    ('Vitamin C Complex', '1 tablet', 'Once daily', '30', 'Take in the morning')
]

for med, dos, freq, dur, inst in meds:
    presc_id = str(uuid.uuid4())
    c.execute('''
        INSERT INTO prescriptions (id, patient_id, medicine_name, dosage, frequency, duration_days, instructions, prescribed_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    ''', (presc_id, patient_id, med, dos, freq, dur, inst, now.isoformat()))
    
    times = []
    if freq == 'Twice daily':
        times = ['09:00 AM', '09:00 PM']
    elif freq == 'Three times daily':
        times = ['08:00 AM', '02:00 PM', '08:00 PM']
    elif freq == 'Once daily':
        times = ['08:00 AM']
        
    for t in times:
        sch_id = str(uuid.uuid4())
        c.execute('''
            INSERT INTO medication_schedules (id, prescription_id, patient_id, medicine_id, scheduled_date, scheduled_time, frequency, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
        ''', (sch_id, presc_id, patient_id, med, today_str, t, freq, now.isoformat()))
        
conn.commit()
conn.close()
print("Data inserted for P_demo_1")
