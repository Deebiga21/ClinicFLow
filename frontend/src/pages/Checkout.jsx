import { useState } from 'react';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import { ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Checkout() {
  const { user, token, linkToken } = useAuth();
  const [done, setDone] = useState(false);

  async function checkout() {
    if (!user?.linkedTokenNumber) return;
    await fetch(`${API_BASE}/queue/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tokenNumber: user.linkedTokenNumber })
    });
    setDone(true);
    setTimeout(() => linkToken(null), 1500);
  }

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Instant Check-Out</h1>
          <p className="page-header__sub">Close your visit in one tap</p>
        </div>
      </header>
      <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: 40 }}>
        {done ? (
          <motion.div initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <CheckCircle2 size={64} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ marginTop: 16, fontWeight: 700, fontSize: 22 }}>You're all set!</h2>
            <p style={{ color: 'var(--color-ink-soft)' }}>Visit closed. Take care!</p>
          </motion.div>
        ) : user?.linkedTokenNumber ? (
          <>
            <ClipboardCheck size={56} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ marginTop: 12, fontWeight: 700, fontSize: 24 }}>Token #{user.linkedTokenNumber}</h2>
            <p style={{ color: 'var(--color-ink-soft)' }}>Confirm you've completed your consultation.</p>
            <button className="btn btn--primary" style={{ width: '100%', padding: 12 }} onClick={checkout}>
              Confirm check-out
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--color-muted)' }}>Link a token from the Waiting Room first.</p>
        )}
      </div>
    </AppShell>
  );
}
