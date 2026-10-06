import re

with open('frontend/src/pages/patient/BookingWizard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the useEffect block for NLP
old_use_effect = """  // Auto-predict Department from reason and symptoms
  useEffect(() => {
    const text = (formData.reason + " " + formData.symptoms).toLowerCase();
    let predictedDept = formData.department;
    
    if (text.includes("pregnant") || text.includes("pregnancy") || text.includes("period") || text.includes("maternity")) {
      predictedDept = "Gynecology";
    } else if (text.includes("heart") || text.includes("chest pain") || text.includes("palpitation")) {
      predictedDept = "Cardiology";
    } else if (text.includes("bone") || text.includes("fracture") || text.includes("knee") || text.includes("joint")) {
      predictedDept = "Orthopedics";
    } else if (text.includes("child") || text.includes("baby") || text.includes("kid") || text.includes("fever in baby")) {
      predictedDept = "Pediatrics";
    }
    
    if (predictedDept && predictedDept !== formData.department) {
      setFormData(prev => ({ ...prev, department: predictedDept }));
    }
  }, [formData.reason, formData.symptoms]);"""

new_use_effect = """  // Auto-predict Department from reason and symptoms
  useEffect(() => {
    const text = (formData.reason + " " + formData.symptoms).toLowerCase();
    let predictedDept = formData.department;
    
    if (text.includes("bone") || text.includes("fracture") || text.includes("knee") || text.includes("joint")) predictedDept = "Orthopedic";
    else if (text.includes("heart") || text.includes("chest") || text.includes("palpitation")) predictedDept = "Cardiologist";
    else if (text.includes("skin") || text.includes("rash") || text.includes("acne") || text.includes("hair")) predictedDept = "Dermatologist";
    else if (text.includes("child") || text.includes("baby") || text.includes("kid") || text.includes("fever in baby")) predictedDept = "Pediatrician";
    else if (text.includes("eye") || text.includes("vision") || text.includes("blur")) predictedDept = "Ophthalmologist";
    else if (text.includes("tooth") || text.includes("teeth") || text.includes("dental") || text.includes("gum")) predictedDept = "Dentist";
    else if (text.includes("depress") || text.includes("anxiety") || text.includes("mental") || text.includes("mind") || text.includes("stress")) predictedDept = "Psychiatrist";
    else if (text.includes("pregnant") || text.includes("pregnancy") || text.includes("period") || text.includes("maternity")) predictedDept = "Gynecologist";
    else if (text.includes("cancer") || text.includes("tumor") || text.includes("chemo")) predictedDept = "Oncologist";
    else if (text.includes("brain") || text.includes("nerve") || text.includes("seizure") || text.includes("headache")) predictedDept = "Neurologist";
    else if (text.includes("kidney") || text.includes("urine") || text.includes("dialysis")) predictedDept = "Nephrologist";
    else if (text.includes("lung") || text.includes("breath") || text.includes("asthma") || text.includes("cough")) predictedDept = "Pulmonologist";
    else if (text.includes("old") || text.includes("elder") || text.includes("age")) predictedDept = "Geriatrician";
    else if (text.includes("stomach") || text.includes("digestion") || text.includes("ulcer") || text.includes("bowel")) predictedDept = "Gastroenterologist";
    else if (text.includes("fever") || text.includes("cold") || text.includes("sick") || text.includes("pain") || text.includes("general")) predictedDept = "Physician";
    
    if (predictedDept && predictedDept !== formData.department) {
      setFormData(prev => ({ ...prev, department: predictedDept }));
    }
  }, [formData.reason, formData.symptoms]);"""

if old_use_effect in content:
    content = content.replace(old_use_effect, new_use_effect)
else:
    print("Could not find old useEffect block")

# 2. Replace the dropdown options
old_dropdown = """                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                    <select className="w-full p-2 border rounded" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                      <option value="">All Departments</option>
                      <option>General Medicine</option>
                      <option>Cardiology</option>
                      <option>Orthopedics</option>
                      <option>Pediatrics</option>
                      <option>Gynecology</option>
                    </select>
                  </div>"""

new_dropdown = """                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                    <select className="w-full p-2 border rounded" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                      <option value="">All Departments</option>
                      <option>Orthopedic</option>
                      <option>Cardiologist</option>
                      <option>Dermatologist</option>
                      <option>Pediatrician</option>
                      <option>Ophthalmologist</option>
                      <option>Dentist</option>
                      <option>Psychiatrist</option>
                      <option>Gynecologist</option>
                      <option>Oncologist</option>
                      <option>Neurologist</option>
                      <option>Nephrologist</option>
                      <option>Pulmonologist</option>
                      <option>Geriatrician</option>
                      <option>Gastroenterologist</option>
                      <option>Physician</option>
                    </select>
                  </div>"""

if old_dropdown in content:
    content = content.replace(old_dropdown, new_dropdown)
else:
    print("Could not find old dropdown block")
    
with open('frontend/src/pages/patient/BookingWizard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched BookingWizard.jsx successfully!")
