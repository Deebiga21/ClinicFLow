with open('core_backend/routers/clinical.py', 'r') as f:
    text = f.read()

old_sql = """                session.execute(text('''
                    INSERT INTO medication_schedules (id, patient_id, medicine_name, dose, frequency, start_date, end_date, notes)
                    VALUES (:id, :pat, :med, :dos, :freq, CURRENT_DATE, date(CURRENT_DATE, '+7 days'), :dur)
                '''), {
                    'id': str(uuid.uuid4()), 'pat': patient_id, 'med': drug_name,
                    'dos': rx.get('dosage', ''), 'freq': rx.get('frequency', ''), 'dur': rx.get('duration', '')
                })"""

new_sql = """                session.execute(text('''
                    INSERT INTO medication_schedules (id, prescription_id, patient_id, medicine_id, scheduled_date, scheduled_time, frequency, status, created_at)
                    VALUES (:id, :pres_id, :pat, :med, CURRENT_DATE, '08:00', :freq, 'Pending', CURRENT_TIMESTAMP)
                '''), {
                    'id': str(uuid.uuid4()), 'pres_id': str(uuid.uuid4()), 'pat': patient_id, 'med': 'UNKNOWN', 'freq': rx.get('frequency', '')
                })"""

text = text.replace(old_sql, new_sql)

with open('core_backend/routers/clinical.py', 'w') as f:
    f.write(text)
