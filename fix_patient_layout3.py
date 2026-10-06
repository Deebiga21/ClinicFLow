import re

with open('frontend/src/components/patient/PatientLayout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "lastEvent?.event",
    "(lastEvent?.data?.event || lastEvent?.event)"
)
content = content.replace(
    "lastEvent?.data?.patient_id",
    "(lastEvent?.data?.patient_id || lastEvent?.patient_id)"
)
content = content.replace(
    "lastEvent.event ===",
    "(lastEvent?.data?.event || lastEvent?.event) ==="
)

with open('frontend/src/components/patient/PatientLayout.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
