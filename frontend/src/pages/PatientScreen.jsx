import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import ChatPanel from '../components/ChatPanel';
import VoiceAssistant from '../components/VoiceAssistant';
import { API_BASE } from '../config';
import { Clock, Users, MessageSquare, ClipboardCheck, Megaphone, PartyPopper } from 'lucide-react';

export default function PatientScreen() {
  const { queueState, connected, loading } = useQueueSocket();
  const { user, token, linkToken } = useAuth();
  const [tokenInput, setTokenInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');

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
                {current.consultationReason && <span> ({current.consultationReason})</span>}
                {!isBeingSeen && myTokenNumber && <> · you're token #{myTokenNumber}</>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!myTokenNumber ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div className="card">
            <div className="card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Link Existing Token</span>
              {current && (
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  Now Serving: #{current.tokenNumber}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--color-ink-soft)', marginTop: 0, fontSize: 13 }}>
              Enter your token number and reason for consultation.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); if (tokenInput) linkToken(Number(tokenInput), reasonInput); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
              <input className="input" type="number" placeholder={`Token # (e.g. ${(current?.tokenNumber || queueState?.lastIssuedToken || 0) + 1})`}
                value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} required />
              <input className="input" placeholder="Reason for Visit / Symptoms (e.g. Fever, Cough, BP check)"
                value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} />
              <button className="btn btn--primary" style={{ padding: '10px' }}>Link & Join Queue</button>
            </form>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 14 }}>
              * Tokens are automatically assigned after currently serving Token #{current?.tokenNumber || queueState?.lastIssuedToken || 0}.
            </div>

            {/* Clickable tokens currently waiting in queue */}
            {(queueState?.waitingQueue || []).length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Active Tokens in Queue (Click to Link)
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(queueState?.waitingQueue || []).slice(0, 8).map(t => (
                    <button
                      key={t._id}
                      type="button"
                      className="btn btn--ghost"
                      style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600 }}
                      onClick={() => linkToken(t.tokenNumber, reasonInput)}
                    >
                      #{t.tokenNumber} ({t.patientName})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--color-primary-soft)', border: '1px solid var(--color-primary)' }}>
            <div className="card__title" style={{ color: 'var(--color-primary)' }}>🎫 Need a New Token?</div>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>
              Get a new digital queue token instantly.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="input" placeholder="Consultation Reason (e.g. Fever, Routine checkup)"
                value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} />
              <button
                className="btn btn--primary"
                style={{ width: '100%', padding: '12px 16px', fontSize: 15 }}
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/queue/add`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({
                        patientName: user?.displayName || user?.username || 'Patient',
                        consultationReason: reasonInput || 'General Consultation'
                      })
                    });
                    const data = await res.json();
                    if (res.ok && data.token) {
                      await linkToken(data.token.tokenNumber, reasonInput);
                    } else {
                      alert(data.error || 'Failed to issue token');
                    }
                  } catch (err) {
                    alert(err.message);
                  }
                }}
              >
                Issue New Token & Join Queue
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: isBeingSeen ? 'var(--color-primary)' : undefined,
                color: isBeingSeen ? 'white' : undefined }}>
              <div style={{ fontSize: 11, opacity: .85, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Your token</div>
              <AnimatePresence mode="wait">
                <motion.div key={myTokenNumber} initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ fontSize: 60, fontWeight: 700, lineHeight: 1, margin: '4px 0' }}>
                  #{myTokenNumber}
                </motion.div>
              </AnimatePresence>
              <div style={{ fontSize: 14, opacity: .9, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                {isBeingSeen ? "It's your turn!" : 'Linked to you'}
                {myEntry?.priorityLevel && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    background: isBeingSeen ? 'rgba(255,255,255,0.25)' : (myEntry.priorityLevel === 'HIGH' ? '#ef4444' : (myEntry.priorityLevel === 'MEDIUM' ? '#f59e0b' : '#10b981')),
                    color: '#fff'
                  }}>
                    {myEntry.priorityLevel === 'LOW' ? 'ROUTINE' : `${myEntry.priorityLevel} PRIORITY`}
                  </span>
                )}
              </div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Now serving</div>
              <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--color-accent)', margin: '4px 0' }}>
                {current ? `#${current.tokenNumber}` : '—'}
              </div>
              <div style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>{current?.patientName || 'Idle'}</div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} />
              <div style={{ fontSize: 36, fontWeight: 700, margin: '6px 0 2px', color: 'var(--color-ink)' }}>
                {isBeingSeen ? 0 : (myEntry ? myEntry.peopleAhead : '—')}
              </div>
              <div style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>
                {isBeingSeen ? 'You are inside!' : 'People ahead of you'}
              </div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}>
              <Clock size={18} style={{ color: 'var(--color-accent)' }} />
              <div style={{ fontSize: 36, fontWeight: 700, margin: '6px 0 2px', color: 'var(--color-ink)' }}>
                {isBeingSeen ? '0m' : (myEntry ? `~${myEntry.estimatedWaitMinutes}m` : '—')}
              </div>
              <div style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>Estimated wait</div>
            </motion.div>
          </div>

          {/* Queue Step Pipeline Visual */}
          {myEntry && !isBeingSeen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card"
              style={{
                marginBottom: 20,
                padding: '20px',
                borderRadius: 12
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 12 }}>
                Queue Progress Status
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, textAlign: 'center', position: 'relative' }}>
                {[
                  { step: '1', title: 'Token Linked', active: true, desc: `Token #${myTokenNumber}` },
                  { step: '2', title: 'Triage Status', active: true, desc: `${myEntry.priorityLevel || 'Routine'} Priority` },
                  { step: '3', title: 'Queue Line', active: true, desc: `${myEntry.peopleAhead} ahead` },
                  { step: '4', title: 'Consultation', active: false, desc: 'Next in line' }
                ].map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: s.active ? 'var(--color-primary)' : 'var(--color-surface-2)',
                      color: s.active ? '#fff' : 'var(--color-muted)',
                      display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13,
                      border: s.active ? 'none' : '1px solid var(--color-border)'
                    }}>
                      {s.step}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-ink)' }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-ink-soft)' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

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
      {/* Voice Assistant Floating Widget */}
      {!myTokenNumber && (
        <VoiceAssistant 
          onLinkToken={linkToken} 
          suggestedToken={(current?.tokenNumber || queueState?.lastIssuedToken || 0) + 1} 
        />
      )}
    </AppShell>
  );
}
