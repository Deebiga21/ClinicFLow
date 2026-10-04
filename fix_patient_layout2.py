import re

with open(r"d:\ClinicFLow\frontend\src\components\patient\PatientLayout.jsx", "r") as f:
    content = f.read()

content = content.replace(
    "useState(user?.patient_id || localStorage.getItem('demo_patient_id') || 'P_demo_1')",
    "useState(user?.patient_id || 'P_demo_1')"
)

with open(r"d:\ClinicFLow\frontend\src\components\patient\PatientLayout.jsx", "w") as f:
    f.write(content)

print("Updated PatientLayout.jsx to ignore localstorage demo id")
