import { useState } from 'react';
import { Box, Play, ArrowRight } from 'lucide-react';

export default function DigitalTwin() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [doctorsDelta, setDoctorsDelta] = useState(1);
  const [patientsDelta, setPatientsDelta] = useState(0);

  const runSimulation = () => {
    setLoading(true);
    fetch('http://127.0.0.1:8000/api/digital_twin/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        added_doctors: Number(doctorsDelta),
        added_patients: Number(patientsDelta)
      })
    })
      .then(r => r.json())
      .then(d => {
        setResult(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Digital Twin Simulation</h1>
          <p className="page-header__sub">Test "What-If" scenarios before making operational changes</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Scenario Parameters</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 8 }}>Add/Remove Doctors</label>
            <input type="number" className="input" value={doctorsDelta} onChange={e => setDoctorsDelta(e.target.value)} />
            <small style={{ color: 'var(--color-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>Current active doctors will be offset by this value.</small>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 8 }}>Incoming Patient Surge</label>
            <input type="number" className="input" value={patientsDelta} onChange={e => setPatientsDelta(e.target.value)} />
          </div>
          <button className="btn btn--primary" style={{ width: '100%' }} onClick={runSimulation} disabled={loading}>
            <Play size={16} style={{ marginRight: 8 }} /> {loading ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box size={18} color="var(--color-primary)" /> Simulation Results
          </h3>
          
          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-muted)' }}>
              Configure parameters and run the simulation to see impact on patient flow.
            </div>
          )}

          {loading && <div style={{ textAlign: 'center', padding: '40px 20px' }}>Running Monte Carlo simulation...</div>}

          {result && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
                <div style={{ background: 'var(--color-surface-2)', padding: 16, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)' }}>BASELINE (CURRENT)</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>{Math.round(result.baseline.average_wait_minutes)} min</div>
                  <div style={{ fontSize: 12 }}>Avg Wait Time</div>
                </div>
                <ArrowRight color="var(--color-muted)" />
                <div style={{ background: result.improvement.wait_reduction_minutes > 0 ? '#f0fdf4' : '#fef2f2', padding: 16, borderRadius: 8, border: `1px solid ${result.improvement.wait_reduction_minutes > 0 ? '#86efac' : '#fca5a5'}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: result.improvement.wait_reduction_minutes > 0 ? '#047857' : '#b91c1c' }}>SIMULATED</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>{Math.round(result.simulation.average_wait_minutes)} min</div>
                  <div style={{ fontSize: 12 }}>Avg Wait Time</div>
                </div>
              </div>

              <div style={{ marginTop: 24, padding: 16, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Conclusion</div>
                <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', lineHeight: 1.5 }}>
                  {result.improvement.wait_reduction_minutes > 0 
                    ? `Adding resources reduces the average wait time by ${Math.round(result.improvement.wait_reduction_minutes)} minutes per patient.`
                    : `This scenario increases the average wait time by ${Math.abs(Math.round(result.improvement.wait_reduction_minutes))} minutes. Not recommended.`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
