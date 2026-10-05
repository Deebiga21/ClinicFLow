with open(r"d:\ClinicFLow\core_backend\routers\clinical.py", "r") as f:
    content = f.read()

avail_code = """
@router.get("/api/doctors/availability")
def get_doctors_availability(db: Session = Depends(get_db)):
    from database.models import Doctor, Appointment
    import datetime
    
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
"""

if "/api/doctors/availability" not in content:
    content += "\n" + avail_code

with open(r"d:\ClinicFLow\core_backend\routers\clinical.py", "w") as f:
    f.write(content)
print("Updated clinical.py with availability")
