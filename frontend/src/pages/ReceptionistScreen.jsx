import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { UserPlus, PhoneCall, SkipForward, RotateCcw, Clock, Megaphone } from 'lucide-react';

export default function ReceptionistScreen() {
  const { queueState, connected, loading } = useQueueSocket();
  const { token } = useAuth();
  const [patientName, setPatientName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [avgTimeDraft, setAvgTimeDraft] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const inputRef = useRef(null);

  const authHeader = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  async function call(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeader, ...opts });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function handleAddPatient(e) {
    e.preventDefault();
    const name = patientName.trim();
    if (!name || submitting) return;
    setSubmitting(true);
    try {
      await call('/queue/add', { method: 'POST', body: JSON.stringify({ patientName: name }) });
      setPatientName('');
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
          <h1 className="page-header__title">Front Desk</h1>
          <p className="page-header__sub">Add patients · call next · keep the line moving</p>
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
              <div className="call-banner__sub">Token <strong>#{current.tokenNumber}</strong> — {current.patientName}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Now serving', value: current ? `#${current.tokenNumber}` : '—', sub: current?.patientName || 'No one being seen' },
          { label: 'Waiting', value: queueState?.totalWaiting ?? 0, sub: 'patients in line' },
          { label: 'Served today', value: queueState?.totalServedToday ?? 0, sub: 'completed visits' },
          { label: 'Avg consult', value: `${queueState?.avgConsultationTime ?? 0}m`, sub: 'per patient' },
        ].map((s, i) => (
          <motion.div key={s.label} className="card"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.label}</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 40, fontWeight: 600, margin: '4px 0', color: 'var(--color-ink)' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card__title">Add patient</div>
          <form onSubmit={handleAddPatient} style={{ display: 'flex', gap: 10 }}>
            <input ref={inputRef} className="input" placeholder="Patient name"
              value={patientName} onChange={(e) => setPatientName(e.target.value)} autoFocus disabled={submitting} />
            <button className="btn btn--primary" disabled={submitting || !patientName.trim()}>
              <UserPlus size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
              {submitting ? 'Adding…' : 'Add'}
            </button>
          </form>

          <div style={{ marginTop: 24 }}>
            <div className="card__title">Queue</div>
            <AnimatePresence>
              {waiting.length === 0 && (
                <div style={{ color: 'var(--color-muted)', padding: 20, textAlign: 'center' }}>No one waiting 🎉</div>
              )}
              {waiting.map((t, i) => (
                <motion.div key={t._id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * .03 }}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, marginBottom: 6,
                    background: i === 0 ? 'var(--color-primary-soft)' : 'var(--color-surface-2)', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600 }}>#{t.tokenNumber}</span>
                    <span>{t.patientName}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-ink-soft)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> ~{t.estimatedWaitMinutes}m
                  </span>
                </motion.div>
              ))}
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
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 80, fontWeight: 600, lineHeight: 1, color: 'var(--color-primary)' }}>
                    #{current.tokenNumber}
                  </div>
                  <div style={{ fontSize: 18, marginTop: 8 }}>{current.patientName}</div>
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
