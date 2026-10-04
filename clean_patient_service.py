import re

filepath = r"d:\ClinicFLow\core_backend\services\patient_service.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Remove bill fetching
bill_query_pattern = r'bill = session\.execute\(text\(\s*"SELECT \* FROM bills WHERE appointment_id = :appointment_id ORDER BY created_at DESC LIMIT 1"\s*\), \{"appointment_id": appointment_id\}\)\.mappings\(\)\.first\(\)'
content = re.sub(bill_query_pattern, '', content)

content = content.replace('"bill": dict(bill) if bill else None', '')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated patient_service.py")
