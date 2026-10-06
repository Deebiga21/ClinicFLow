import re
content = open('frontend/src/components/patient/PatientLayout.jsx', encoding='utf-8').read()
content = content.replace('message: f"{title} - {msg}"', 'message: `${title} - ${msg}`')
open('frontend/src/components/patient/PatientLayout.jsx', 'w', encoding='utf-8').write(content)
