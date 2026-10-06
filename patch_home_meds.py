import sys
with open('frontend/src/pages/patient/PatientHome.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_str = "import { api } from '../../services/api';\nimport { QRCodeSVG } from 'qrcode.react';"
content = content.replace("import { QRCodeSVG } from 'qrcode.react';", import_str)

state_str = "const [detailsOpen, setDetailsOpen] = useState(false);\n  const [updatingMed, setUpdatingMed] = useState({});"
content = content.replace("const [detailsOpen, setDetailsOpen] = useState(false);", state_str)

handler_str = """
  const handleMarkTaken = async (scheduleId) => {
    if (updatingMed[scheduleId]) return;
    setUpdatingMed(prev => ({ ...prev, [scheduleId]: true }));
    try {
      await api.post(`/medication-schedules/${scheduleId}/taken`);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Failed to mark as taken');
      setUpdatingMed(prev => ({ ...prev, [scheduleId]: false }));
    }
  };
"""
content = content.replace("const handleQRClick = async () => {", handler_str + "\n  const handleQRClick = async () => {")

med_jsx_old = """<div className={`mt-0.5 rounded-full p-1 ${med.status === 'Taken' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-400'}`}>
                        <CheckCircle2 size={16} />
                     </div>"""

med_jsx_new = """{med.status === 'Taken' ? (
                        <div className="mt-0.5 rounded-full p-1 bg-green-100 text-green-600 cursor-default">
                          <CheckCircle2 size={16} />
                        </div>
                     ) : (
                        <button 
                          disabled={updatingMed[med.id]}
                          onClick={() => handleMarkTaken(med.id)}
                          title="Click to mark as taken"
                          className="mt-0.5 rounded-full p-1 bg-blue-50 hover:bg-blue-200 text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                     )}"""

content = content.replace(med_jsx_old, med_jsx_new)

with open('frontend/src/pages/patient/PatientHome.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("PatientHome.jsx patched")
