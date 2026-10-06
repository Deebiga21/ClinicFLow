from fastapi import APIRouter, Depends
from sqlalchemy import text
from pydantic import BaseModel
from services.orchestration import OrchestrationService
import uuid

router = APIRouter(tags=["clinical"])
orchestrator = OrchestrationService()

class DoctorCreate(BaseModel):
    name: str
    department: str
    specialization: str = ""
    roomNumber: str = ""
    avgConsultationTime: int = 10

class DoctorUpdate(BaseModel):
    name: str
    department: str
    specialization: str = ""
    roomNumber: str = ""
    avgConsultationTime: int = 10
    isAvailable: bool = True

@router.get("/api/doctors")
def get_doctors():
    with orchestrator.Session() as session:
        rows = session.execute(text("SELECT * FROM doctors")).mappings().all()
        # map db fields to UI fields
        docs = []
        for r in rows:
            docs.append({
                "_id": r["id"],
                "name": r["name"],
                "specialization": r["specialization"],
                "department": r["department"],
                "roomNumber": getattr(r, "room_number", ""), # if it doesn't exist, ignore
                "avgConsultationTime": r["average_consultation_duration"],
                "isAvailable": r["active"] == 1
            })
        return docs

@router.post("/api/doctors")
def create_doctor(req: DoctorCreate):
    d_id = str(uuid.uuid4())
    with orchestrator.Session() as session:
        session.execute(text("""
            INSERT INTO doctors (id, name, specialization, department, average_consultation_duration, active, created_at)
            VALUES (:id, :name, :spec, :dept, :avg, 1, CURRENT_TIMESTAMP)
        """), {"id": d_id, "name": req.name, "spec": req.specialization, "dept": req.department, "avg": req.avgConsultationTime})
        session.commit()
    return {
        "_id": d_id,
        "name": req.name,
        "specialization": req.specialization,
        "department": req.department,
        "roomNumber": req.roomNumber,
        "avgConsultationTime": req.avgConsultationTime,
        "isAvailable": True
    }

@router.put("/api/doctors/{id}")
def update_doctor(id: str, req: DoctorUpdate):
    with orchestrator.Session() as session:
        session.execute(text("""
            UPDATE doctors SET 
            name = :name, specialization = :spec, department = :dept, average_consultation_duration = :avg
            WHERE id = :id
        """), {"id": id, "name": req.name, "spec": req.specialization, "dept": req.department, "avg": req.avgConsultationTime})
        session.commit()
    req_dict = req.dict()
    req_dict["_id"] = id
    return req_dict

@router.post("/api/doctors/{id}/toggle-availability")
def toggle_doctor(id: str):
    with orchestrator.Session() as session:
        res = session.execute(text("SELECT active FROM doctors WHERE id = :id"), {"id": id}).fetchone()
        new_status = 0 if res[0] else 1
        session.execute(text("UPDATE doctors SET active = :status WHERE id = :id"), {"status": new_status, "id": id})
        session.commit()
        # fetch full updated
        row = session.execute(text("SELECT * FROM doctors WHERE id = :id"), {"id": id}).mappings().fetchone()
    return {
        "_id": row["id"],
        "name": row["name"],
        "specialization": row["specialization"],
        "department": row["department"],
        "avgConsultationTime": row["average_consultation_duration"],
        "isAvailable": row["active"] == 1
    }

@router.delete("/api/doctors/{id}")
def delete_doctor(id: str):
    with orchestrator.Session() as session:
        session.execute(text("DELETE FROM doctors WHERE id = :id"), {"id": id})
        session.commit()
    return {"ok": True}

@router.get("/api/queue")
def get_queue(doctorId: str = None):
    with orchestrator.Session() as session:
        query = "SELECT q.*, p.name as patient_name FROM queue_entries q JOIN patients p ON q.patient_id = p.id WHERE q.status IN ('Waiting', 'In Consultation')"
        params = {}
        if doctorId:
            query += " AND q.doctor_id = :did"
            params["did"] = doctorId
        query += " ORDER BY q.queue_position"
        
        q_rows = session.execute(text(query), params).mappings().all()
        
        waiting = []
        current = None
        
        for r in q_rows:
            entry = {
                "_id": r["id"],
                "tokenNumber": r["token_number"],
                "patientName": r["patient_name"],
                "estimatedWaitMinutes": r["estimated_wait_minutes"] or 0
            }
            if r["status"] == "In Consultation":
                current = entry
            else:
                waiting.append(entry)
                
        # Total served today
        served = session.execute(text("""
            SELECT count(*) FROM queue_entries 
            WHERE doctor_id = :did AND status = 'Completed' AND date(created_at) = date('now')
        """), {"did": doctorId}).scalar() if doctorId else 0
        
        return {
            "currentToken": current,
            "waitingQueue": waiting,
            "totalWaiting": len(waiting),
            "totalServedToday": served
        }

class CallNextRequest(BaseModel):
    doctor_id: str

@router.post("/api/queue/call-next")
def call_next(req: CallNextRequest):
    called_patient_id = None
    with orchestrator.Session() as session:
        # Complete current if any
        session.execute(text("UPDATE queue_entries SET status = 'Completed', consultation_completed_at = CURRENT_TIMESTAMP WHERE doctor_id = :did AND status = 'In Consultation'"), {"did": req.doctor_id})
        # Find next
        next_entry = session.execute(text("SELECT id, patient_id FROM queue_entries WHERE doctor_id = :did AND status = 'Waiting' ORDER BY queue_position ASC LIMIT 1"), {"did": req.doctor_id}).fetchone()
        if next_entry:
            called_patient_id = next_entry[1]
            session.execute(text("UPDATE queue_entries SET status = 'In Consultation', consultation_started_at = CURRENT_TIMESTAMP WHERE id = :id"), {"id": next_entry[0]})
        session.commit()
        
    if called_patient_id:
        import asyncio
        from main import manager, sio
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(sio.emit('systemBroadcast', {"event": "patient_called", "patient_id": called_patient_id}))
            loop.create_task(manager.broadcast({'type': 'update', 'data': {"event": "patient_called", "patient_id": called_patient_id}}))
        except Exception as e:
            pass

    return {"ok": True, "patient_called": called_patient_id}


@router.post("/api/doctors/seed")
def seed_doctors():
    import random
    from datetime import datetime
    deps = ['General','Cardiology','Neurology','Pediatrics','Orthopedics','Dermatology','ENT','Ophthalmology','Gynecology','Psychiatry','Emergency']
    names = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Robert Brown', 'Michael Davis', 'Sarah Wilson', 'David Taylor', 'James Thomas', 'Patricia Jackson', 'Linda White', 'Barbara Harris']
    
    with orchestrator.Session() as session:
        for i in range(11):
            d_id = str(uuid.uuid4())
            session.execute(text("""
                INSERT INTO doctors (id, name, specialization, department, average_consultation_duration, active, created_at)
                VALUES (:id, :name, :spec, :dept, :avg, 1, CURRENT_TIMESTAMP)
            """), {
                "id": d_id,
                "name": names[i],
                "spec": deps[i] + " Specialist",
                "dept": deps[i],
                "avg": random.randint(10, 30)
            })
        session.commit()
    return {"ok": True}

class AppointmentCreate(BaseModel):
    patient_name: str = ""
    doctor_name: str = ""
    patient_id: str = ""
    doctor_id: str = ""
    date: str = ""
    time: str = ""
    appointment_type: str = "Consultation"
    reason: str = ""
    symptoms: str = ""
    symptom_start: str = ""
    additional_information: str = ""

@router.post("/api/appointments")
def create_appointment(req: AppointmentCreate):
    import uuid
    a_id = str(uuid.uuid4())
    p_id = req.patient_id or str(uuid.uuid4())
    d_id = req.doctor_id or str(uuid.uuid4())
    
    with orchestrator.Session() as session:
        p_exists = session.execute(text("SELECT id FROM patients WHERE id = :id"), {"id": p_id}).fetchone()
        if not p_exists:
            session.execute(text("INSERT INTO patients (id, name, created_at) VALUES (:id, :name, CURRENT_TIMESTAMP)"), {"id": p_id, "name": req.patient_name or "New Patient"})
        
        d_exists = session.execute(text("SELECT id FROM doctors WHERE id = :id"), {"id": d_id}).fetchone()
        if not d_exists:
            session.execute(text("INSERT INTO doctors (id, name, active, created_at) VALUES (:id, :name, 1, CURRENT_TIMESTAMP)"), {"id": d_id, "name": req.doctor_name or "Doctor"})
            
        session.execute(text("""
            INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, status, created_at)
            VALUES (:id, :pid, :did, :date, :time, :type, 'Scheduled', CURRENT_TIMESTAMP)
        """), {"id": a_id, "pid": p_id, "did": d_id, "date": req.date, "time": req.time, "type": req.appointment_type})
        
        # Add to patient journey
        journey_id = str(uuid.uuid4())
        session.execute(text("""
            INSERT INTO patient_journeys (id, patient_id, appointment_id, current_stage, stage_started_at, status, created_at)
            VALUES (:id, :pid, :aid, 'BOOKED', CURRENT_TIMESTAMP, 'Active', CURRENT_TIMESTAMP)
        """), {"id": journey_id, "pid": p_id, "aid": a_id})
        
        session.commit()
    
    # Broadcast to update dashboard
    import asyncio
    from main import manager, sio
    try:
        loop = asyncio.get_event_loop()
        ws_data = {
            "event": "appointment_created", 
            "patient_id": p_id,
            "patient_name": req.patient_name,
            "appointment_id": a_id,
            "reason": req.reason,
            "symptoms": req.symptoms,
            "type": req.appointment_type,
            "doctor_id": d_id
        }
        loop.create_task(sio.emit('systemBroadcast', ws_data))
        loop.create_task(manager.broadcast({'type': 'update', 'data': ws_data}))
    except Exception as e:
        pass

    return {"id": a_id, "status": "Scheduled"}

@router.put("/api/appointments/{id}")
def update_appointment(id: str, req: AppointmentCreate):
    with orchestrator.Session() as session:
        session.execute(text("""
            UPDATE appointments SET appointment_date = :date, appointment_time = :time
            WHERE id = :id
        """), {"id": id, "date": req.date, "time": req.time})
        session.commit()
    return {"ok": True}

@router.delete("/api/appointments/{id}")
def delete_appointment(id: str):
    with orchestrator.Session() as session:
        session.execute(text("DELETE FROM appointments WHERE id = :id"), {"id": id})
        session.commit()
    return {"ok": True}

from typing import List, Optional
import json

class VisitCreate(BaseModel):
    tokenNumber: str
    patientName: str
    doctorId: str
    doctorName: str
    department: str
    diagnosis: str
    prescription: List[dict]
    notes: str
    status: str

@router.post('/api/visits')
def save_visit(req: VisitCreate):
    with orchestrator.Session() as session:
        q = session.execute(text("SELECT id, patient_id, appointment_id FROM queue_entries WHERE doctor_id = :did AND status = 'In Consultation'"), {'did': req.doctorId}).fetchone()
        if q:
            queue_id = q[0]
            patient_id = q[1]
            app_id = q[2]
            pres_id = str(uuid.uuid4())
            meds_json = json.dumps(req.prescription)
            
            # 1. Create prescription
            # Prescriptions inserted in loop
            
            # 2. Medication Schedules & Inventory
            for rx in req.prescription:
                drug_name = rx.get('drugName', '')
                
                # Insert prescription item
                session.execute(text('''
                    INSERT INTO prescriptions (id, patient_id, appointment_id, doctor_id, consultation_id, medicine_name, dosage, frequency, duration_days, instructions, prescribed_at, status)
                    VALUES (:id, :pat, :app, :doc, :cons, :mname, :dos, :freq, :dur, :inst, CURRENT_TIMESTAMP, 'Active')
                '''), {
                    'id': str(uuid.uuid4()), 'pat': patient_id, 'app': app_id, 'doc': req.doctorId, 'cons': queue_id,
                    'mname': drug_name, 'dos': rx.get('dosage', ''), 'freq': rx.get('frequency', ''), 'dur': rx.get('duration', ''),
                    'inst': req.notes
                })

                
                # Create schedule
                sched_id = str(uuid.uuid4())
                session.execute(text('''
                    INSERT INTO medication_schedules (id, prescription_id, patient_id, medicine_id, scheduled_date, scheduled_time, frequency, status, created_at)
                    VALUES (:id, :pres_id, :patid, :medid, CURRENT_DATE, '08:00', :freq, 'Pending', CURRENT_TIMESTAMP)
                '''), {
                    'id': str(uuid.uuid4()), 'pres_id': str(uuid.uuid4()), 'patid': patient_id, 'medid': 'UNKNOWN', 'freq': rx.get('frequency', '')
                })
                
                # Attempt to find medicine and update inventory
                med = session.execute(text("SELECT id FROM medicines WHERE name LIKE :name LIMIT 1"), {'name': '%' + drug_name + '%'}).fetchone()
                if med:
                    med_id = med[0]
                    # reduce from batch
                    batch = session.execute(text("SELECT id, quantity FROM medicine_batches WHERE medicine_id = :mid AND quantity > 0 ORDER BY expiry_date ASC LIMIT 1"), {'mid': med_id}).fetchone()
                    if batch:
                        session.execute(text("UPDATE medicine_batches SET quantity = quantity - 1 WHERE id = :bid"), {'bid': batch[0]})
                        # create transaction
                        tx_id = str(uuid.uuid4())
                        session.execute(text('''
                            INSERT INTO inventory_transactions (id, medicine_id, batch_id, transaction_type, quantity, reference_type, reference_id, timestamp)
                            VALUES (:tid, :mid, :bid, 'Dispense', 1, 'Prescription', app_id, CURRENT_TIMESTAMP)
                        '''), {
                            'tid': tx_id,
                            'mid': med_id,
                            'bid': batch[0]
                        })

            # Create Notifications
            session.execute(text("INSERT INTO notifications (id, patient_id, notification_type, title, message, is_read, created_at) VALUES (:id, :pid, 'prescription', '🔔 New Prescription', 'Your doctor has added a prescription for today''s visit.', 0, CURRENT_TIMESTAMP)"), {"id": str(uuid.uuid4()), "pid": patient_id})
            session.execute(text("INSERT INTO notifications (id, patient_id, notification_type, title, message, is_read, created_at) VALUES (:id, :pid, 'medication', '💊 Medication Schedule Ready', 'Your medication schedule has been added.', 0, CURRENT_TIMESTAMP)"), {"id": str(uuid.uuid4()), "pid": patient_id})
            
            # 3. Complete queue
            if req.status == 'done':
                session.execute(text("UPDATE queue_entries SET status = 'Completed', consultation_completed_at = CURRENT_TIMESTAMP WHERE id = :id"), {'id': queue_id})
                
                # Update Journey to Completed
                session.execute(text("UPDATE patient_journeys SET current_stage = 'COMPLETED', status = 'Completed', stage_completed_at = CURRENT_TIMESTAMP WHERE appointment_id = :aid"), {'aid': app_id})
                
            session.commit()
            
            # Broadcast to update dashboard
            import asyncio
            from main import manager, sio
            try:
                loop = asyncio.get_event_loop()
                loop.create_task(sio.emit('systemBroadcast', {"event": "consultation_completed", "patient_id": patient_id}))
                loop.create_task(manager.broadcast({'type': 'update', 'data': {"event": "consultation_completed", "patient_id": patient_id}}))
            except Exception as e:
                pass

            return {'status': 'success'}
        return {'status': 'error', 'message': 'No active consultation found'}


@router.get("/api/doctors/availability")
def get_doctors_availability():
    from database.models import Doctor, Appointment
    import datetime
    
    with orchestrator.Session() as db:
        doctors = db.query(Doctor).filter(Doctor.active == True).all()
    today = datetime.datetime.utcnow().date()
    
    res = []
    for d in doctors:
        # Check active appointments today
        appts = db.query(Appointment).filter(
            Appointment.doctor_id == d.id,
            Appointment.appointment_date >= datetime.datetime.combine(today, datetime.time.min)
        ).count()
        
        # Simple availability logic for the prototype
        is_available = appts < 20 # Assuming 20 is max capacity
        next_time = (datetime.datetime.utcnow() + datetime.timedelta(hours=1)).strftime("%I:00 %p")
        
        res.append({
            "id": d.id,
            "name": d.name,
            "department": d.department,
            "specialization": d.specialization,
            "available": is_available,
            "working_hours": "09:00 AM - 05:00 PM",
            "current_workload": appts,
            "next_available": next_time if is_available else None
        })
        
    return {"data": res}

class BillCreate(BaseModel):
    patient_id: str
    appointment_id: str
    amount: float

@router.post("/api/bills")
def create_bill(req: BillCreate):
    with orchestrator.Session() as session:
        bill_id = str(uuid.uuid4())
        session.execute(text("""
            INSERT INTO bills (id, patient_id, appointment_id, total_amount, status, created_at)
            VALUES (:id, :pid, :aid, :amt, 'Pending', CURRENT_TIMESTAMP)
        """), {"id": bill_id, "pid": req.patient_id, "aid": req.appointment_id, "amt": req.amount})
        
        # Also create a notification for the patient
        notif_id = str(uuid.uuid4())
        session.execute(text("""
            INSERT INTO notifications (id, patient_id, notification_type, title, message, is_read, created_at)
            VALUES (:id, :pid, 'bill', '💳 BILL READY', 'Your clinic bill is ready for ₹' || :amt, 0, CURRENT_TIMESTAMP)
        """), {"id": notif_id, "pid": req.patient_id, "amt": req.amount})
        
        session.commit()
        
        import asyncio
        from main import manager, sio
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(sio.emit('systemBroadcast', {"event": "bill_generated", "patient_id": req.patient_id}))
            loop.create_task(manager.broadcast({'type': 'update', 'data': {"event": "bill_generated", "patient_id": req.patient_id}}))
        except Exception:
            pass

    return {"id": bill_id, "status": "Pending"}

@router.get("/api/bills/{patient_id}")
def get_bills(patient_id: str):
    with orchestrator.Session() as session:
        bills = session.execute(text("SELECT * FROM bills WHERE patient_id = :pid ORDER BY created_at DESC"), {"pid": patient_id}).mappings().all()
        return [dict(b) for b in bills]

@router.post("/api/payments")
def create_payment(req: dict):
    with orchestrator.Session() as session:
        payment_id = str(uuid.uuid4())
        bill_id = req.get("bill_id")
        patient_id = req.get("patient_id")
        amount = req.get("amount")
        
        # Mark bill as paid
        session.execute(text("UPDATE bills SET status = 'Paid' WHERE id = :bid"), {"bid": bill_id})
        
        # Create payment record
        session.execute(text("""
            INSERT INTO payments (id, patient_id, bill_id, amount, payment_status, payment_method, created_at)
            VALUES (:id, :pid, :bid, :amt, 'PAID', 'QR', CURRENT_TIMESTAMP)
        """), {"id": payment_id, "pid": patient_id, "bid": bill_id, "amt": amount})
        
        # Notification
        notif_id = str(uuid.uuid4())
        session.execute(text("""
            INSERT INTO notifications (id, patient_id, notification_type, title, message, is_read, created_at)
            VALUES (:id, :pid, 'payment', '✓ PAYMENT SUCCESSFUL', 'Payment of ₹' || :amt || ' received successfully.', 0, CURRENT_TIMESTAMP)
        """), {"id": notif_id, "pid": patient_id, "amt": amount})
        
        session.commit()
        
        import asyncio
        from main import manager, sio
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(sio.emit('systemBroadcast', {"event": "payment_successful", "patient_id": patient_id}))
            loop.create_task(manager.broadcast({'type': 'update', 'data': {"event": "payment_successful", "patient_id": patient_id}}))
        except Exception:
            pass
            
    return {"id": payment_id, "status": "PAID"}

@router.get("/api/payments/{patient_id}")
def get_payments(patient_id: str):
    with orchestrator.Session() as session:
        payments = session.execute(text("SELECT * FROM payments WHERE patient_id = :pid ORDER BY created_at DESC"), {"pid": patient_id}).mappings().all()
        return [dict(p) for p in payments]
