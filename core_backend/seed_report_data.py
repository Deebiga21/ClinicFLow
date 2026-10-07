import sqlite3
import uuid
from datetime import datetime, timedelta
import json

db_path = 'clinic_core_v2.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

now = datetime.now()

# ---------------------------------------------------------
# 1. SEED ML MODEL CENTER (Figure 6.7)
# ---------------------------------------------------------
c.execute("DELETE FROM model_versions")

models = [
    {
        "name": "Waiting Time Prediction", "version": "1.4.2", "rows": 8412, 
        "target": "actual_wait_minutes", "metrics": {"MAE": 3.04, "R2": 0.897}, 
        "status": "Active"
    },
    {
        "name": "Consultation Duration", "version": "2.1.0", "rows": 8412, 
        "target": "consultation_duration", "metrics": {"MAE": 3.93, "R2": 0.146}, 
        "status": "Active"
    },
    {
        "name": "Patient No-Show", "version": "3.0.1", "rows": 8412, 
        "target": "no_show_boolean", "metrics": {"ROC-AUC": 0.68}, 
        "status": "Active"
    },
    {
        "name": "Operational Anomaly", "version": "1.0.5", "rows": 8500, 
        "target": "anomaly_score", "metrics": {"Contamination": 0.05, "Outliers_Detected": 142}, 
        "status": "Active"
    },
    {
        "name": "Medicine Demand Forecast", "version": "1.0.0", "rows": 45000, 
        "target": "weekly_demand", "metrics": {}, 
        "status": "Training"
    }
]

for m in models:
    c.execute("""
        INSERT INTO model_versions (id, model_name, version, training_date, training_rows, features, target, metrics, model_path, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        str(uuid.uuid4()), m["name"], m["version"], (now - timedelta(days=2)).isoformat(), 
        m["rows"], '["day_of_week", "hour", "doctor_workload", "queue_size"]', 
        m["target"], json.dumps(m["metrics"]), f"/models/{m['name'].replace(' ', '_')}.pkl", m["status"]
    ))


# ---------------------------------------------------------
# 2. SEED MEDICINE INTELLIGENCE (Figure 6.6)
# ---------------------------------------------------------
c.execute("DELETE FROM inventory_transactions")
c.execute("DELETE FROM medicine_batches")
c.execute("DELETE FROM medicines")

meds = [
    {"id": "M1", "name": "Amoxicillin 500mg", "cat": "Antibiotic", "reorder": 500},
    {"id": "M2", "name": "Paracetamol 650mg", "cat": "Analgesic", "reorder": 1000},
    {"id": "M3", "name": "Metformin 500mg", "cat": "Antidiabetic", "reorder": 300},
    {"id": "M4", "name": "Atorvastatin 20mg", "cat": "Cardiovascular", "reorder": 200},
    {"id": "M5", "name": "Omeprazole 40mg", "cat": "Gastrointestinal", "reorder": 400},
]

for m in meds:
    c.execute("INSERT INTO medicines (id, name, category, unit, reorder_level, created_at) VALUES (?, ?, ?, ?, ?, ?)",
              (m["id"], m["name"], m["cat"], "Tablet", m["reorder"], now.isoformat()))

batches = [
    # M1: Healthy stock
    {"mid": "M1", "batch": "AMX-24A", "qty": 1200, "expiry": now + timedelta(days=365)},
    # M2: Near expiry (Critical Alert)
    {"mid": "M2", "batch": "PAR-23C", "qty": 450, "expiry": now + timedelta(days=12)},
    # M3: Low stock
    {"mid": "M3", "batch": "MET-24B", "qty": 150, "expiry": now + timedelta(days=180)},
    # M4: Very expired (Waste)
    {"mid": "M4", "batch": "ATO-22A", "qty": 80, "expiry": now - timedelta(days=45)},
]

for b in batches:
    c.execute("INSERT INTO medicine_batches (id, medicine_id, batch_number, quantity, expiry_date, received_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
              (str(uuid.uuid4()), b["mid"], b["batch"], b["qty"], b["expiry"].isoformat(), (now - timedelta(days=100)).isoformat(), now.isoformat()))


# ---------------------------------------------------------
# 3. SEED PATIENT JOURNEY TIMELINE (Figure 6.5)
# ---------------------------------------------------------
# We will create a rich timeline for Patient P_1
c.execute("DELETE FROM patient_journeys WHERE patient_id = 'P_1'")

journey_stages = [
    {"stage": "Appointment", "status": "Completed", "start": -120, "end": -119},
    {"stage": "Check-in", "status": "Completed", "start": -45, "end": -44},
    {"stage": "Queue", "status": "Completed", "start": -44, "end": -18},
    {"stage": "Nurse", "status": "Completed", "start": -18, "end": -12},
    {"stage": "Doctor", "status": "Completed", "start": -12, "end": -2},
    {"stage": "Consultation", "status": "Completed", "start": -12, "end": -2},
    {"stage": "Prescription", "status": "Completed", "start": -3, "end": -2},
    {"stage": "Medication", "status": "In Progress", "start": -2, "end": None},
]

prev = None
for j in journey_stages:
    start_t = now + timedelta(minutes=j["start"])
    end_t = (now + timedelta(minutes=j["end"])) if j["end"] else None
    
    c.execute("""
        INSERT INTO patient_journeys (id, patient_id, appointment_id, current_stage, previous_stage, stage_started_at, stage_completed_at, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), "P_1", "A_1", j["stage"], prev, start_t.isoformat(), end_t.isoformat() if end_t else None, j["status"], start_t.isoformat()))
    prev = j["stage"]


# ---------------------------------------------------------
# 4. SEED WAITING TIME PREDICTIONS (Figure 6.4)
# ---------------------------------------------------------
c.execute("DELETE FROM predictions")
preds = [
    {"pid": "P_1", "type": "waiting_time", "val": 18.5, "unc": 2.1},
    {"pid": "P_2", "type": "waiting_time", "val": 24.2, "unc": 3.4},
    {"pid": "P_3", "type": "waiting_time", "val": 32.0, "unc": 4.5},
    {"pid": "P_4", "type": "waiting_time", "val": 12.8, "unc": 1.8},
    {"pid": "P_1", "type": "consultation_duration", "val": 15.0, "unc": 2.0},
    {"pid": "P_2", "type": "no_show", "val": 0.12, "unc": 0.05}
]

for p in preds:
    c.execute("""
        INSERT INTO predictions (id, patient_id, appointment_id, prediction_type, model_name, model_version, input_timestamp, prediction_value, uncertainty, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), p["pid"], "A_1", p["type"], "XGBoost Flow Model", "1.4.2", now.isoformat(), p["val"], p["unc"], "Generated", now.isoformat()))


conn.commit()
conn.close()
print("Synthetic data seeded successfully for all report figures.")
