with open('core_backend/routers/clinical.py', 'a') as f:
    f.write("""
from typing import List, Optional
import json

class VisitCreate(BaseModel):
    tokenNumber: str
    patientName: str
    doctorId: str
    doctorName: str
    department: str
    diagnosis: str
    prescription: List[str]
    notes: str
    status: str

@router.post('/api/visits')
def save_visit(req: VisitCreate):
    with orchestrator.Session() as session:
        q = session.execute(text("SELECT id, patient_id FROM queue_entries WHERE doctor_id = :did AND status = 'In Consultation'"), {'did': req.doctorId}).fetchone()
        if q:
            queue_id = q[0]
            patient_id = q[1]
            pres_id = str(uuid.uuid4())
            meds_json = json.dumps(req.prescription)
            session.execute(text('''
                INSERT INTO prescriptions (id, consultation_id, patient_id, doctor_id, medications, notes, status, created_at)
                VALUES (:pid, :cid, :patid, :did, :meds, :notes, 'Active', CURRENT_TIMESTAMP)
            '''), {
                'pid': pres_id,
                'cid': queue_id,
                'patid': patient_id,
                'did': req.doctorId,
                'meds': meds_json,
                'notes': req.notes + " | Diagnosis: " + req.diagnosis
            })
            if req.status == 'done':
                session.execute(text("UPDATE queue_entries SET status = 'Completed', consultation_completed_at = CURRENT_TIMESTAMP WHERE id = :id"), {'id': queue_id})
            session.commit()
            return {'status': 'success'}
        return {'status': 'error', 'message': 'No active consultation found'}
""")
