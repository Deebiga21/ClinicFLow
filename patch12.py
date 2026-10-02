with open('frontend/src/App.jsx', 'r') as f:
    content = f.read()

imports = """
// Staff Dashboards
import DoctorDashboard from './pages/DoctorDashboard';
import ReceptionistScreen from './pages/ReceptionistScreen';
import NurseDashboard from './pages/NurseDashboard';
import PublicQueue from './pages/PublicQueue';
import PipelinePage from './pages/PipelinePage';
import ClinicalAI from './pages/ClinicalAI';
import MedicineIntel from './pages/MedicineIntel';

"""

routes = """
              {/* Staff Routes */}
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/reception" element={<ReceptionistScreen />} />
              <Route path="/nurse" element={<NurseDashboard />} />
              <Route path="/queue" element={<PublicQueue />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/clinical-ai" element={<ClinicalAI />} />
              <Route path="/pharmacy" element={<MedicineIntel />} />
"""

content = content.replace('// Patient Pages', imports + '// Patient Pages')
content = content.replace('{/* Patient Routes */}', routes + '              {/* Patient Routes */}')

with open('frontend/src/App.jsx', 'w') as f:
    f.write(content)
