import { motion } from 'framer-motion';
import AppShell from '../components/AppShell';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Clock } from 'lucide-react';

export default function WaitTimes() {
  const { queueState, connected, loading } = useQueueSocket();
  if (loading) return <AppShell><div style={{ padding: 40 }}>Loading…</div></AppShell>;
  const waiting = queueState?.waitingQueue || [];
  const avg = queueState?.avgConsultationTime ?? 0;

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Dynamic Wait Times</h1>
          <p className="page-header__sub">Computed live from real queue data — never hardcoded</p>
        </div>
        <div className={`live-pill ${connected ? 'is-live' : ''}`}>
          <span className="live-pill__dot" /> {connected ? 'Live' : 'Offline'}
        </div>
      </header>

      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Clock size={32} style={{ color: 'var(--color-primary)' }} />
        <div>
          <div style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>Average consultation</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 600 }}>{avg} minutes</div>
        </div>
      </div>

      <div className="card">
        <div className="card__title">Per-token estimates</div>
        {waiting.length === 0 ? (
          <div style={{ color: 'var(--color-muted)', padding: 20, textAlign: 'center' }}>No one waiting.</div>
        ) : waiting.map((t, i) => (
          <motion.div key={t._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}
            style={{ display: 'flex', justifyContent: 'space-between', padding: 14, borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, marginRight: 12 }}>#{t.tokenNumber}</span>
              <span>{t.patientName}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>~{t.estimatedWaitMinutes} min</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{t.peopleAhead} ahead</div>
            </div>
          </motion.div>
        ))}
      </div>
    </AppShell>
  );
}
