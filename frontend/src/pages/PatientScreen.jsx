import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import ChatPanel from '../components/ChatPanel';
import { API_BASE } from '../config';
import { Clock, Users, MessageSquare, ClipboardCheck, Megaphone, PartyPopper } from 'lucide-react';

export default function PatientScreen() {
  const { queueState, connected, loading } = useQueueSocket();
  const { user, token, linkToken } = useAuth();
  const [tokenInput, setTokenInput] = useState('');

  if (loading) return <AppShell><div style={{ padding: 40 }}>Loading…</div></AppShell>;

  const current = queueState?.currentToken;
  const myTokenNumber = user?.linkedTokenNumber;
  const myEntry = (queueState?.waitingQueue || []).find(t => t.tokenNumber === myTokenNumber);
  const isBeingSeen = current?.tokenNumber === myTokenNumber;

  async function handleCheckout() {
    if (!myTokenNumber) return;
    if (!confirm('Confirm digital check-out?')) return;
    await fetch(`${API_BASE}/queue/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tokenNumber: myTokenNumber })
    });
  }

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Waiting Room</h1>
          <p className="page-header__sub">Hi {user?.displayName || user?.username} — your live status</p>
        </div>
        <div className={`live-pill ${connected ? 'is-live' : ''}`}>
          <span className="live-pill__dot" /> {connected ? 'Live' : 'Reconnecting…'}
        </div>
      </header>

      {/* Always-visible "who's being called right now" banner */}
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={isBeingSeen ? `mine-${current.tokenNumber}` : `other-${current.tokenNumber}`}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`call-banner ${isBeingSeen ? 'call-banner--mine' : ''}`}>
            {isBeingSeen ? <PartyPopper size={22} /> : <Megaphone size={20} />}
            <div>
              <div className="call-banner__title">
                {isBeingSeen ? "It's your turn — please head to the consultation room!" : 'Now calling'}
              </div>
              <div className="call-banner__sub">
                Token <strong>#{current.tokenNumber}</strong> — {current.patientName}
                {!isBeingSeen && myTokenNumber && <> · you're token #{myTokenNumber}</>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!myTokenNumber ? (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="card__title">Link your token</div>
          <p style={{ color: 'var(--color-ink-soft)', marginTop: 0 }}>
            Enter the token number reception gave you to start tracking your wait time.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); if (tokenInput) linkToken(Number(tokenInput)); }}
            style={{ display: 'flex', gap: 10 }}>
            <input className="input" type="number" placeholder="e.g. 12"
              value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} required />
            <button className="btn btn--primary">Link token</button>
          </form>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: isBeingSeen ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' : undefined,
                color: isBeingSeen ? 'white' : undefined }}>
              <div style={{ fontSize: 12, opacity: .8, textTransform: 'uppercase', letterSpacing: '.08em' }}>Your token</div>
              <AnimatePresence mode="wait">
                <motion.div key={myTokenNumber} initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ fontFamily: 'Fraunces, serif', fontSize: 72, fontWeight: 600, lineHeight: 1 }}>
                  #{myTokenNumber}
                </motion.div>
              </AnimatePresence>
              <div style={{ fontSize: 14, opacity: .9 }}>{isBeingSeen ? "It's your turn!" : 'Linked to you'}</div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Now serving</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 56, fontWeight: 600, color: 'var(--color-accent)' }}>
                {current ? `#${current.tokenNumber}` : '—'}
              </div>
              <div style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>{current?.patientName || 'Idle'}</div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} />
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 40, fontWeight: 600, margin: '8px 0 4px' }}>
                {myEntry?.peopleAhead ?? (isBeingSeen ? 0 : '—')}
              </div>
              <div style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>people ahead of you</div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}>
              <Clock size={18} style={{ color: 'var(--color-primary)' }} />
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 40, fontWeight: 600, margin: '8px 0 4px' }}>
                {myEntry ? `~${myEntry.estimatedWaitMinutes}m` : (isBeingSeen ? '0m' : '—')}
              </div>
              <div style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>estimated wait</div>
            </motion.div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
            <div className="card">
              <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={18} /> Chat with staff
              </div>
              <ChatPanel tokenNumber={myTokenNumber} />
            </div>

            <div className="card" style={{ alignSelf: 'start' }}>
              <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardCheck size={18} /> Instant Check-Out
              </div>
              <p style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>
                Visit done? Mark yourself complete in one tap — no paper, no waiting at reception.
              </p>
              <button className="btn btn--accent" style={{ width: '100%' }} onClick={handleCheckout}>
                Check out now
              </button>
              <button className="btn btn--ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => linkToken(null)}>
                Unlink token
              </button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
