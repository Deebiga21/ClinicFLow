import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import ChatPanel from '../components/ChatPanel';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Clock } from 'lucide-react';

export default function StaffChat() {
  const { queueState } = useQueueSocket();
  const { user } = useAuth();
  const [active, setActive] = useState(null);

  const tokens = [
    ...(queueState?.currentToken ? [{ ...queueState.currentToken, isCurrent: true }] : []),
    ...(queueState?.waitingQueue || [])
  ];

  // Keep `active` valid: pick the first token if none chosen yet, or if the
  // previously-active token has left the live list (e.g. checked out).
  useEffect(() => {
    if (tokens.length === 0) { setActive(null); return; }
    const stillExists = tokens.some(t => t.tokenNumber === active);
    if (!stillExists) setActive(tokens[0].tokenNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueState]);

  const isStaff = user?.role === 'staff';
  const fixedTokenForPatient = user?.linkedTokenNumber;
  const activeToken = tokens.find(t => t.tokenNumber === active);

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">{isStaff ? 'Patient Chat' : 'Chat with Staff'}</h1>
          <p className="page-header__sub">{isStaff ? 'Pick a token to message that patient.' : 'Talk directly to the front desk.'}</p>
        </div>
      </header>

      {isStaff ? (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', padding: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Active tokens ({tokens.length})
            </div>
            {tokens.length === 0 ? (
              <div style={{ padding: 12, color: 'var(--color-muted)' }}>No tokens yet — add a patient from Front Desk.</div>
            ) : tokens.map(t => (
              <button key={t._id} onClick={() => setActive(t.tokenNumber)}
                className="sidebar__item chat-thread-btn" style={{ width: '100%', textAlign: 'left', border: 'none',
                  background: active === t.tokenNumber ? 'var(--color-primary-soft)' : 'transparent' }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600 }}>#{t.tokenNumber}</span>
                <span style={{ flex: 1 }}>{t.patientName}</span>
                {t.isCurrent && <span className="badge badge--live">in room</span>}
              </button>
            ))}
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            {activeToken && (
              <div className="chat-thread-header">
                <MessageSquare size={16} />
                <span>Token #{activeToken.tokenNumber} — {activeToken.patientName}</span>
                {!activeToken.isCurrent && (
                  <span className="chat-thread-header__wait">
                    <Clock size={12} /> ~{activeToken.estimatedWaitMinutes ?? 0}m wait
                  </span>
                )}
              </div>
            )}
            <ChatPanel tokenNumber={active} />
          </div>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 700 }}>
          {fixedTokenForPatient
            ? <ChatPanel tokenNumber={fixedTokenForPatient} />
            : <div style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 30 }}>Link your token from the Waiting Room to start chatting.</div>}
        </div>
      )}
    </AppShell>
  );
}
