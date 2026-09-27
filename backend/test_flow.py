import requests

BASE_URL = "http://localhost:5000/api"

# 1. Create Appointment
print("Creating Appointment...")
resp = requests.post(f"{BASE_URL}/appointments/", json={
    "patient_id": "P001",
    "doctor_id": "D001",
    "appointment_date": "2026-10-01",
    "appointment_time": "10:00",
    "visit_type": "General"
})
print(resp.json())
appt_id = resp.json()["data"]["id"]

# 2. Check-in Appointment
print("Checking in Appointment...")
resp = requests.post(f"{BASE_URL}/appointments/{appt_id}/check-in")
print(resp.json())

# 3. Call Next
print("Calling next patient...")
resp = requests.post(f"{BASE_URL}/queue/call-next?doctor_id=D001")
print(resp.json())
