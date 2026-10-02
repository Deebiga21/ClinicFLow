import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, User, ShieldCheck, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import { API_BASE_URL } from '../config';

export default function Login() {
  const nav = useNavigate();
  const [role, setRole] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // We fetch a list of patients to populate the demo selector
  useEffect(() => {
    // In a real app we'd fetch this from an API, but for this demo 
    // we can use a hardcoded list matching the DB or try to fetch it.
    // Assuming backend has no dedicated list API yet, we'll just mock 
    // the IDs that exist in the DB (P_1 to P_10).
    const demoPatients = Array.from({ length: 10 }).map((_, i) => ({
      id: `P_${i + 1}`,
      name: `Patient ${i + 1}`
    }));
    setPatients(demoPatients);
    setSelectedPatientId(demoPatients[0].id);
  }, []);

  const handleLaunch = () => {
    // Since we are bypassing AuthContext entirely for the prototype:
    // We just save the selection to localStorage so dashboards can read it if needed
    // or just navigate directly.
    if (role === 'patient') {
      localStorage.setItem('demo_patient_id', selectedPatientId);
      nav('/patient-portal');
    } else if (role === 'nurse') {
      nav('/command-center');
    } else if (role === 'admin') {
      nav('/admin-dashboard');
    }
  };

  return (
    <div className="auth" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f9ff' }}>
      <motion.div className="auth__card" style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' }}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>

        <div className="brand-mark" style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Logo size={36} /><span style={{ fontSize: 22, fontWeight: 700, color: '#0369a1' }}>ClinicFlow Prototype</span>
        </div>
        
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Choose Role</h1>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Select a perspective to view the connected clinic pipeline.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <button 
            onClick={() => setRole('patient')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '8px', border: `2px solid ${role === 'patient' ? '#0ea5e9' : '#e2e8f0'}`, background: role === 'patient' ? '#f0f9ff' : '#fff', cursor: 'pointer', textAlign: 'left' }}
          >
            <User size={24} color={role === 'patient' ? '#0ea5e9' : '#64748b'} />
            <div style={{ fontWeight: 600, color: '#0f172a' }}>Patient</div>
          </button>
          
          <button 
            onClick={() => setRole('nurse')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '8px', border: `2px solid ${role === 'nurse' ? '#0ea5e9' : '#e2e8f0'}`, background: role === 'nurse' ? '#f0f9ff' : '#fff', cursor: 'pointer', textAlign: 'left' }}
          >
            <Stethoscope size={24} color={role === 'nurse' ? '#0ea5e9' : '#64748b'} />
            <div style={{ fontWeight: 600, color: '#0f172a' }}>Nurse</div>
          </button>
          
          <button 
            onClick={() => setRole('admin')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '8px', border: `2px solid ${role === 'admin' ? '#0ea5e9' : '#e2e8f0'}`, background: role === 'admin' ? '#f0f9ff' : '#fff', cursor: 'pointer', textAlign: 'left' }}
          >
            <ShieldCheck size={24} color={role === 'admin' ? '#0ea5e9' : '#64748b'} />
            <div style={{ fontWeight: 600, color: '#0f172a' }}>Admin</div>
          </button>
        </div>

        {role === 'patient' && (
          <div style={{ marginBottom: '24px', animation: 'fadeIn 0.3s ease' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Select Patient</label>
            <select 
              value={selectedPatientId} 
              onChange={e => setSelectedPatientId(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>[{p.id}] - {p.name}</option>
              ))}
            </select>
          </div>
        )}

        <button 
          onClick={handleLaunch}
          disabled={!role}
          style={{ width: '100%', padding: '16px', background: role ? '#0284c7' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: role ? 'pointer' : 'not-allowed' }}
        >
          {role === 'patient' ? 'Open Patient Dashboard' : role === 'nurse' ? 'Open Nurse Dashboard' : role === 'admin' ? 'Open Admin Dashboard' : 'Select a Role'} 
          {role && <ArrowRight size={20} />}
        </button>

      </motion.div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
