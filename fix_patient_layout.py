import re
with open(r"d:\ClinicFLow\frontend\src\components\patient\PatientLayout.jsx", "r") as f:
    content = f.read()

# Add useAuth import
if "useAuth" not in content:
    content = content.replace("import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';", 
                              "import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';\nimport { useAuth } from '../../context/AuthContext';")

# Change patientId initialization
old_patient_state = "const [patientId, setPatientId] = useState(localStorage.getItem('demo_patient_id') || 'P_1');"
new_patient_state = """const { user } = useAuth();
  const [patientId, setPatientId] = useState(user?.patient_id || localStorage.getItem('demo_patient_id') || 'P_demo_1');

  // Sync patientId if user changes
  useEffect(() => {
    if (user?.patient_id) setPatientId(user.patient_id);
  }, [user]);"""

content = content.replace(old_patient_state, new_patient_state)

# The viewing as dropdown: Let's remove it so it's a real dashboard, or modify it to be less intrusive.
# Since the prompt said "Patient dashboard not working fix", it's probably because it's defaulting to "P_1" or "P_6" which doesn't exist in my new demo patients ("P_demo_1" to "P_demo_6").
# If I just remove the whole `flex justify-end px-6 pt-4` dropdown, it will fix it. Let's find that block.
dropdown_regex = r'<div className="flex justify-end px-6 pt-4">.*?</div>\s*</div>'
content = re.sub(dropdown_regex, '', content, flags=re.DOTALL)

with open(r"d:\ClinicFLow\frontend\src\components\patient\PatientLayout.jsx", "w") as f:
    f.write(content)
print("Updated PatientLayout.jsx")
