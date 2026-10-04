with open(r"d:\ClinicFLow\core_backend\routers\clinical.py", "r") as f:
    content = f.read()

# Replace get_db with orchestrator.Session()
content = content.replace("def get_doctors_availability(db: Session = Depends(get_db)):", "def get_doctors_availability():")
content = content.replace("doctors = db.query(Doctor).filter(Doctor.active == True).all()", "with orchestrator.Session() as db:\n        doctors = db.query(Doctor).filter(Doctor.active == True).all()")
content = content.replace("appts = db.query(Appointment)", "appts = db.query(Appointment)")

with open(r"d:\ClinicFLow\core_backend\routers\clinical.py", "w") as f:
    f.write(content)
