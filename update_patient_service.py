import re

with open(r"d:\ClinicFLow\core_backend\services\patient_service.py", "r") as f:
    content = f.read()

# Add fetching bill in get_visit_status
bill_query = """
            bill = session.execute(text(
                "SELECT * FROM bills WHERE appointment_id = :appointment_id ORDER BY created_at DESC LIMIT 1"
            ), {"appointment_id": appointment_id}).mappings().first()
            
            return {
"""

if "bill = session.execute" not in content:
    content = content.replace("return {", bill_query, 1)
    content = content.replace('"readiness": dict(readiness) if readiness else None', '"readiness": dict(readiness) if readiness else None,\n                "bill": dict(bill) if bill else None')

with open(r"d:\ClinicFLow\core_backend\services\patient_service.py", "w") as f:
    f.write(content)
print("Updated patient_service.py")
