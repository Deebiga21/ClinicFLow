import sys
with open('core_backend/services/patient_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_func = """    def get_patient_medications(self, patient_id: str):
        with self.Session() as session:
            prescriptions = session.execute(text(
                "SELECT * FROM prescriptions WHERE patient_id = :patient_id ORDER BY prescribed_at DESC"
            ), {"patient_id": patient_id}).mappings().all()

            return [dict(p) for p in prescriptions]"""

new_func = """    def get_patient_medications(self, patient_id: str):
        with self.Session() as session:
            prescriptions = session.execute(text(
                "SELECT * FROM prescriptions WHERE patient_id = :patient_id ORDER BY prescribed_at DESC"
            ), {"patient_id": patient_id}).mappings().all()

            schedules = session.execute(text(
                "SELECT * FROM medication_schedules WHERE patient_id = :patient_id ORDER BY scheduled_time ASC"
            ), {"patient_id": patient_id}).mappings().all()

            results = []
            for p in prescriptions:
                p_dict = dict(p)
                p_dict['schedules'] = [dict(s) for s in schedules if s['prescription_id'] == p['id']]
                results.append(p_dict)

            return results"""

if old_func in content:
    content = content.replace(old_func, new_func)
    with open('core_backend/services/patient_service.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched!")
else:
    print("Could not find the function to patch!")
