import re

with open(r'd:\clinic-queue -updated\core_backend\services\admin_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Patch get_patient_flow_summary
new_flow = """    def get_patient_flow_summary(self):
        with self.Session() as session:
            today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            total = session.query(func.count(QueueEntry.id)).filter(QueueEntry.created_at >= today).scalar() or 0
            completed = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Completed', QueueEntry.created_at >= today).scalar() or 0
            waiting = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Waiting', QueueEntry.created_at >= today).scalar() or 0
            in_consult = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'In Consultation', QueueEntry.created_at >= today).scalar() or 0
            checked_in = total - waiting - in_consult - completed if (total - waiting - in_consult - completed) > 0 else total
            
            return {
                "patientsToday": total,
                "checkedIn": total,
                "currentlyWaiting": waiting,
                "currentlyConsulting": in_consult,
                "completed": completed,
                "stages": [
                    {"name": "Check-in", "count": total, "avgDuration": "5 min"},
                    {"name": "Waiting", "count": waiting, "avgDuration": "25 min", "predictedDelay": "5 min"},
                    {"name": "Consultation", "count": in_consult, "avgDuration": "15 min"},
                    {"name": "Completed", "count": completed, "avgDuration": "-"}
                ]
            }"""

content = re.sub(r'    def get_patient_flow_summary\(self\):.*?            \}\n', new_flow + '\n', content, flags=re.DOTALL)

with open(r'd:\clinic-queue -updated\core_backend\services\admin_service.py', 'w', encoding='utf-8') as f:
    f.write(content)
