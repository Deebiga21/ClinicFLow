import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WebSocketProvider } from './context/WebSocketContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Layouts
import NurseLayout from './components/nurse/NurseLayout';
import PatientLayout from './components/patient/PatientLayout';

// Admin Pages
import NurseCommandCenter from './pages/nurse/NurseCommandCenter';
import NursePatientFlow from './pages/nurse/NursePatientFlow';
import NurseDoctorWorkload from './pages/nurse/NurseDoctorWorkload';
import NurseCongestion from './pages/nurse/NurseCongestion';
import NurseMLModels from './pages/nurse/NurseMLModels';
import NursePredictions from './pages/nurse/NursePredictions';
import NurseExplainability from './pages/nurse/NurseExplainability';
import NurseModelPerformance from './pages/nurse/NurseModelPerformance';
import NursePredictionFeedback from './pages/nurse/NursePredictionFeedback';
import NurseAnomalies from './pages/nurse/NurseAnomalies';
import NurseDigitalTwin from './pages/nurse/NurseDigitalTwin';
import NurseMedicine from './pages/nurse/NurseMedicine';
import NurseReports from './pages/nurse/NurseReports';
import NurseNotifications from './pages/nurse/NurseNotifications';
import NurseSettings from './pages/nurse/NurseSettings';


// Staff Dashboards
import DoctorDashboard from './pages/DoctorDashboard';
import ReceptionistScreen from './pages/ReceptionistScreen';
import PublicQueue from './pages/PublicQueue';
import PipelinePage from './pages/PipelinePage';
import ClinicalAI from './pages/ClinicalAI';
import MedicineIntel from './pages/MedicineIntel';

// Patient Pages
import PatientHome from './pages/patient/PatientHome';
import PatientVisit from './pages/patient/PatientVisit';
import PatientJourney from './pages/patient/PatientJourney';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientPrescriptions from './pages/patient/PatientPrescriptions';
import PatientMedications from './pages/patient/PatientMedications';
import PatientNotifications from './pages/patient/PatientNotifications';
import PatientProfile from './pages/patient/PatientProfile';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Landing />;
  if (user.role === 'admin' || user.role === 'staff' || user.role === 'nurse') return <Navigate to="/nurse" replace />;
  return <Navigate to="/patient" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<RoleRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Admin Routes */}
              <Route path="/nurse" element={<NurseLayout />}>
                <Route index element={<NurseCommandCenter />} />
                <Route path="patient-flow" element={<NursePatientFlow />} />
                <Route path="doctor-workload" element={<NurseDoctorWorkload />} />
                <Route path="congestion" element={<NurseCongestion />} />
                <Route path="ml" element={<NurseMLModels />} />
                <Route path="predictions" element={<NursePredictions />} />
                <Route path="explainability" element={<NurseExplainability />} />
                <Route path="model-performance" element={<NurseModelPerformance />} />
                <Route path="prediction-feedback" element={<NursePredictionFeedback />} />
                <Route path="anomalies" element={<NurseAnomalies />} />
                <Route path="digital-twin" element={<NurseDigitalTwin />} />
                <Route path="medicines" element={<NurseMedicine />} />
                <Route path="reports" element={<NurseReports />} />
                <Route path="notifications" element={<NurseNotifications />} />
                <Route path="settings" element={<NurseSettings />} />
              </Route>

              
              {/* Staff Routes */}
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/reception" element={<ReceptionistScreen />} />
                            <Route path="/queue" element={<PublicQueue />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/clinical-ai" element={<ClinicalAI />} />
              <Route path="/pharmacy" element={<MedicineIntel />} />
              {/* Patient Routes */}
              <Route path="/patient" element={<PatientLayout />}>
                <Route index element={<PatientHome />} />
                <Route path="my-visit" element={<PatientVisit />} />
                <Route path="journey" element={<PatientJourney />} />
                <Route path="appointments" element={<PatientAppointments />} />
                <Route path="prescriptions" element={<PatientPrescriptions />} />
                <Route path="medications" element={<PatientMedications />} />
                <Route path="notifications" element={<PatientNotifications />} />
                <Route path="profile" element={<PatientProfile />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
