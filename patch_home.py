import sys
with open('frontend/src/pages/patient/PatientHome.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("rx.schedules.forEach(s => {", "(rx.schedules || []).forEach(s => {")

with open('frontend/src/pages/patient/PatientHome.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
