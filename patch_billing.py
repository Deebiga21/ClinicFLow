import re

with open('frontend/src/pages/patient/PatientPrescriptions.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'if (type === "billing_notified" || type === "proceed_to_bill") {',
    'if (type === "billing_notified" || type === "proceed_to_bill" || type === "consultation_ended") {'
)

with open('frontend/src/pages/patient/PatientPrescriptions.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
