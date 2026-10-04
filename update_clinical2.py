import re

with open(r"d:\ClinicFLow\core_backend\routers\clinical.py", "r") as f:
    content = f.read()

new_save_visit = """
@router.post("/api/clinical/visits")
def save_visit(req: VisitCreate):
    from services.orchestration import orchestrator
    import uuid
    import json
    
    with orchestrator.Session() as session:
        # Find active consultation
        q = session.execute(text("SELECT id, patient_id, appointment_id FROM queue_entries WHERE doctor_id = :did AND status = 'In Consultation'"), {'did': req.doctorId}).fetchone()
        if q:
            queue_id = q[0]
            patient_id = q[1]
            appointment_id = q[2]
            
            # 1. Create prescription items
            for rx in req.prescription:
                drug_name = rx.get('drugName', '')
                session.execute(text('''
                    INSERT INTO prescriptions (id, patient_id, appointment_id, doctor_id, consultation_id, medicine_name, dosage, frequency, duration_days, instructions, prescribed_at, status)
                    VALUES (:id, :pat, :app, :doc, :cons, :mname, :dos, :freq, :dur, :inst, CURRENT_TIMESTAMP, 'Active')
                '''), {
                    'id': str(uuid.uuid4()), 'pat': patient_id, 'app': appointment_id, 'doc': req.doctorId, 'cons': queue_id,
                    'mname': drug_name, 'dos': rx.get('dosage', ''), 'freq': rx.get('frequency', ''), 'dur': rx.get('duration', ''),
                    'inst': req.notes
                })
            
            # 2. Update queue to Completed
            session.execute(text("UPDATE queue_entries SET status = 'Completed', consultation_completed_at = CURRENT_TIMESTAMP WHERE id = :id"), {'id': queue_id})
            
            # 3. Create Bill
            bill_id = "BILL_" + str(uuid.uuid4())[:8]
            session.execute(text('''
                INSERT INTO bills (id, patient_id, appointment_id, consultation_id, amount, status, created_at)
                VALUES (:id, :pat, :app, :cons, 500.0, 'Pending', CURRENT_TIMESTAMP)
            '''), {
                'id': bill_id, 'pat': patient_id, 'app': appointment_id, 'cons': queue_id
            })
            
            # 4. Update Patient Journey
            session.execute(text('''
                UPDATE patient_journeys SET previous_stage = current_stage, current_stage = 'Payment', stage_started_at = CURRENT_TIMESTAMP 
                WHERE patient_id = :pat AND appointment_id = :app
            '''), {'pat': patient_id, 'app': appointment_id})
            
            session.commit()
            
            # Emit WS
            orchestrator._broadcast("prescription_created", {"patient_id": patient_id})
            orchestrator._broadcast("bill_created", {"patient_id": patient_id, "bill_id": bill_id})
            orchestrator._broadcast("patient_journey_updated", {"patient_id": patient_id, "stage": "Payment"})
            orchestrator._broadcast("queue_updated", {})
            
            return {'status': 'success'}
        return {'status': 'error', 'message': 'No active consultation found'}
"""

content = re.sub(r'@router\.post\("/api/clinical/visits"\)\ndef save_visit.*?return \{.*?message.*?\}', new_save_visit.strip(), content, flags=re.DOTALL)

with open(r"d:\ClinicFLow\core_backend\routers\clinical.py", "w") as f:
    f.write(content)
print("Updated clinical.py")
