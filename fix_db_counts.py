import re

with open(r'd:\clinic-queue -updated\core_backend\services\admin_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add datetime import if missing
if 'import datetime' not in content:
    content = 'import datetime\n' + content

# Patch get_analytics
new_get_analytics = """    def get_analytics(self):
        with self.Session() as session:
            today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            patients_today = session.query(func.count(QueueEntry.id)).filter(QueueEntry.created_at >= today).scalar() or 0
            appointments_today = session.query(func.count(Appointment.id)).filter(Appointment.created_at >= today).scalar() or 0
            
            current_queue = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Waiting', QueueEntry.created_at >= today).scalar() or 0
            active_consultations = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'In Consultation').scalar() or 0
            
            shapData = []
            try:
                first_waiting = session.query(QueueEntry).filter(QueueEntry.status == 'Waiting', QueueEntry.created_at >= today).first()
                if first_waiting:
                    from services.ml_service import MLService
                    ml = MLService()
                    pred_res = ml.get_waiting_time_prediction(first_waiting.id)
                    if "shap" in pred_res and "contributions" in pred_res["shap"]:
                        raw_contributions = pred_res["shap"]["contributions"]
                        for item in raw_contributions:
                            shapData.append({"name": item["feature"].replace('_', ' ').title(), "value": item["contribution"]})
            except Exception as e:
                pass
            
            return {
                "patients_today": patients_today,
                "appointments_today": appointments_today,
                "current_queue": current_queue,
                "active_consultations": active_consultations,
                "clinic_load": min(100, (current_queue * 10) + (active_consultations * 15)),
                "predicted_peak": {"time": "11:00 AM"},
                "clinic_status": "Normal" if current_queue < 10 else "Congested",
                "shapData": shapData,
                "flow": {
                    "appointments": appointments_today,
                    "check_in": session.query(func.count(Appointment.id)).filter(Appointment.status == 'Checked In', Appointment.created_at >= today).scalar() or 0,
                    "queue": current_queue,
                    "nurse": session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'With Nurse', QueueEntry.created_at >= today).scalar() or 0,
                    "doctor": session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'With Doctor', QueueEntry.created_at >= today).scalar() or 0,
                    "consultation": active_consultations,
                    "completed": session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Completed', QueueEntry.created_at >= today).scalar() or 0
                }
            }"""

# Use regex to replace the method
content = re.sub(r'    def get_analytics\(self\):.*?            return \{.*?"completed":.*?\}\s*\}', new_get_analytics, content, flags=re.DOTALL)

with open(r'd:\clinic-queue -updated\core_backend\services\admin_service.py', 'w', encoding='utf-8') as f:
    f.write(content)
