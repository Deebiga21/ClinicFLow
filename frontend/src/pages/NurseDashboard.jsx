import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { 
  Users, Activity, ClipboardList, Clock, 
  AlertTriangle, PhoneCall, Pill, ShieldAlert 
} from 'lucide-react';

export default function NurseDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/nurse/dashboard`);
      if (!res.ok) throw new Error('Failed to load nurse dashboard');
      const json = await res.json();
      setData(json);
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
  }, []);


  const handleAction = async (queue_id, actionType) => {
    try {
      let endpoint = '';
      if (actionType === 'start') endpoint = '/api/pipeline/nurse/start';
      else if (actionType === 'ready') endpoint = '/api/pipeline/nurse/ready';
      else if (actionType === 'send') endpoint = '/api/pipeline/nurse/send-doctor';
      
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_id })
      });
      if (res.ok) {
        // Optimistically reload or wait for websocket
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !data) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Nurse Dashboard...</div>;
  if (error) return <div style={{ padding: 40, color: 'red' }}>Error: {error}</div>;

  const {
    clinic_overview, live_queue, patient_readiness,
    congestion, doctor_workload, recommendations, medicine_alerts
  } = data;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 40px' }}>
      
      <header style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 24, margin: '0 0 4px', color: '#0f172a' }}>Nurse Operations Center</h1>
        <p style={{ margin: 0, color: '#64748b' }}>Understand the current clinic state and prepare next patients.</p>
      </header>

      {/* 1. CLINIC OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Waiting', val: clinic_overview.patients_waiting, icon: Users, color: '#f59e0b' },
          { label: 'Checked In', val: clinic_overview.patients_checked_in, icon: ClipboardList, color: '#0ea5e9' },
          { label: 'Consulting', val: clinic_overview.patients_consulting, icon: Activity, color: '#10b981' },
          { label: 'Appts Today', val: clinic_overview.upcoming_appointments, icon: Clock, color: '#6366f1' }
        ].map((stat, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={24} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', margin: '0 0 4px' }}>{stat.label}</p>
              <p style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#0f172a' }}>{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* LEFT COLUMN: LIVE QUEUE & PATIENT READINESS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="#0ea5e9" /> Live Operational Queue
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '12px 8px', fontSize: 12, color: '#64748b' }}>Token</th>
                    <th style={{ padding: '12px 8px', fontSize: 12, color: '#64748b' }}>Patient</th>
                    <th style={{ padding: '12px 8px', fontSize: 12, color: '#64748b' }}>Status</th>
                    <th style={{ padding: '12px 8px', fontSize: 12, color: '#64748b' }}>Doctor</th>
                    <th style={{ padding: '12px 8px', fontSize: 12, color: '#64748b' }}>Predicted Wait</th>
                    <th style={{ padding: '12px 8px', fontSize: 12, color: '#64748b' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {live_queue.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>Queue is empty</td></tr>
                  ) : live_queue.map((q, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 700 }}>#{q.token_number}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{q.patient_name}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: q.status === 'Waiting' ? '#fef3c7' : '#d1fae5', color: q.status === 'Waiting' ? '#b45309' : '#047857' }}>
                          {q.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: '#475569', fontSize: 14 }}>{q.doctor_name || '-'}</td>
                      <td style={{ padding: '12px 8px', color: '#475569', fontSize: 14 }}>{q.predicted_wait || '-'} mins</td>
                      <td style={{ padding: '12px 8px' }}>
                        {q.status === 'Waiting' && (
                          <button onClick={() => handleAction(q.id, 'start')} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginRight: 4 }}>Call Next</button>
                        )}
                        {q.status === 'With Nurse' && (
                          <button onClick={() => handleAction(q.id, 'ready')} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginRight: 4 }}>Mark Ready</button>
                        )}
                        {q.status === 'Ready' && (
                          <button onClick={() => handleAction(q.id, 'send')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Send to Dr</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={18} color="#10b981" /> Patient Readiness Center
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {patient_readiness.map((pr, i) => (
                <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>{pr.patient_name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: pr.readiness_score === 100 ? '#10b981' : '#f59e0b' }}>{pr.readiness_score}% Ready</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span>Pred Duration: {pr.predicted_duration || 10} min</span>
                    {pr.missing_info && <span style={{ color: '#b45309' }}>Missing: {pr.missing_info}</span>}
                  </div>
                  <button style={{ width: '100%', marginTop: 12, background: pr.readiness_score === 100 ? '#f1f5f9' : '#0ea5e9', color: pr.readiness_score === 100 ? '#94a3b8' : '#fff', border: 'none', padding: 8, borderRadius: 4, fontWeight: 600, cursor: pr.readiness_score === 100 ? 'default' : 'pointer' }}>
                    {pr.readiness_score === 100 ? 'Ready' : 'Prepare'}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PREDICTIONS, WORKLOAD, ALERTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* CONGESTION PREDICTION */}
          <div style={{ background: congestion.risk_level === 'High' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${congestion.risk_level === 'High' ? '#fecaca' : '#bbf7d0'}`, borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: congestion.risk_level === 'High' ? '#991b1b' : '#166534', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
              <AlertTriangle size={16} /> Congestion Monitor
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px' }}>Risk Level</p>
                <p style={{ fontWeight: 700, color: congestion.risk_level === 'High' ? '#dc2626' : '#16a34a', margin: 0 }}>{congestion.risk_level}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px' }}>Predicted Peak</p>
                <p style={{ fontWeight: 700, margin: 0 }}>{congestion.predicted_peak_time}</p>
              </div>
            </div>
          </div>

          {/* DOCTOR WORKLOAD */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
              <Activity size={16} color="#6366f1" /> Operational Workload
            </h2>
            {doctor_workload.map((doc, i) => (
              <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i === doctor_workload.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <p style={{ fontWeight: 600, margin: '0 0 8px' }}>{doc.name}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#475569' }}>
                  <span>Waiting: <strong style={{ color: '#0f172a' }}>{doc.waiting_patients}</strong></span>
                  <span>Active: <strong style={{ color: '#0f172a' }}>{doc.active_consultations}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* RECOMMENDATIONS */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
              <ShieldAlert size={16} color="#0ea5e9" /> Recommendations
            </h2>
            {recommendations.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 13 }}>No active recommendations.</p>
            ) : recommendations.map((rec, i) => (
              <div key={i} style={{ padding: 12, background: '#f8fafc', borderRadius: 8, marginBottom: 12 }}>
                <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>{rec.message}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Reason: {rec.reason}</p>
              </div>
            ))}
          </div>

          {/* MEDICINE OPERATIONS */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
              <Pill size={16} color="#8b5cf6" /> Medicine Alerts
            </h2>
            {medicine_alerts.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 13 }}>Stock levels are normal.</p>
            ) : medicine_alerts.map((med, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i === medicine_alerts.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <div>
                  <p style={{ fontWeight: 600, margin: '0 0 2px', fontSize: 13 }}>{med.name}</p>
                  <p style={{ fontSize: 11, color: '#dc2626', margin: 0 }}>Low Stock: {med.quantity} left</p>
                </div>
                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Order</button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
