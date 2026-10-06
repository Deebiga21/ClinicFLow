from fastapi import APIRouter
from sqlalchemy import text
from services.orchestration import OrchestrationService

router = APIRouter(prefix="/api/nurse", tags=["nurse"])
orchestrator = OrchestrationService()

@router.get("/dashboard")
def get_nurse_dashboard():
    with orchestrator.Session() as session:
        # 1. Clinic Overview
        overview = {
            "patients_waiting": session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'Waiting'")).scalar(),
            "patients_consulting": session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'In Consultation'")).scalar(),
            "patients_checked_in": session.execute(text("SELECT count(*) FROM queue_entries")).scalar(),
            "upcoming_appointments": session.execute(text("SELECT count(*) FROM appointments WHERE status = 'Scheduled'")).scalar()
        }
        
        # 2. Live Queue
        q_rows = session.execute(text("""
            SELECT q.*, p.name as patient_name, a.appointment_time, d.name as doctor_name
            FROM queue_entries q
            JOIN patients p ON q.patient_id = p.id
            JOIN appointments a ON q.appointment_id = a.id
            JOIN doctors d ON q.doctor_id = d.id
            WHERE q.status IN ('Waiting', 'With Nurse', 'Ready', 'With Doctor', 'In Consultation')
            ORDER BY q.queue_position
        """)).mappings().all()
        live_queue = [dict(q) for q in q_rows]
        
        # 3. Patient Readiness
        r_rows = session.execute(text("""
            SELECT pr.*, p.name as patient_name 
            FROM patient_readiness pr
            JOIN patients p ON pr.patient_id = p.id
        """)).mappings().all()
        patient_readiness = [dict(r) for r in r_rows]
        
        # 4. Predictions (Congestion & Bottlenecks)
        congestion = {
            "risk_level": "High" if overview["patients_waiting"] > 10 else "Low",
            "predicted_peak_time": "11:30 AM",
            "bottleneck": "Doctor Consultation"
        }
        
        # 5. Doctor Workload
        d_rows = session.execute(text("""
            SELECT d.id, d.name, 
            (SELECT count(*) FROM queue_entries q WHERE q.doctor_id = d.id AND q.status = 'Waiting') as waiting_patients,
            (SELECT count(*) FROM queue_entries q WHERE q.doctor_id = d.id AND q.status = 'In Consultation') as active_consultations
            FROM doctors d
        """)).mappings().all()
        doctor_workload = [dict(d) for d in d_rows]
        
        # 6. Recommendations
        recs = session.execute(text("SELECT * FROM recommendations WHERE status = 'Active' ORDER BY priority DESC")).mappings().all()
        recommendations = [dict(r) for r in recs]
        
        if not recommendations and overview["patients_waiting"] > 5:
            recommendations.append({
                "message": "Queue growth predicted. Review upcoming appointment load.",
                "reason": "High arrival rate",
                "priority": "High"
            })
            
        # 7. Medicine Alerts
        meds = session.execute(text("""
            SELECT mb.medicine_id, m.name, mb.quantity, mb.expiry_date 
            FROM medicine_batches mb
            JOIN medicines m ON mb.medicine_id = m.id
            WHERE mb.quantity < m.reorder_level
        """)).mappings().all()

        return {
            "clinic_overview": overview,
            "live_queue": live_queue,
            "patient_readiness": patient_readiness,
            "predictions": [],
            "congestion": congestion,
            "doctor_workload": doctor_workload,
            "anomalies": [],
            "recommendations": recommendations,
            "upcoming_appointments": [],
            "medicine_alerts": [dict(m) for m in meds]
        }

@router.get('/notifications')
def get_nurse_notifications():
    with orchestrator.Session() as session:
        notifs = session.execute(text("SELECT id, patient_id, type, title, message, severity, read as is_read, created_at as timestamp FROM notifications ORDER BY created_at DESC LIMIT 50")).mappings().all()
        return [dict(n) for n in notifs]

@router.put('/notifications/{id}/read')
def mark_notification_read(id: str):
    with orchestrator.Session() as session:
        session.execute(text("UPDATE notifications SET read = 1 WHERE id = :id"), {"id": id})
        session.commit()
    return {'status': 'success'}

@router.post('/notifications/{id}/read')
def mark_notification_read_post(id: str):
    with orchestrator.Session() as session:
        session.execute(text("UPDATE notifications SET read = 1 WHERE id = :id"), {"id": id})
        session.commit()
    return {'status': 'success'}

@router.get('/reports')
def get_reports():
    return {'data': []}

@router.post('/generate-report')
def generate_report(req: dict):
    return {'status': 'success'}

@router.get('/settings')
def get_settings():
    return {'data': {'notifications_enabled': True}}

@router.put('/settings')
def update_settings(req: dict):
    return {'status': 'success'}

@router.get('/system-status')
def get_system_status():
    return {'data': {'status': 'operational'}}
