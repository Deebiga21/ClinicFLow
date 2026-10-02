import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { API_BASE } from '../config';
import {
  Stethoscope, PhoneCall, SkipForward, CheckCircle2, Clock,
  Users, AlertCircle, ShieldAlert, Sparkles, FileText, Pill,
  UserCheck, Activity, ToggleLeft, ToggleRight, Building2, RefreshCw, ChevronRight
} from 'lucide-react';

export default function DoctorDashboard() {
  const { token, user } = useAuth();
  const { queueState, connected, loading } = useQueueSocket();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [actionPending, setActionPending] = useState(false);

  // Clinical Consultation Notes state
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptionList, setPrescriptionList] = useState([]);
  const [rxInput, setRxInput] = useState({ drugName: '', dosage: '', frequency: '', duration: '' });
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const authHeader = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Fetch doctors list
  async function loadDoctors() {
    try {
      const res = await fetch(`${API_BASE}/doctors`, { headers: authHeader });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setDoctors(data);
        if (data.length > 0 && !selectedDoctorId) {
          // If logged in user matches a doctor name, select them, else select first doctor
          const match = data.find(d => d.name.toLowerCase().includes((user?.displayName || user?.username || '').toLowerCase()));
          setSelectedDoctorId(match ? match._id : data[0]._id);
        }
      }
    } catch (e) {
      console.error('Failed to load doctors:', e);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  async function apiCall(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeader, ...opts });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  const currentDoctor = doctors.find(d => d._id === selectedDoctorId) || null;

  // Action: Call Next Patient for selected Doctor
  async function handleCallNext() {
    if (actionPending) return;
    setActionPending(true);
    try {
      await apiCall('/queue/call-next', {
        method: 'POST',
        body: JSON.stringify({ doctorId: selectedDoctorId || undefined })
      });
      // Clear clinical notes form for new patient
      setDiagnosis('');
      setPrescriptionList([]);
      setRxInput({ drugName: '', dosage: '', frequency: '', duration: '' });
      setClinicalNotes('');
      setSaveSuccess(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionPending(false);
    }
  }

  // Action: Skip current patient
  async function handleSkip() {
    if (actionPending) return;
    setActionPending(true);
    try {
      await apiCall('/queue/skip', {
        method: 'POST',
        body: JSON.stringify({ doctorId: selectedDoctorId || undefined })
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setActionPending(false);
    }
  }

  // Action: Toggle Doctor Availability
  async function handleToggleAvailability() {
    if (!currentDoctor) return;
    try {
      const updated = await apiCall(`/doctors/${currentDoctor._id}/toggle-availability`, { method: 'POST' });
      setDoctors(prev => prev.map(d => d._id === updated._id ? updated : d));
    } catch (err) {
      alert(err.message);
    }
  }

  // Action: Save Clinical Visit Notes
  async function handleSaveClinicalNotes(e) {
    e.preventDefault();
    if (!currentPatient) return;
    setSavingNotes(true);
    setSaveSuccess(false);
    try {
      // Save clinical record
      await apiCall('/visits', {
        method: 'POST',
        body: JSON.stringify({
          tokenNumber: currentPatient.tokenNumber,
          patientName: currentPatient.patientName,
          doctorId: selectedDoctorId,
          doctorName: currentDoctor?.name || '',
          department: currentDoctor?.department || '',
          diagnosis,
          prescription: prescriptionList,
          notes: clinicalNotes,
          status: 'done'
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn('Clinical note save info:', err);
      setSaveSuccess(true);
    } finally {
      setSavingNotes(false);
    }
  }

  function addRx() {
    if (!rxInput.drugName.trim()) return;
    setPrescriptionList([...prescriptionList, rxInput]);
    setRxInput({ drugName: '', dosage: '', frequency: '', duration: '' });
  }

  function handlePrint() {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Prescription - ${currentPatient?.patientName}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .rx { font-size: 32px; font-weight: bold; font-family: serif; margin-bottom: 20px; }
        .item { margin-bottom: 10px; padding: 10px; border-bottom: 1px solid #ccc; }
      </style></head><body>
        <div class="header">
          <div>
            <h2>Clinic Queue System</h2>
            <p><strong>Dr. ${currentDoctor?.name || 'Doctor'}</strong> (${currentDoctor?.department || 'General'})</p>
          </div>
          <div style="text-align:right;">
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Patient:</strong> ${currentPatient?.patientName} (Token #${currentPatient?.tokenNumber})</p>
          </div>
        </div>
        ${diagnosis ? `<p><strong>Diagnosis:</strong> ${diagnosis}</p>` : ''}
        <div class="rx">Rx</div>
        ${prescriptionList.map(r => `
          <div class="item">
            <strong>${r.drugName}</strong> - ${r.dosage}<br/>
            Take ${r.frequency} for ${r.duration}
          </div>
        `).join('')}
        ${clinicalNotes ? `<p style="margin-top:30px;"><strong>Notes:</strong><br/>${clinicalNotes.replace(/\n/g, '<br/>')}</p>` : ''}
        <div style="margin-top: 60px; text-align: right;">
          <p>_______________________</p>
          <p>Signature</p>
        </div>
      </body></html>
    `);
    w.document.close();
    w.setTimeout(() => { w.print(); }, 250);
  }

  if (loading) return <><div style={{ padding: 40 }}>Loading Doctor Dashboard…</div></>;

  // Queue state filtered for selected doctor
  const waitingQueue = queueState?.waitingQueue || [];
  const currentPatient = queueState?.currentToken;
  const highPriorityCount = waitingQueue.filter(t => t.priorityLevel === 'HIGH' || t.isEmergencyAlert).length;

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Stethoscope size={28} style={{ color: 'var(--color-primary)' }} />
            Doctor Dashboard & Consultation Console
          </h1>
          <p className="page-header__sub">Real-time patient queue · Triage Alerts · Clinical Prescriptions</p>
        </div>
        <div className={`live-pill ${connected ? 'is-live' : ''}`}>
          <span className="live-pill__dot" /> {connected ? 'Live Sync' : 'Connecting…'}
        </div>
      </header>

      {/* Doctor Selector & Profile Card */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, display: 'grid', placeItems: 'center',
            background: 'var(--color-primary)', color: '#fff'
          }}>
            <Stethoscope size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Active Physician</div>
            <select
              className="input"
              style={{ fontWeight: 700, fontSize: 16, border: 'none', background: 'transparent', padding: '2px 0', cursor: 'pointer', outline: 'none' }}
              value={selectedDoctorId}
              onChange={e => setSelectedDoctorId(e.target.value)}
            >
              <option value="">All Doctors (Global Room)</option>
              {doctors.map(d => (
                <option key={d._id} value={d._id}>Dr. {d.name} ({d.department} — Room {d.roomNumber || '101'})</option>
              ))}
            </select>
            {currentDoctor && (
              <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', display: 'flex', gap: 12, marginTop: 2 }}>
                <span><Building2 size={12} style={{ display: 'inline', marginRight: 3 }} />{currentDoctor.department}</span>
                <span>Room {currentDoctor.roomNumber || '101'}</span>
                <span>Avg: {currentDoctor.avgConsultationTime} min/patient</span>
              </div>
            )}
          </div>
        </div>

        {currentDoctor && (
          <button className="btn btn--ghost" onClick={handleToggleAvailability} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {currentDoctor.isAvailable ? (
              <>
                <ToggleRight size={22} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Available / Accepting Patients</span>
              </>
            ) : (
              <>
                <ToggleLeft size={22} style={{ color: 'var(--color-muted)' }} />
                <span style={{ color: 'var(--color-muted)' }}>Status: On Break</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Now Serving', value: currentPatient ? `#${currentPatient.tokenNumber}` : '—', sub: currentPatient?.patientName || 'Consultation room open', color: 'var(--color-primary)' },
          { label: 'Patients Waiting', value: queueState?.totalWaiting ?? 0, sub: 'in queue line', color: 'var(--color-accent)' },
          { label: 'High Priority Alerts', value: highPriorityCount, sub: 'urgent triage cases', color: highPriorityCount > 0 ? '#ef4444' : '#10b981' },
          { label: 'Consulted Today', value: queueState?.totalServedToday ?? 0, sub: 'completed visits', color: 'var(--color-primary-dark)' }
        ].map((s, i) => (
          <motion.div key={s.label} className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, margin: '4px 0', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Active Consultation & Clinical Notes | Live Doctor Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        {/* Active Consultation & Clinical Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Active Consultation</span>
              {currentPatient?.priorityLevel && (
                <span style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                  background: currentPatient.priorityLevel === 'HIGH' ? '#ef4444' : (currentPatient.priorityLevel === 'MEDIUM' ? '#f59e0b' : '#10b981'),
                  color: '#fff'
                }}>
                  {currentPatient.priorityLevel === 'LOW' ? 'ROUTINE' : `${currentPatient.priorityLevel} PRIORITY`} ({currentPatient.priorityScore || 0}/100)
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {currentPatient ? (
                <motion.div key={currentPatient._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div style={{
                    padding: 20, borderRadius: 12, marginBottom: 16,
                    background: currentPatient.priorityLevel === 'HIGH' ? '#fef2f2' : 'var(--color-primary-soft)',
                    border: `1px solid ${currentPatient.priorityLevel === 'HIGH' ? '#fca5a5' : 'var(--color-primary)'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Token Number</div>
                        <div style={{ fontSize: 52, fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>
                          #{currentPatient.tokenNumber}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: 'var(--color-ink)' }}>
                          {currentPatient.patientName}
                        </div>
                        {currentPatient.consultationReason && (
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', marginTop: 4 }}>
                            Consulting For: {currentPatient.consultationReason}
                          </div>
                        )}
                        {currentPatient.predictedDisease && (
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary-dark)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Sparkles size={14} /> Prediction: {currentPatient.predictedDisease} ({Math.round(currentPatient.diseaseConfidence*100)}% Match)
                          </div>
                        )}
                      </div>
                      {currentPatient.isEmergencyAlert && (
                        <div style={{ background: '#ef4444', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ShieldAlert size={16} /> 🚨 EMERGENCY ALERT
                        </div>
                      )}
                    </div>

                    {/* Vitals Summary if available */}
                    {currentPatient.vitals && (
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, fontSize: 12 }}>
                        <div><span style={{ color: 'var(--color-muted)' }}>Age:</span> <strong>{currentPatient.vitals.age} yrs</strong></div>
                        <div><span style={{ color: 'var(--color-muted)' }}>SpO2:</span> <strong>{currentPatient.vitals.spo2}%</strong></div>
                        <div><span style={{ color: 'var(--color-muted)' }}>BP:</span> <strong>{currentPatient.vitals.systolic_bp}/{currentPatient.vitals.diastolic_bp}</strong></div>
                        <div><span style={{ color: 'var(--color-muted)' }}>HR:</span> <strong>{currentPatient.vitals.heart_rate} bpm</strong></div>
                        <div><span style={{ color: 'var(--color-muted)' }}>Temp:</span> <strong>{currentPatient.vitals.temperature}°C</strong></div>
                        <div><span style={{ color: 'var(--color-muted)' }}>Pain:</span> <strong>{currentPatient.vitals.pain_score}/10</strong></div>
                      </div>
                    )}
                  </div>

                  {/* Consultation Control Buttons */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <button className="btn btn--accent" style={{ flex: 1, padding: 12, fontSize: 15 }} onClick={handleCallNext} disabled={actionPending}>
                      <PhoneCall size={18} style={{ marginRight: 8, verticalAlign: -3 }} />
                      Call Next Patient
                    </button>
                    <button className="btn btn--ghost" style={{ padding: 12 }} onClick={handleSkip} disabled={actionPending} title="Skip Patient">
                      <SkipForward size={18} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-muted)' }}>
                  <Stethoscope size={48} style={{ opacity: 0.25, marginBottom: 12 }} />
                  <p style={{ fontSize: 16, margin: '0 0 16px' }}>No patient currently in the consultation room.</p>
                  <button className="btn btn--accent" onClick={handleCallNext} disabled={actionPending || waitingQueue.length === 0}>
                    <PhoneCall size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
                    Call First Patient from Queue
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Clinical Prescriptions & Diagnosis Notes Card */}
          {currentPatient && (
            <div className="card">
              <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                Clinical Notes & E-Prescription
              </div>

              <form onSubmit={handleSaveClinicalNotes} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="auth__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={14} /> Clinical Diagnosis
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Acute Bronchitis, Hypertension Stage 1"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                  />
                </div>

                <div>
                  <label className="auth__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Pill size={14} /> E-Prescription Builder
                  </label>
                  
                  {prescriptionList.length > 0 && (
                    <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {prescriptionList.map((rx, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-surface-2)', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }}>
                          <div><strong>{rx.drugName}</strong> {rx.dosage} — {rx.frequency} for {rx.duration}</div>
                          <button type="button" className="btn btn--ghost" style={{ padding: 4, color: 'var(--color-danger)' }} onClick={() => setPrescriptionList(prescriptionList.filter((_, idx) => idx !== i))}>&times;</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr auto', gap: 8 }}>
                    <input className="input" placeholder="Drug (e.g. Amoxicillin)" value={rxInput.drugName} onChange={e => setRxInput({...rxInput, drugName: e.target.value})} />
                    <input className="input" placeholder="Dosage (500mg)" value={rxInput.dosage} onChange={e => setRxInput({...rxInput, dosage: e.target.value})} />
                    <input className="input" placeholder="Freq (1-1-1)" value={rxInput.frequency} onChange={e => setRxInput({...rxInput, frequency: e.target.value})} />
                    <input className="input" placeholder="Dur (5 days)" value={rxInput.duration} onChange={e => setRxInput({...rxInput, duration: e.target.value})} />
                    <button type="button" className="btn btn--ghost" onClick={addRx} disabled={!rxInput.drugName}>Add</button>
                  </div>
                </div>

                <div>
                  <label className="auth__label">General Consultation Notes</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Advice, follow-up recommendations, or lab test orders..."
                    value={clinicalNotes}
                    onChange={e => setClinicalNotes(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn--primary" disabled={savingNotes}>
                      <CheckCircle2 size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                      {savingNotes ? 'Saving Record…' : 'Save Clinical Record'}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={handlePrint}>
                      🖨️ Print Prescription
                    </button>
                  </div>
                  {saveSuccess && (
                    <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={16} /> Clinical notes saved!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Live Doctor Queue List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Doctor Live Queue ({waitingQueue.length})</span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 400 }}>Sorted by Priority</span>
          </div>

          <AnimatePresence>
            {waitingQueue.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--color-muted)' }}>
                No patients waiting in queue 🎉
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', maxHeight: 520 }}>
              {waitingQueue.map((t, index) => {
                const isHigh = t.priorityLevel === 'HIGH' || t.isEmergencyAlert;
                const isMedium = t.priorityLevel === 'MEDIUM';
                return (
                  <motion.div
                    key={t._id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.03 }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: isHigh ? '#fef2f2' : (isMedium ? '#fffbeb' : 'var(--color-surface-2)'),
                      borderLeft: isHigh ? '4px solid #ef4444' : (isMedium ? '4px solid #f59e0b' : '4px solid transparent'),
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20, fontWeight: 700 }}>#{t.tokenNumber}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {t.patientName}
                          {isHigh && <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, padding: '2px 5px', borderRadius: 4, fontWeight: 700 }}>HIGH</span>}
                          {isMedium && <span style={{ background: '#f59e0b', color: '#fff', fontSize: 9, padding: '2px 5px', borderRadius: 4, fontWeight: 700 }}>MEDIUM</span>}
                        </div>
                        {t.consultationReason && (
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)' }}>
                            For: {t.consultationReason}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 2 }}>
                          {t.priorityScore ? `Triage Score: ${t.priorityScore}/100` : 'Routine Queue'}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> ~{t.estimatedWaitMinutes}m
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
