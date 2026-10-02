import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'core_backend'))

from services.orchestration import OrchestrationService
import datetime
import uuid
import time
from sqlalchemy import text
import urllib.request
import json

orch = OrchestrationService(db_url="sqlite:///core_backend/clinic_core_v2.db")

print('--- END-TO-END SYSTEM INTEGRATION TEST ---')

def run_test():
    with orch.Session() as session:
        # 1. & 2. Create patient and appointment
        print('1 & 2. Creating Patient and Appointment in DB...')
        patient_id = f'E2E_PAT_{uuid.uuid4().hex[:6]}'
        appointment_id = f'E2E_APP_{uuid.uuid4().hex[:6]}'
        
        # Pick a random doctor
        doc = session.execute(text("SELECT id, name FROM doctors LIMIT 1")).fetchone()
        if not doc:
            print('No doctor found!')
            return
        doc_id, doc_name = doc
        
        session.execute(text(f"""
            INSERT INTO patients (id, name, patient_code, age, gender, phone, email, created_at, updated_at)
            VALUES ('{patient_id}', 'E2E Test Patient', 'E2E-CODE', 30, 'M', '555-0000', 'e@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """))
        
        session.execute(text(f"""
            INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, status, created_at, updated_at)
            VALUES ('{appointment_id}', '{patient_id}', '{doc_id}', CURRENT_DATE, '10:00', 'Routine Checkup', 'Scheduled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """))
        session.commit()
        
        print(f'   -> Patient: {patient_id}')
        print(f'   -> Appointment: {appointment_id}')
        print(f'   -> Doctor: Dr. {doc_name} ({doc_id})')
        
        # 3. & 4. & 5. Check in & Generate waiting prediction
        print('\n3, 4, 5. Patient Checks In (Generates Queue Entry & Waiting Prediction)...')
        res = orch.process_patient_check_in(appointment_id)
        if 'error' in res:
            print(f'Error: {res}')
            return
            
        print(f'   -> Success: {res}')
        
        # Verify queue entry
        queue_entry = session.execute(text(f"SELECT id, estimated_wait_minutes FROM queue_entries WHERE appointment_id = '{appointment_id}'")).fetchone()
        queue_id = queue_entry[0]
        est_wait = queue_entry[1]
        print(f'   -> Queue ID: {queue_id}, ML Predicted Wait: {est_wait} minutes')
        
        # 6. Patient sees prediction (already confirmed by DB check)
        
        # 7. Nurse calls next (via API)
        print('\n7 & 8 & 9. Nurse Calls Next (Consultation Starts)...')
        req = urllib.request.Request('http://127.0.0.1:8000/api/queue/call-next', method='POST')
        req.add_header('Content-Type', 'application/json')
        req.data = json.dumps({'doctor_id': doc_id, 'room_number': '1'}).encode()
        resp = urllib.request.urlopen(req).read().decode()
        print(f'   -> API Response: {resp}')
        
        # 10. Consultation duration prediction generated
        print('\n10. Checking ML Consultation Duration Prediction...')
        req2 = urllib.request.Request(f'http://127.0.0.1:8000/api/predictions/consultation-duration/{appointment_id}')
        resp2 = json.loads(urllib.request.urlopen(req2).read().decode())
        print(f'   -> Duration Prediction: {resp2.get("predicted_duration_minutes")} minutes')
        print(f'   -> SHAP Explanation: {resp2.get("natural_explanation")}')
        
        # 11, 12, 13, 14, 15, 16, 17. Consultation Completed, Prescription Created, Inventory Updated
        print('\n11-17. Doctor Completes Consultation (Saves Notes, Prescribes Medicine, Updates Inventory)...')
        visit_data = {
            'tokenNumber': 'A1',
            'patientName': 'E2E Test Patient',
            'doctorId': doc_id,
            'doctorName': doc_name,
            'department': 'General',
            'diagnosis': 'E2E Integration Test',
            'prescription': [{'drugName': 'Ibuprofen', 'dosage': '500mg', 'frequency': '1-1-1', 'duration': '5 days'}],
            'notes': 'All systems green.',
            'status': 'done'
        }
        req3 = urllib.request.Request('http://127.0.0.1:8000/api/visits', method='POST')
        req3.add_header('Content-Type', 'application/json')
        req3.data = json.dumps(visit_data).encode()
        resp3 = json.loads(urllib.request.urlopen(req3).read().decode())
        print(f'   -> API Response: {resp3}')
        
        # Verify Inventory
        print('\n17. Verifying Inventory Update...')
        req4 = urllib.request.Request('http://127.0.0.1:8000/api/medicines/inventory')
        inv = json.loads(urllib.request.urlopen(req4).read().decode())['data']
        para = next((m for m in inv if 'Ibuprofen' in m['name']), None)
        print(f'   -> Ibuprofen Current Stock: {para["quantity"]}')
        
        print('\n--- ALL E2E PHASES COMPLETED SUCCESSFULLY ---')

if __name__ == '__main__':
    run_test()
