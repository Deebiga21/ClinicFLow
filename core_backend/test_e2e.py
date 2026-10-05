import requests

BASE_URL = "http://localhost:8000"

print("1. Get an appointment")
appts = requests.get(f"{BASE_URL}/api/appointments").json()["data"]
appt = next((a for a in appts if a["status"] == "Scheduled"), None)

if not appt:
    print("No scheduled appointments found.")
    exit()

appt_id = appt["appointment_id"]
pat_id = appt["patient_id"]
doc_id = appt["doctor_id"]
print(f"Testing with Appt: {appt_id}, Patient: {pat_id}")

print("\n2. Check-in")
res = requests.post(f"{BASE_URL}/api/pipeline/check-in", json={"appointment_id": appt_id}).json()
print(res)
queue_id = res.get("queue_id")

print("\n3. Update Readiness")
res = requests.post(f"{BASE_URL}/api/pipeline/readiness", json={"patient_id": pat_id, "readiness_score": 100}).json()
print(res)

print("\n4. Call Next")
res = requests.post(f"{BASE_URL}/api/pipeline/call-next", json={"queue_id": queue_id}).json()
print(res)

print("\n5. Start Consultation")
res = requests.post(f"{BASE_URL}/api/pipeline/consultation/start", json={"queue_id": queue_id}).json()
print(res)
consult_id = res.get("consultation_id")

print("\n6. End Consultation")
res = requests.post(f"{BASE_URL}/api/pipeline/consultation/end", json={"consultation_id": consult_id, "actual_duration_minutes": 15.5}).json()
print(res)

print("\n7. Create Prescription")
res = requests.post(f"{BASE_URL}/api/pipeline/prescription", json={
    "patient_id": pat_id,
    "appointment_id": appt_id,
    "doctor_id": doc_id,
    "consultation_id": consult_id,
    "medicine_name": "Amoxicillin",
    "dosage": "500mg",
    "frequency": "Twice daily",
    "duration_days": 5
}).json()
print(res)

print("\n8. Get Patient Journey")
res = requests.get(f"{BASE_URL}/api/patient-journey/{pat_id}").json()
print([r.get("current_stage") for r in res])
