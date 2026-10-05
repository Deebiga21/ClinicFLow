"""
ClinicFlow - Complete Pipeline Dataset Seeder (v4 - final)
"""
import sqlite3
import uuid
import random
from datetime import datetime, timedelta, date
import sys

DB_PATH = r'd:\ClinicFLow\core_backend\clinic_core_v2.db'
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

today = date.today().strftime('%Y-%m-%d')
now = datetime.now()

print(f"Seeding pipeline data for: {today}")
print("=" * 50)

# 1. UPDATE DOCTORS
print("\n[1] Updating Doctors...")
doctors_update = [
    ('D_1', 'Dr. A. Kumar',  'General Medicine', 'General',     14.0, 1),
    ('D_2', 'Dr. R. Sharma', 'Cardiology',       'Cardiology',  22.0, 1),
    ('D_3', 'Dr. S. Mehta',  'Pediatrics',       'Pediatrics',  12.0, 1),
    ('D_4', 'Dr. P. Reddy',  'Orthopedics',      'Orthopedics', 28.0, 1),
]
for doc in doctors_update:
    c.execute(
        "UPDATE doctors SET name=?, specialization=?, department=?, "
        "average_consultation_duration=?, active=? WHERE id=?",
        (doc[1], doc[2], doc[3], doc[4], doc[5], doc[0])
    )
conn.commit()
print("  OK: 4 doctors updated")

# 2. NAMED DEMO PATIENTS
print("\n[2] Seeding Named Demo Patients...")
named_patients = [
    ('P_demo_1', 'PC9001', 'Deepika Subramaniam', 28, 'Female', '9876543210', 'deepika@example.com'),
    ('P_demo_2', 'PC9002', 'Arjun Nair',           35, 'Male',   '9988776655', 'arjun@example.com'),
    ('P_demo_3', 'PC9003', 'Priya Menon',           42, 'Female', '8877665544', 'priya@example.com'),
    ('P_demo_4', 'PC9004', 'Ravi Kumar',            60, 'Male',   '7766554433', 'ravi@example.com'),
    ('P_demo_5', 'PC9005', 'Ananya Krishnan',        8, 'Female', '6655443322', 'ananya@example.com'),
    ('P_demo_6', 'PC9006', 'Karthik Balu',          45, 'Male',   '5544332211', 'karthik@example.com'),
]
for p in named_patients:
    if c.execute("SELECT id FROM patients WHERE id=?", (p[0],)).fetchone():
        c.execute("UPDATE patients SET patient_code=?, name=?, age=?, gender=?, phone=?, email=? WHERE id=?",
                  (p[1], p[2], p[3], p[4], p[5], p[6], p[0]))
    else:
        c.execute("INSERT INTO patients (id, patient_code, name, age, gender, phone, email) VALUES (?,?,?,?,?,?,?)", p)
conn.commit()
print(f"  OK: {len(named_patients)} named patients ensured")

# 3. TODAY'S APPOINTMENTS + QUEUE + JOURNEYS
print("\n[3] Creating Today's Pipeline Records...")

pipeline_config = [
    ('P_demo_1', 'D_1', '09:00', 'New Visit',  'Checked-In', 'A-21', 'Waiting',         'Waiting'),
    ('P_demo_2', 'D_1', '09:30', 'Follow-up',  'Checked-In', 'A-22', 'Waiting',         'Waiting'),
    ('P_demo_3', 'D_2', '10:00', 'New Visit',  'Checked-In', 'A-23', 'In Consultation', 'Consultation'),
    ('P_demo_4', 'D_3', '10:30', 'Follow-up',  'Checked-In', 'A-24', 'Waiting',         'Waiting'),
    ('P_demo_5', 'D_4', '11:00', 'New Visit',  'Scheduled',  'A-25', 'Waiting',         'Waiting'),
    ('P_demo_6', 'D_2', '11:30', 'Follow-up',  'Scheduled',  'A-26', 'Waiting',         'Waiting'),
]

appt_ids  = {}
queue_ids = {}

for i, (pat_id, doc_id, appt_time, appt_type, appt_status, token, q_status, j_stage) in enumerate(pipeline_config):
    old_appts = c.execute("SELECT id FROM appointments WHERE patient_id=? AND appointment_date=?", (pat_id, today)).fetchall()
    for (old_id,) in old_appts:
        c.execute("DELETE FROM queue_entries    WHERE appointment_id=?", (old_id,))
        c.execute("DELETE FROM patient_journeys WHERE appointment_id=?", (old_id,))
        c.execute("DELETE FROM predictions      WHERE appointment_id=?", (old_id,))
    c.execute("DELETE FROM appointments WHERE patient_id=? AND appointment_date=?", (pat_id, today))

    appt_id  = f"APPT_{today.replace('-','')}{i}"
    queue_id = f"QUEUE_{today.replace('-','')}{i}"
    jrny_id  = f"JRNY_{today.replace('-','')}{i}"
    appt_ids[pat_id]  = appt_id
    queue_ids[pat_id] = queue_id

    c.execute("""
        INSERT INTO appointments
          (id, patient_id, doctor_id, appointment_date, appointment_time,
           appointment_type, status, payment_status, token_status, created_at)
        VALUES (?,?,?,?,?,?,?,'Paid',?,?)
    """, (appt_id, pat_id, doc_id, today, appt_time, appt_type, appt_status, token, now.isoformat()))

    entered_at   = (now - timedelta(minutes=random.randint(5, 60))).isoformat()
    called_at    = None
    cons_started = None
    if q_status == 'In Consultation':
        called_at    = (now - timedelta(minutes=5)).isoformat()
        cons_started = called_at

    c.execute("""
        INSERT INTO queue_entries
          (id, appointment_id, patient_id, doctor_id, token_number, queue_position,
           status, entered_queue_at, called_at, consultation_started_at,
           estimated_wait_minutes, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """, (queue_id, appt_id, pat_id, doc_id, 20+i+1, i+1, q_status,
          entered_at, called_at, cons_started, round((i+1)*14.0, 1), now.isoformat()))

    c.execute("""
        INSERT INTO patient_journeys
          (id, patient_id, appointment_id, current_stage, previous_stage,
           stage_started_at, status, created_at)
        VALUES (?,?,?,?,'Waiting',?,'Active',?)
    """, (jrny_id, pat_id, appt_id, j_stage, now.isoformat(), now.isoformat()))

conn.commit()
print(f"  OK: {len(pipeline_config)} appointments/queues/journeys created")

# 4. ML PREDICTIONS
print("\n[4] Running ML waiting-time predictions...")
sys.path.insert(0, r'd:\ClinicFLow\core_backend')
try:
    import joblib, pandas as pd
    model = joblib.load(r'd:\ClinicFLow\core_backend\saved_models\waiting_time_model.pkl')
    cols  = joblib.load(r'd:\ClinicFLow\core_backend\saved_models\waiting_time_columns.pkl')
    for i, (pat_id, doc_id, appt_time, appt_type, *_) in enumerate(pipeline_config):
        row = {
            'patients_ahead': i, 'queue_length': len(pipeline_config),
            'doctor_workload': 2, 'historical_consultation_duration': 14.0,
            'hour': int(appt_time.split(':')[0]), 'day_of_week': now.weekday(),
            'appointment_type_Follow-up': 1 if appt_type == 'Follow-up' else 0,
            'appointment_type_Routine': 0, 'appointment_type_Urgent': 0,
        }
        df = pd.DataFrame([row])
        for col in cols:
            if col not in df.columns: df[col] = 0
        pred = max(0.0, round(float(model.predict(df[cols])[0]), 1))
        pred_id = f"PRED_{today.replace('-','')}{i}"
        c.execute("DELETE FROM predictions WHERE id=?", (pred_id,))
        c.execute("""
            INSERT INTO predictions
              (id, patient_id, appointment_id, prediction_type, model_name, model_version,
               input_timestamp, prediction_value, uncertainty, status, created_at)
            VALUES (?,?,?,'waiting_time','waiting_time_model','v1',?,?,0.15,'Active',?)
        """, (pred_id, pat_id, appt_ids[pat_id], now.isoformat(), pred, now.isoformat()))
        print(f"    {pat_id}: {pred} min ({appt_type})")
    conn.commit()
    print("  OK: ML predictions from trained model")
except Exception as e:
    print(f"  WARN: ML error ({e}), using fallback")
    for i, (pat_id, _, __, appt_type, *rest) in enumerate(pipeline_config):
        pred_id = f"PRED_{today.replace('-','')}{i}"
        c.execute("DELETE FROM predictions WHERE id=?", (pred_id,))
        c.execute("""
            INSERT INTO predictions
              (id, patient_id, appointment_id, prediction_type, model_name, model_version,
               input_timestamp, prediction_value, uncertainty, status, created_at)
            VALUES (?,?,?,'waiting_time','rule_based','rule_v1',?,?,0.30,'Active',?)
        """, (pred_id, pat_id, appt_ids[pat_id], now.isoformat(), i*14.0, now.isoformat()))
        print(f"    {pat_id}: {i*14.0} min (rule-based)")
    conn.commit()

# 5. NOTIFICATIONS - correct schema: id, patient_id, type, title, message, severity, read, created_at
print("\n[5] Seeding Notifications...")
for pat_id, *_ in pipeline_config:
    c.execute("DELETE FROM notifications WHERE patient_id=?", (pat_id,))

notifications = [
    ('P_demo_1', 'appointment', 'Appointment Confirmed', 'Your appointment at 09:00 with Dr. A. Kumar is confirmed. Token: A-21', 'info'),
    ('P_demo_2', 'queue',       'Queue Update',          'Checked in. Token A-22 | 1 patient ahead | Est. wait: 14 min',          'info'),
    ('P_demo_3', 'call',        'Your Turn!',            'Dr. R. Sharma is ready for you. Please proceed to Room 2.',             'success'),
    ('P_demo_4', 'queue',       'Queue Update',          'Token A-24 | Est. wait: 42 min. Please stay nearby.',                   'info'),
    ('P_demo_5', 'appointment', 'Appointment Confirmed', 'Your appointment at 11:00 with Dr. S. Mehta is confirmed. Token: A-25', 'info'),
    ('P_demo_6', 'appointment', 'Appointment Confirmed', 'Your appointment at 11:30 with Dr. R. Sharma is confirmed. Token: A-26','info'),
]
for pat_id, ntype, title, msg, severity in notifications:
    c.execute("""
        INSERT INTO notifications (id, patient_id, type, title, message, severity, read, created_at)
        VALUES (?,?,?,?,?,?,0,?)
    """, (str(uuid.uuid4()), pat_id, ntype, title, msg, severity, now.isoformat()))
conn.commit()
print(f"  OK: {len(notifications)} notifications created")

# 6. PRESCRIPTIONS + BILL for Priya (In Consultation)
print("\n[6] Prescription + Bill for Priya Menon (P_demo_3)...")
presc_meds = [
    ('Paracetamol 500mg', '500mg', 'Twice daily after meals', '5', 'Take with water. Avoid alcohol.'),
    ('Amoxicillin',       '250mg', 'Three times daily',        '7', 'Complete the full course.'),
]
for med, dos, freq, dur, inst in presc_meds:
    c.execute("""
        INSERT INTO prescriptions
          (id, patient_id, appointment_id, doctor_id, consultation_id,
           medicine_name, dosage, frequency, duration_days, instructions,
           prescribed_at, status)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,'Active')
    """, (str(uuid.uuid4()), 'P_demo_3', appt_ids['P_demo_3'], 'D_2', queue_ids['P_demo_3'],
          med, dos, freq, dur, inst, now.isoformat()))

bill_id = f"BILL_{today.replace('-','')}_P3"
c.execute("DELETE FROM bills WHERE id=?", (bill_id,))
c.execute("""
    INSERT INTO bills (id, patient_id, appointment_id, consultation_id, amount, status, created_at)
    VALUES (?,?,?,?,500.0,'Pending',?)
""", (bill_id, 'P_demo_3', appt_ids['P_demo_3'], queue_ids['P_demo_3'], now.isoformat()))
conn.commit()
print(f"  OK: 2 prescriptions + Rs.500 bill created for Priya")

# 7. HISTORICAL PREDICTION OUTCOMES
print("\n[7] Adding 100 historical prediction outcomes (ML training loop)...")
for i in range(100):
    hist_date   = (now - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d')
    pat_id      = f"P_{random.randint(1, 1000)}"
    pred_wait   = random.uniform(5, 60)
    actual_wait = max(0, pred_wait + random.uniform(-10, 15))
    pred_id     = str(uuid.uuid4())
    c.execute("""
        INSERT OR IGNORE INTO predictions
          (id, patient_id, prediction_type, model_name, model_version,
           input_timestamp, prediction_value, uncertainty, status, created_at)
        VALUES (?,?,'waiting_time','waiting_time_model','v1',?,?,0.15,'Completed',?)
    """, (pred_id, pat_id, f"{hist_date} 09:00:00", pred_wait, f"{hist_date} 09:00:00"))
    c.execute("""
        INSERT OR IGNORE INTO prediction_outcomes
          (id, prediction_id, actual_value, absolute_error, percentage_error, recorded_at)
        VALUES (?,?,?,?,?,?)
    """, (str(uuid.uuid4()), pred_id, actual_wait,
          abs(actual_wait - pred_wait),
          round(abs(actual_wait - pred_wait) / max(pred_wait, 1) * 100, 2),
          f"{hist_date} 09:30:00"))
conn.commit()
print("  OK: 100 historical outcomes added")

# SUMMARY
print("\n" + "=" * 70)
print(f"PIPELINE SEEDING COMPLETE - {today}")
print("=" * 70)
print(f"\n{'#':<4} {'Token':<8} {'Patient':<24} {'Doctor':<16} {'Status':<20} {'Wait'}")
print("-" * 80)
for r in c.execute("""
    SELECT q.queue_position, a.token_status, p.name, d.name, q.status, q.estimated_wait_minutes
    FROM   queue_entries q
    JOIN   patients     p ON q.patient_id     = p.id
    JOIN   doctors      d ON q.doctor_id      = d.id
    JOIN   appointments a ON q.appointment_id = a.id
    WHERE  a.appointment_date = ?
    ORDER  BY q.queue_position
""", (today,)).fetchall():
    print(f"{r[0]:<4} {r[1]:<8} {r[2]:<24} {r[3]:<16} {r[4]:<20} {r[5]:.0f} min")

print("\nDatabase is READY for the full end-to-end demo!")
conn.close()
