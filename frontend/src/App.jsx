import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ReceptionistScreen from './pages/ReceptionistScreen';
import PatientScreen from './pages/PatientScreen';
import Settings from './pages/Settings';
import Checkout from './pages/Checkout';
import WaitTimes from './pages/WaitTimes';
import StaffChat from './pages/StaffChat';
import NotificationsPage from './pages/Notifications';
import Assistant from './pages/Assistant';
import DoctorConsult from './pages/DoctorConsult';
import DoctorDashboard from './pages/DoctorDashboard';
import Treatments from './pages/Treatments';
import ClinicalAI from './pages/ClinicalAI';
import PatientPortal from './pages/PatientPortal';
import PublicQueue from './pages/PublicQueue';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Landing />;
  if (user.role === 'staff' || user.role === 'admin') return <Navigate to="/desk" replace />;
  return <Navigate to="/waiting-room" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/desk" element={<ProtectedRoute role="staff"><ReceptionistScreen /></ProtectedRoute>} />
            <Route path="/doctor-dashboard" element={<ProtectedRoute role="staff"><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/waiting-room" element={<ProtectedRoute role="patient"><PatientScreen /></ProtectedRoute>} />
            <Route path="/patient-portal" element={<ProtectedRoute role="patient"><PatientPortal /></ProtectedRoute>} />
            <Route path="/treatments" element={<ProtectedRoute><Treatments /></ProtectedRoute>} />
            <Route path="/clinical-ai" element={<ProtectedRoute><ClinicalAI /></ProtectedRoute>} />
            <Route path="/public-queue" element={<PublicQueue />} />
            <Route path="/chat" element={<ProtectedRoute><StaffChat /></ProtectedRoute>} />
            <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
            <Route path="/wait-times" element={<ProtectedRoute><WaitTimes /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute role="patient"><Checkout /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/doctors" element={<ProtectedRoute role="staff"><DoctorConsult /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
