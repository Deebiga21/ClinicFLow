import sys

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_chat = "import PatientProfile from './pages/patient/PatientProfile';\nimport PatientChat from './pages/patient/PatientChat';"
content = content.replace("import PatientProfile from './pages/patient/PatientProfile';", import_chat)

route_chat = "<Route path=\"profile\" element={<PatientProfile />} />\n                <Route path=\"chat\" element={<PatientChat />} />"
content = content.replace("<Route path=\"profile\" element={<PatientProfile />} />", route_chat)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("App.jsx patched")
