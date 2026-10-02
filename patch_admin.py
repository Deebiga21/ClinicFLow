import re

with open(r'd:\clinic-queue -updated\core_backend\services\admin_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to add real flow counts to get_analytics
new_analytics = """            return {
                "patients_today": patients_today,
                "appointments_today": appointments_today,
                "current_queue": current_queue,
                "active_consultations": active_consultations,
                "clinic_load": 75,
                "predicted_peak": {"time": "11:00 AM"},
                "clinic_status": "Normal",
                "shapData": shapData,
                "flow": {
                    "appointments": appointments_today,
                    "check_in": session.query(func.count(Appointment.id)).filter(Appointment.status == 'Checked In').scalar() or 0,
                    "queue": current_queue,
                    "nurse": session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'With Nurse').scalar() or 0,
                    "doctor": session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'With Doctor').scalar() or 0,
                    "consultation": active_consultations,
                    "completed": session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Completed').scalar() or 0
                }
            }"""

content = re.sub(r'return \{\s*"patients_today".*?"shapData": shapData\s*\}', new_analytics, content, flags=re.DOTALL)

with open(r'd:\clinic-queue -updated\core_backend\services\admin_service.py', 'w', encoding='utf-8') as f:
    f.write(content)
