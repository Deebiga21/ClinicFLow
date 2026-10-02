import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WebSocketProvider } from './context/WebSocketContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Layouts
import AdminLayout from './components/admin/AdminLayout';
import PatientLayout from './components/patient/PatientLayout';

// Admin Pages
import AdminCommandCenter from './pages/admin/AdminCommandCenter';
import AdminPatientFlow from './pages/admin/AdminPatientFlow';
import AdminDoctorWorkload from './pages/admin/AdminDoctorWorkload';
import AdminCongestion from './pages/admin/AdminCongestion';
import AdminMLModels from './pages/admin/AdminMLModels';
import AdminPredictions from './pages/admin/AdminPredictions';
import AdminExplainability from './pages/admin/AdminExplainability';
import AdminModelPerformance from './pages/admin/AdminModelPerformance';
import AdminPredictionFeedback from './pages/admin/AdminPredictionFeedback';
import AdminAnomalies from './pages/admin/AdminAnomalies';
import AdminDigitalTwin from './pages/admin/AdminDigitalTwin';
import AdminMedicine from './pages/admin/AdminMedicine';
import AdminReports from './pages/admin/AdminReports';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';


// Staff Dashboards
import DoctorDashboard from './pages/DoctorDashboard';
import ReceptionistScreen from './pages/ReceptionistScreen';
import NurseDashboard from './pages/NurseDashboard';
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
  if (user.role === 'admin' || user.role === 'staff') return <Navigate to="/admin" replace />;
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
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminCommandCenter />} />
                <Route path="patient-flow" element={<AdminPatientFlow />} />
                <Route path="doctor-workload" element={<AdminDoctorWorkload />} />
                <Route path="congestion" element={<AdminCongestion />} />
                <Route path="ml" element={<AdminMLModels />} />
                <Route path="predictions" element={<AdminPredictions />} />
                <Route path="explainability" element={<AdminExplainability />} />
                <Route path="model-performance" element={<AdminModelPerformance />} />
                <Route path="prediction-feedback" element={<AdminPredictionFeedback />} />
                <Route path="anomalies" element={<AdminAnomalies />} />
                <Route path="digital-twin" element={<AdminDigitalTwin />} />
                <Route path="medicines" element={<AdminMedicine />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              
              {/* Staff Routes */}
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/reception" element={<ReceptionistScreen />} />
              <Route path="/nurse" element={<NurseDashboard />} />
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
