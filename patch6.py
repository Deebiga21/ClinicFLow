with open('core_backend/routers/clinical.py', 'r') as f:
    text = f.read()

old_sql = """            session.execute(text('''
                INSERT INTO prescriptions (id, consultation_id, patient_id, doctor_id, medications, notes, status, created_at)
                VALUES (:pid, :cid, :patid, :did, :meds, :notes, 'Active', CURRENT_TIMESTAMP)
            '''), {
                'pid': pres_id,
                'cid': queue_id,
                'patid': patient_id,
                'did': req.doctorId,
                'meds': meds_json,
                'notes': req.notes + " | Diagnosis: " + req.diagnosis
            })"""

new_sql = """            # Prescriptions inserted in loop"""

text = text.replace(old_sql, new_sql)

loop_find = """            for rx in req.prescription:
                drug_name = rx.get('drugName', '')"""

loop_replace = """            for rx in req.prescription:
                drug_name = rx.get('drugName', '')
                
                # Insert prescription item
                session.execute(text('''
                    INSERT INTO prescriptions (id, patient_id, appointment_id, doctor_id, consultation_id, medicine_name, dosage, frequency, duration_days, instructions, prescribed_at, status)
                    VALUES (:id, :pat, :app, :doc, :cons, :mname, :dos, :freq, :dur, :inst, CURRENT_TIMESTAMP, 'Active')
                '''), {
                    'id': str(uuid.uuid4()), 'pat': patient_id, 'app': 'UNKNOWN', 'doc': req.doctorId, 'cons': queue_id,
                    'mname': drug_name, 'dos': rx.get('dosage', ''), 'freq': rx.get('frequency', ''), 'dur': rx.get('duration', ''),
                    'inst': req.notes
                })
"""
text = text.replace(loop_find, loop_replace)

with open('core_backend/routers/clinical.py', 'w') as f:
    f.write(text)
