import re

with open('core_backend/services/admin_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_func = """    def get_workload_summary(self):
        with self.Session() as session:
            active_docs = session.query(func.count(Doctor.id)).filter(Doctor.active == True).scalar() or 0
            active_consultations = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'In Consultation').scalar() or 0
            total_patients = session.query(func.count(QueueEntry.id)).scalar() or 0
            
            return {
                "activeDoctors": active_docs,
                "activeConsultations": active_consultations,
                "upcomingAppointments": session.query(func.count(Appointment.id)).filter(Appointment.status == 'Scheduled').scalar() or 0,
                "avgDuration": "15 min",
                "currentWorkload": "High",
                "predictedPeak": "11:00 AM"
            }"""

new_func = """    def get_workload_summary(self):
        with self.Session() as session:
            # 1. Fetch all doctors and their departments
            doctors = session.query(Doctor).all()
            departments = list(set([d.department or "General" for d in doctors]))
            
            # Dictionary to hold stats for "All Departments" + each individual one
            stats = {}
            
            # Helper to calculate stats for a specific list of doctors
            def calc_stats(doc_list):
                if not doc_list:
                    return {
                        "activeDoctors": 0, "activeConsultations": 0, "upcomingAppointments": 0,
                        "avgDuration": "0 min", "currentWorkload": "Low", "predictedPeak": "N/A"
                    }
                doc_ids = [d.id for d in doc_list]
                
                active_docs = len([d for d in doc_list if d.active])
                
                active_consultations = session.query(func.count(QueueEntry.id)).filter(
                    QueueEntry.doctor_id.in_(doc_ids), QueueEntry.status == 'In Consultation'
                ).scalar() or 0
                
                upcoming = session.query(func.count(Appointment.id)).filter(
                    Appointment.doctor_id.in_(doc_ids), Appointment.status == 'Scheduled'
                ).scalar() or 0
                
                total_q = session.query(func.count(QueueEntry.id)).filter(QueueEntry.doctor_id.in_(doc_ids)).scalar() or 0
                
                workload = "High" if total_q > 5 else "Medium" if total_q > 2 else "Low"
                
                avg_dur = sum([float(d.average_consultation_duration or 15) for d in doc_list]) / len(doc_list)
                
                return {
                    "activeDoctors": active_docs,
                    "activeConsultations": active_consultations,
                    "upcomingAppointments": upcoming,
                    "avgDuration": f"{int(avg_dur)} min",
                    "currentWorkload": workload,
                    "predictedPeak": "11:00 AM"
                }

            # Calculate for All Departments
            stats["All Departments"] = calc_stats(doctors)
            
            # Calculate for each department
            for dept in departments:
                dept_docs = [d for d in doctors if (d.department or "General") == dept]
                stats[dept] = calc_stats(dept_docs)
                
            return stats"""

if old_func in content:
    content = content.replace(old_func, new_func)
else:
    print("Could not replace get_workload_summary")

with open('core_backend/services/admin_service.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated admin_service.py")
