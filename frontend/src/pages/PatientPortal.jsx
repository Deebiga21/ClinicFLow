import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { 
  User, Calendar, Clock, Stethoscope, AlertCircle, 
  Activity, Pill, FileText, CheckCircle, ArrowRight, Bell, RefreshCw, XCircle
} from 'lucide-react';

export default function PatientPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const patientId = localStorage.getItem('demo_patient_id') || 'P_1';

  const fetchData = async () => {
    try {
      if (!data) setLoading(true);
      const result = await api.getPatientDashboard(patientId);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [patientId]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Loading your visit details...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
        <XCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Dashboard</h2>
        <p className="text-slate-500 mb-6 max-w-md text-center">{error}</p>
        <button onClick={fetchData} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-800">
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-slate-500">
        <AlertCircle size={48} className="mb-4 text-slate-400" />
        <p className="font-semibold text-lg">{data?.error || 'Patient not found'}</p>
      </div>
    );
  }

  const {
    patient, today_appointment, queue_status, waiting_prediction,
    readiness, journey, next_expected_event, medication_summary
  } = data;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 40px' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 28, color: '#0f172a', margin: '0 0 8px' }}>Welcome back, {patient.name}</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Here is the real-time status of your visit.</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} /> Notifications
          </button>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0ea5e9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {patient.name.charAt(0)}
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* YOUR VISIT */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: 18, color: '#0f172a', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={20} color="#0ea5e9" /> Your Visit Today
            </h2>
            
            {!today_appointment ? (
              <p style={{ color: '#64748b' }}>No appointments scheduled for today.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 4px' }}>Doctor</p>
                  <p style={{ fontWeight: 600, margin: 0 }}>Dr. {today_appointment.doctor_id}</p>
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 4px' }}>Appointment</p>
                  <p style={{ fontWeight: 600, margin: 0 }}>{today_appointment.appointment_time}</p>
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 4px' }}>Check-in Status</p>
                  <p style={{ fontWeight: 600, color: data.check_in_status ? '#10b981' : '#f59e0b', margin: 0 }}>
                    {data.check_in_status ? 'Checked In' : 'Pending'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* LIVE QUEUE & WAIT TIME */}
          {queue_status && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              
              {/* QUEUE STATUS */}
              <div style={{ background: '#0f172a', color: '#fff', padding: 24, borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
                <h2 style={{ fontSize: 18, color: '#cbd5e1', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={20} color="#38bdf8" /> Live Queue
                </h2>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 4px' }}>Your Token</p>
                    <p style={{ fontSize: 42, fontWeight: 800, margin: 0, color: '#fff' }}>{queue_status.token_number || '-'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 4px' }}>Patients Ahead</p>
                    <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#38bdf8' }}>{queue_status.queue_position ? queue_status.queue_position - 1 : 0}</p>
                  </div>
                </div>
              </div>

              {/* WHY AM I WAITING (EXPLAINABLE AI) */}
              <div style={{ background: '#f0fdf4', padding: 24, borderRadius: 16, border: '1px solid #bbf7d0' }}>
                <h2 style={{ fontSize: 18, color: '#166534', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={20} color="#22c55e" /> Estimated Wait
                </h2>
                {waiting_prediction ? (
                  <>
                    <p style={{ fontSize: 32, fontWeight: 800, color: '#15803d', margin: '0 0 16px' }}>
                      {Math.round(waiting_prediction.predicted_wait)} mins
                    </p>
                    <div style={{ fontSize: 13, color: '#166534' }}>
                      <strong>Why am I waiting?</strong>
                      <p style={{ margin: '4px 0 0', opacity: 0.8 }}>{waiting_prediction.explanation}</p>
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#166534' }}>Explanation currently unavailable. Need more data to predict wait time.</p>
                )}
              </div>
            </div>
          )}

          {/* PATIENT JOURNEY */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 18, color: '#0f172a', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowRight size={20} color="#0ea5e9" /> Your Journey
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 12, left: 20, right: 20, height: 2, background: '#e2e8f0', zIndex: 0 }} />
              
              {['Appointment', 'Arrival', 'Check-in', 'Queue', 'Nurse', 'Doctor', 'Completed'].map((stage, i) => {
                const jMatch = journey?.find(j => j.stage_name === stage);
                const isCompleted = !!jMatch?.stage_completed_at;
                const isCurrent = !!jMatch && !isCompleted;
                
                let bgColor = '#fff';
                let borderColor = '#cbd5e1';
                let iconColor = '#cbd5e1';
                
                if (isCompleted) { bgColor = '#10b981'; borderColor = '#10b981'; iconColor = '#fff'; }
                if (isCurrent) { bgColor = '#fff'; borderColor = '#0ea5e9'; iconColor = '#0ea5e9'; }
                
                return (
                  <div key={stage} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: bgColor, border: `2px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isCompleted && <CheckCircle size={14} color={iconColor} />}
                      {isCurrent && <div style={{ width: 10, height: 10, borderRadius: '50%', background: iconColor }} />}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#0ea5e9' : (isCompleted ? '#0f172a' : '#94a3b8') }}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* NEXT EXPECTED EVENT */}
          <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', color: '#fff', padding: 24, borderRadius: 16 }}>
            <h2 style={{ fontSize: 16, color: '#bae6fd', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>What's Next?</h2>
            {next_expected_event ? (
              <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                You are likely to be called for {next_expected_event.event.toLowerCase()} {next_expected_event.time}.
              </p>
            ) : (
              <p style={{ fontSize: 18, margin: 0 }}>You are all set for now.</p>
            )}
          </div>

          {/* VISIT READINESS */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 18, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={20} color="#0ea5e9" /> Visit Readiness
            </h2>
            {readiness ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>Readiness Score</span>
                  <span style={{ fontWeight: 700, color: readiness.readiness_score === 100 ? '#10b981' : '#f59e0b' }}>
                    {readiness.readiness_score}%
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, marginBottom: 16 }}>
                  <div style={{ width: `${readiness.readiness_score}%`, height: '100%', background: readiness.readiness_score === 100 ? '#10b981' : '#f59e0b', borderRadius: 4 }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
                    <CheckCircle size={16} color="#10b981" /> Appointment confirmed
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
                    <CheckCircle size={16} color="#10b981" /> Check-in completed
                  </div>
                  {readiness.missing_info && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: '#b45309' }}>
                      <AlertCircle size={16} color="#f59e0b" /> Pending: {readiness.missing_info}
                    </div>
                  )}
                </div>
                
                {readiness.readiness_score < 100 && (
                  <button style={{ width: '100%', padding: '10px', marginTop: 20, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                    Complete Readiness
                  </button>
                )}
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>Readiness data unavailable.</p>
            )}
          </div>

          {/* PRESCRIPTIONS / MEDICATIONS */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 18, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pill size={20} color="#8b5cf6" /> Prescriptions
            </h2>
            {medication_summary && medication_summary.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {medication_summary.map((med, idx) => (
                  <div key={idx} style={{ padding: 12, background: '#f5f3ff', borderRadius: 8, border: '1px solid #ede9fe' }}>
                    <p style={{ fontWeight: 600, color: '#4c1d95', margin: '0 0 4px' }}>{med.medicine_name}</p>
                    <p style={{ fontSize: 13, color: '#6d28d9', margin: 0 }}>{med.dosage} - {med.frequency}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>No active prescriptions.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
