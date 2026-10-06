import sqlite3
import uuid
import datetime

conn = sqlite3.connect('clinic_core_v2.db')
c = conn.cursor()

patient_id = "P_deepika"
doctor_id = "D_1"

# Prescription 1 (Prenatal Vitamins)
presc_id_1 = str(uuid.uuid4())
c.execute("""
INSERT INTO prescriptions (id, patient_id, doctor_id, medicine_name, dosage, frequency, duration_days, instructions, prescribed_at, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (presc_id_1, patient_id, doctor_id, "Prenatal Multi-Vitamin", "1 Tablet", "Once daily", 30, "Take after breakfast with water", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "Active"))

# Schedule for Prescription 1
sched_id_1 = str(uuid.uuid4())
c.execute("""
INSERT INTO medication_schedules (id, prescription_id, patient_id, scheduled_date, scheduled_time, frequency, status, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (sched_id_1, presc_id_1, patient_id, datetime.datetime.now().strftime("%Y-%m-%d"), "09:00 AM", "Once daily", "Pending", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")))


# Prescription 2 (Iron Supplement)
presc_id_2 = str(uuid.uuid4())
c.execute("""
INSERT INTO prescriptions (id, patient_id, doctor_id, medicine_name, dosage, frequency, duration_days, instructions, prescribed_at, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (presc_id_2, patient_id, doctor_id, "Ferrous Sulfate (Iron)", "325 mg", "Twice daily", 15, "Take with vitamin C (orange juice) for better absorption", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "Active"))

# Schedule for Prescription 2 (Morning)
sched_id_2 = str(uuid.uuid4())
c.execute("""
INSERT INTO medication_schedules (id, prescription_id, patient_id, scheduled_date, scheduled_time, frequency, status, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (sched_id_2, presc_id_2, patient_id, datetime.datetime.now().strftime("%Y-%m-%d"), "08:00 AM", "Twice daily", "Taken", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

# Schedule for Prescription 2 (Evening)
sched_id_3 = str(uuid.uuid4())
c.execute("""
INSERT INTO medication_schedules (id, prescription_id, patient_id, scheduled_date, scheduled_time, frequency, status, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (sched_id_3, presc_id_2, patient_id, datetime.datetime.now().strftime("%Y-%m-%d"), "08:00 PM", "Twice daily", "Pending", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

conn.commit()
print("Synthetic prescriptions injected successfully.")
