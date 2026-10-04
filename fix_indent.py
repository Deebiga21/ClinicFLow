with open(r"d:\ClinicFLow\core_backend\services\patient_service.py", "r") as f:
    content = f.read()

content = content.replace("if not today:\n                \n            bill = session", "if not today:\n                return {}\n\n            bill = session")

with open(r"d:\ClinicFLow\core_backend\services\patient_service.py", "w") as f:
    f.write(content)
