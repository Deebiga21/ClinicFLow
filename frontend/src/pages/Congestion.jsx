import { useState, useEffect } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';

export default function Congestion() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/congestion/status')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Congestion Intelligence</h1>
          <p className="page-header__sub">Real-time bottleneck detection & patient flow metrics</p>
        </div>
      </header>

      {loading ? <p>Loading congestion data from ML Engine...</p> : data ? (
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, background: data.score > 70 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${data.score > 70 ? '#fca5a5' : '#86efac'}` }}>
            {data.score > 70 ? <AlertTriangle size={32} color="#ef4444" /> : <Activity size={32} color="#10b981" />}
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: data.score > 70 ? '#b91c1c' : '#047857' }}>
                Status: {data.status} (Score: {Math.round(data.score)})
              </div>
              <p style={{ color: 'var(--color-ink-soft)', marginTop: 4 }}>
                {data.message}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="card">
              <div style={{ color: 'var(--color-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Waiting Patients</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 8 }}>{data.metrics.waiting_patients}</div>
            </div>
            <div className="card">
              <div style={{ color: 'var(--color-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Active Doctors</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 8 }}>{data.metrics.active_doctors}</div>
            </div>
            <div className="card">
              <div style={{ color: 'var(--color-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Average Wait (est)</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 8 }}>{Math.round(data.metrics.average_wait_minutes)} min</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ color: 'red' }}>Failed to load congestion predictions. Ensure the Python ML engine is running.</div>
      )}
    </>
  );
}
