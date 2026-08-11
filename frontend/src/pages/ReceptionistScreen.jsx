import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { UserPlus, PhoneCall, SkipForward, RotateCcw, Clock, Megaphone, Activity, AlertTriangle, ShieldAlert, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export default function ReceptionistScreen() {
  const { queueState, connected, loading } = useQueueSocket();
  const { token } = useAuth();
  const [patientName, setPatientName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [avgTimeDraft, setAvgTimeDraft] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [vitals, setVitals] = useState({
    age: 35,
    systolic_bp: 120,
    diastolic_bp: 80,
    heart_rate: 75,
    spo2: 98,
    temperature: 37.0,
    pain_score: 0,
    symptom_severity: 1
  });

  const [mlPrediction, setMlPrediction] = useState(null);
  const [evaluatingMl, setEvaluatingMl] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [showDiseasePredictor, setShowDiseasePredictor] = useState(false);
  
  const commonSymptoms = [
    'Fever', 'Fatigue', 'Headache', 'Cough', 'Nausea', 'Diarrhea',
    'Muscle Pain', 'Rash', 'Sore Throat', 'Shortness of Breath'
  ];

  const inputRef = useRef(null);

  const authHeader = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  async function call(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeader, ...opts });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // Real-time ML priority calculation preview
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setEvaluatingMl(true);
      try {
        const res = await fetch(`${API_BASE}/ml/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vitals)
        });
        const data = await res.json();
        if (active) setMlPrediction(data);
      } catch (err) {
        console.error('ML predict preview error:', err);
      } finally {
        if (active) setEvaluatingMl(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [vitals]);

  async function handleAddPatient(e) {
    e.preventDefault();
    const name = patientName.trim();
    if (!name || submitting) return;
    setSubmitting(true);
    try {
      let diseasePrediction = null;

      // If symptoms selected, run the disease prediction first
      if (selectedSymptoms.length > 0) {
        const mlRes = await fetch(`${API_BASE}/ml/predict-disease`, {
          method: 'POST',
          headers: authHeader,
          body: JSON.stringify({ symptoms: selectedSymptoms })
        });
        if (mlRes.ok) {
          diseasePrediction = await mlRes.json();
        }
      }

      await call('/queue/add', {
        method: 'POST',
        body: JSON.stringify({
          patientName: name,
          vitals: showVitals ? vitals : undefined,
          diseasePrediction
        })
      });
      setPatientName('');
      setVitals({ age: 35, systolic_bp: 120, diastolic_bp: 80, heart_rate: 75, spo2: 98, temperature: 37.0, pain_score: 0, symptom_severity: 1 });
      setShowVitals(false);
      setSelectedSymptoms([]);
      setShowDiseasePredictor(false);
      inputRef.current?.focus();
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  }

  async function handle(path) {
    if (actionPending) return;
    setActionPending(true);
    try { await call(path, { method: 'POST' }); }
    catch (err) { alert(err.message); }
    finally { setActionPending(false); }
  }

  async function handleSaveAvgTime(e) {
    e.preventDefault();
    const value = Number(avgTimeDraft);
    if (!value || value <= 0) return;
    try {
      await call('/queue/settings', { method: 'PUT', body: JSON.stringify({ avgConsultationTime: value }) });
      setAvgTimeDraft('');
    } catch (err) { alert(err.message); }
  }

  if (loading) return <AppShell><div style={{ padding: 40 }}>Loading queue…</div></AppShell>;

  const current = queueState?.currentToken;
  const waiting = queueState?.waitingQueue || [];

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Front Desk & Triage</h1>
          <p className="page-header__sub">Add patients · Priority Alerts · keep line moving</p>
        </div>
        <div className={`live-pill ${connected ? 'is-live' : ''}`}>
          <span className="live-pill__dot" /> {connected ? 'Live' : 'Reconnecting…'}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {current && (
          <motion.div key={current.tokenNumber}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="call-banner">
            <Megaphone size={20} />
            <div>
              <div className="call-banner__title">Currently in the room</div>
              <div className="call-banner__sub">
                Token <strong>#{current.tokenNumber}</strong> — {current.patientName}
                {current.priorityLevel && (
                  <span style={{
                    marginLeft: 10, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    background: current.priorityLevel === 'HIGH' ? '#ef4444' : (current.priorityLevel === 'MEDIUM' ? '#f59e0b' : '#10b981'),
                    color: '#fff'
                  }}>
                    {current.priorityLevel === 'LOW' ? 'ROUTINE' : `${current.priorityLevel} PRIORITY`}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Now serving', value: current ? `#${current.tokenNumber}` : '—', sub: current?.patientName || 'No one being seen' },
          { label: 'Waiting', value: queueState?.totalWaiting ?? 0, sub: 'patients in line' },
          { label: 'High Priority Alerts', value: waiting.filter(t => t.priorityLevel === 'HIGH' || t.isEmergencyAlert).length, sub: 'urgent cases flagged automatically' },
          { label: 'Avg consult', value: `${queueState?.avgConsultationTime ?? 0}m`, sub: 'per patient' },
        ].map((s, i) => (
          <motion.div key={s.label} className="card"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, margin: '4px 0', color: 'var(--color-ink)' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <div className="card__title" style={{ margin: 0 }}>Add patient</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn--ghost" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => setShowDiseasePredictor(!showDiseasePredictor)}>
                <Activity size={14} style={{ marginRight: 4 }} />
                {showDiseasePredictor ? 'Hide Disease Predictor' : 'Disease Predictor'}
              </button>
              <button className="btn btn--ghost" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => setShowVitals(!showVitals)}>
                <Activity size={14} style={{ marginRight: 4 }} />
                {showVitals ? 'Hide Triage Vitals' : 'Triage Vitals'}
              </button>
            </div>
          </div>

          <form onSubmit={handleAddPatient} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input ref={inputRef} className="input" placeholder="Patient name"
                value={patientName} onChange={(e) => setPatientName(e.target.value)} autoFocus disabled={submitting} />
              <button className="btn btn--primary" disabled={submitting || !patientName.trim()}>
                <UserPlus size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                {submitting ? 'Adding…' : 'Add'}
              </button>
            </div>

            {/* Prediction Badge */}
            {mlPrediction && showVitals && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: mlPrediction.isEmergencyAlert ? '#fef2f2' : (mlPrediction.priorityLevel === 'MEDIUM' ? '#fffbeb' : '#ecfdf5'),
                border: `1px solid ${mlPrediction.isEmergencyAlert ? '#fca5a5' : (mlPrediction.priorityLevel === 'MEDIUM' ? '#fcd34d' : '#6ee7b7')}`,
                color: mlPrediction.isEmergencyAlert ? '#991b1b' : (mlPrediction.priorityLevel === 'MEDIUM' ? '#92400e' : '#065f46')
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {mlPrediction.isEmergencyAlert ? <ShieldAlert size={16} color="#dc2626" /> : <Sparkles size={16} />}
                  <strong>Prediction: {mlPrediction.priorityLevel === 'LOW' ? 'ROUTINE' : `${mlPrediction.priorityLevel} PRIORITY`}</strong>
                  <span>(Score: {mlPrediction.priorityScore}/100)</span>
                </div>
                {evaluatingMl && <span style={{ opacity: 0.6, fontSize: 11 }}>Calculating…</span>}
              </div>
            )}

            {/* Disease Predictor (Symptoms Selection) */}
            {showDiseasePredictor && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                style={{ background: 'var(--color-surface-2)', padding: 14, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} color="var(--color-primary)" /> Disease Predictor Symptoms
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {commonSymptoms.map(sym => {
                    const isSel = selectedSymptoms.includes(sym);
                    return (
                      <button type="button" key={sym} onClick={() => setSelectedSymptoms(isSel ? selectedSymptoms.filter(s => s !== sym) : [...selectedSymptoms, sym])}
                        style={{
                          padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: '1px solid', cursor: 'pointer',
                          background: isSel ? 'var(--color-primary)' : 'var(--color-surface)',
                          borderColor: isSel ? 'var(--color-primary)' : 'var(--color-border)',
                          color: isSel ? '#fff' : 'var(--color-ink-soft)',
                          transition: 'all .2s ease'
                        }}>
                        {sym}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Optional Triage Vitals Input Fields */}
            {showVitals && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                style={{ background: 'var(--color-surface-2)', padding: 14, borderRadius: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>Age (Years)</label>
                  <input className="input" type="number" value={vitals.age} onChange={e => setVitals({...vitals, age: Number(e.target.value)})} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>SpO2 Oxygen (%)</label>
                  <input className="input" type="number" value={vitals.spo2} onChange={e => setVitals({...vitals, spo2: Number(e.target.value)})} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>Systolic BP (mmHg)</label>
                  <input className="input" type="number" value={vitals.systolic_bp} onChange={e => setVitals({...vitals, systolic_bp: Number(e.target.value)})} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>Heart Rate (bpm)</label>
                  <input className="input" type="number" value={vitals.heart_rate} onChange={e => setVitals({...vitals, heart_rate: Number(e.target.value)})} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>Temp (°C)</label>
                  <input className="input" type="number" step="0.1" value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: Number(e.target.value)})} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>Pain Score (0 - 10)</label>
                  <input className="input" type="number" min="0" max="10" value={vitals.pain_score} onChange={e => setVitals({...vitals, pain_score: Number(e.target.value)})} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>Symptom Severity</label>
                  <select className="input" value={vitals.symptom_severity} onChange={e => setVitals({...vitals, symptom_severity: Number(e.target.value)})}>
                    <option value={1}>1 - Mild (Routine Consultation)</option>
                    <option value={2}>2 - Moderate (Fever, Acute Pain, Cough)</option>
                    <option value={3}>3 - Severe (Chest pain, Shortness of breath, Trauma)</option>
                  </select>
                </div>
              </motion.div>
            )}
          </form>

          <div style={{ marginTop: 24 }}>
            <div className="card__title">Queue & Priority Rankings</div>
            <AnimatePresence>
              {waiting.length === 0 && (
                <div style={{ color: 'var(--color-muted)', padding: 20, textAlign: 'center' }}>No one waiting 🎉</div>
              )}
              {waiting.map((t, i) => {
                const isHigh = t.priorityLevel === 'HIGH' || t.isEmergencyAlert;
                const isMedium = t.priorityLevel === 'MEDIUM';
                return (
                  <motion.div key={t._id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * .03 }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, marginBottom: 6,
                      background: isHigh ? '#fef2f2' : (isMedium ? '#fffbeb' : (i === 0 ? 'var(--color-primary-soft)' : 'var(--color-surface-2)')),
                      borderLeft: isHigh ? '4px solid #ef4444' : (isMedium ? '4px solid #f59e0b' : '4px solid transparent'),
                      alignItems: 'center'
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20, fontWeight: 700 }}>#{t.tokenNumber}</span>
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {t.patientName}
                          {isHigh && (
                            <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                              HIGH PRIORITY
                            </span>
                          )}
                          {isMedium && (
                            <span style={{ background: '#f59e0b', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                              MEDIUM PRIORITY
                            </span>
                          )}
                        </div>
                        {t.consultationReason && (
                          <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>
                            Reason: {t.consultationReason}
                          </div>
                        )}
                        {t.predictedDisease && (
                          <div style={{ fontSize: 11, color: 'var(--color-primary-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Sparkles size={10} /> Predicted: {t.predictedDisease} ({Math.round(t.diseaseConfidence*100)}%)
                          </div>
                        )}
                        {t.priorityScore > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--color-ink-soft)' }}>
                            Triage Score: {t.priorityScore}/100
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--color-ink-soft)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> ~{t.estimatedWaitMinutes}m
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card__title">Now serving</div>
            <AnimatePresence mode="wait">
              {current ? (
                <motion.div key={current._id}
                  initial={{ scale: .85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, color: 'var(--color-primary)' }}>
                    #{current.tokenNumber}
                  </div>
                  <div style={{ fontSize: 18, marginTop: 8, fontWeight: 600 }}>{current.patientName}</div>
                  {current.priorityLevel && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                        background: current.priorityLevel === 'HIGH' ? '#ef4444' : (current.priorityLevel === 'MEDIUM' ? '#f59e0b' : '#10b981'),
                        color: '#fff'
                      }}>
                        {current.priorityLevel === 'LOW' ? 'ROUTINE' : `${current.priorityLevel} PRIORITY`} ({current.priorityScore}/100)
                      </span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-muted)' }}>No one being seen</div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn--accent" style={{ flex: 1 }} onClick={() => handle('/queue/call-next')}
                disabled={actionPending || (waiting.length === 0 && !current)}>
                <PhoneCall size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Call next
              </button>
              <button className="btn btn--ghost" onClick={() => handle('/queue/skip')} disabled={actionPending || !current}>
                <SkipForward size={16} />
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card__title">Avg consultation time</div>
            <form onSubmit={handleSaveAvgTime} style={{ display: 'flex', gap: 8 }}>
              <input className="input" type="number" min="1" placeholder={`${queueState?.avgConsultationTime ?? 10} min`}
                value={avgTimeDraft} onChange={(e) => setAvgTimeDraft(e.target.value)} />
              <button className="btn btn--primary">Save</button>
            </form>
            <button className="btn btn--ghost" style={{ marginTop: 14, width: '100%' }} onClick={() => { if (confirm('Reset all tokens?')) handle('/queue/reset'); }}>
              <RotateCcw size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Reset queue (demo)
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

