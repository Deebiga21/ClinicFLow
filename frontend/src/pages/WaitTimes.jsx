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
          <p className="page-header__sub">Computed live from active clinic queue data</p>
        </div>
        <div className={`live-pill ${connected ? 'is-live' : ''}`}>
          <span className="live-pill__dot" /> {connected ? 'Live' : 'Offline'}
        </div>
      </header>

      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--color-primary-soft)', display: 'grid', placeItems: 'center' }}>
          <Clock size={24} style={{ color: 'var(--color-primary-dark)' }} />
        </div>
        <div>
          <div style={{ color: 'var(--color-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Average consultation time</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-ink)' }}>{avg} minutes</div>
        </div>
      </div>

      <div className="card">
        <div className="card__title">Per-token wait estimates</div>
        {waiting.length === 0 ? (
          <div style={{ color: 'var(--color-muted)', padding: 20, textAlign: 'center' }}>No active patients waiting.</div>
        ) : waiting.map((t, i) => (
          <motion.div key={t._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i === waiting.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 700, marginRight: 12, color: 'var(--color-primary-dark)' }}>#{t.tokenNumber}</span>
              <span style={{ fontWeight: 500, color: 'var(--color-ink)' }}>{t.patientName}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>~{t.estimatedWaitMinutes} min</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{t.peopleAhead} ahead</div>
            </div>
          </motion.div>
        ))}
      </div>
    </AppShell>
  );
}
