import re
with open('core_backend/routers/clinical.py', 'r') as f:
    text = f.read()

pattern = re.compile(r"INSERT INTO medication_schedules.*?VALUES.*?}\)", re.DOTALL)
replacement = """INSERT INTO medication_schedules (id, prescription_id, patient_id, medicine_id, scheduled_date, scheduled_time, frequency, status, created_at)
                    VALUES (:id, :pres_id, :patid, :medid, CURRENT_DATE, '08:00', :freq, 'Pending', CURRENT_TIMESTAMP)
                '''), {
                    'id': str(uuid.uuid4()), 'pres_id': str(uuid.uuid4()), 'patid': patient_id, 'medid': 'UNKNOWN', 'freq': rx.get('frequency', '')
                })"""

text = pattern.sub(replacement, text)

with open('core_backend/routers/clinical.py', 'w') as f:
    f.write(text)
