with open('core_backend/routers/clinical.py', 'r') as f:
    content = f.read()

# Replace the save_visit function with a new one that does inventory!
start_idx = content.find('@router.post(\'/api/visits\')')

new_func = """@router.post('/api/visits')
def save_visit(req: VisitCreate):
    with orchestrator.Session() as session:
        q = session.execute(text("SELECT id, patient_id FROM queue_entries WHERE doctor_id = :did AND status = 'In Consultation'"), {'did': req.doctorId}).fetchone()
        if q:
            queue_id = q[0]
            patient_id = q[1]
            pres_id = str(uuid.uuid4())
            meds_json = json.dumps(req.prescription)
            
            # 1. Create prescription
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
            
            # 2. Medication Schedules & Inventory
            for rx in req.prescription:
                drug_name = rx.get('drugName', '')
                
                # Create schedule
                sched_id = str(uuid.uuid4())
                session.execute(text('''
                    INSERT INTO medication_schedules (id, patient_id, medicine_name, dose, frequency, start_date, end_date, notes)
                    VALUES (:id, :patid, :name, :dose, :freq, CURRENT_DATE, date(CURRENT_DATE, '+7 days'), :notes)
                '''), {
                    'id': sched_id,
                    'patid': patient_id,
                    'name': drug_name,
                    'dose': rx.get('dosage', ''),
                    'freq': rx.get('frequency', ''),
                    'notes': rx.get('duration', '')
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
                            INSERT INTO inventory_transactions (id, medicine_id, batch_id, type, quantity, timestamp, notes)
                            VALUES (:tid, :mid, :bid, 'Dispense', 1, CURRENT_TIMESTAMP, 'Prescribed in visit')
                        '''), {
                            'tid': tx_id,
                            'mid': med_id,
                            'bid': batch[0]
                        })

            # 3. Complete queue
            if req.status == 'done':
                session.execute(text("UPDATE queue_entries SET status = 'Completed', consultation_completed_at = CURRENT_TIMESTAMP WHERE id = :id"), {'id': queue_id})
                
            session.commit()
            return {'status': 'success'}
        return {'status': 'error', 'message': 'No active consultation found'}
"""

content = content[:start_idx] + new_func

with open('core_backend/routers/clinical.py', 'w') as f:
    f.write(content)
