import { useState, useRef, useEffect, useCallback } from 'react';
import AppShell from '../components/AppShell';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { getBotReply, SUGGESTED_PROMPTS } from '../utils/faqBot';
import { Send, HelpCircle, Wifi, WifiOff, Trash2, Copy, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config';

let _id = 1;

function buildSystem(ctx) {
  return `Live Clinic Context:
- Role: ${ctx.role}
- Current token serving: ${ctx.current ? `#${ctx.current.tokenNumber}` : 'None'}
- Waiting: ${ctx.waiting ?? 0}
- Avg wait: ${ctx.avg ?? 10} min`;
}

function Bubble({ msg }) {
  const [copied, setCopied] = useState(false);
  const isBot = msg.from === 'bot';
  function copy() { navigator.clipboard.writeText(msg.text); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`bot-msg ${isBot ? 'bot-msg--bot' : 'bot-msg--user'}`}
      style={{ alignItems: 'flex-start' }}>
      {isBot && <div className="bot-msg__avatar"><HelpCircle size={14} /></div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: '82%' }}>
        <div className="bot-msg__bubble" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{msg.text}</div>
        {isBot && (
          <button onClick={copy} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer',
            color: 'var(--color-muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}>
            {copied ? <><Check size={10} />Copied</> : <><Copy size={10} />Copy</>}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Assistant() {
  const { user } = useAuth();
  const { queueState } = useQueueSocket();
  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  const greeting = `Hi${user?.displayName ? ' ' + user.displayName : ''}! 👋 I'm your Clinic Assistant. I have live access to the queue — ask me anything about wait times, tokens, or clinic operations.`;

  const [msgs, setMsgs] = useState([{ id: _id++, from: 'bot', text: greeting }]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(null); // null = not tried yet
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const histRef = useRef([]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs, typing]);

  function liveCtx() {
    const current = queueState?.currentToken;
    const myToken = user?.linkedTokenNumber;
    const myEntry = (queueState?.waitingQueue || []).find(t => t.tokenNumber === myToken);
    return {
      role: user?.role, name: user?.displayName || user?.username,
      current, myToken, myEntry, isCalled: current?.tokenNumber === myToken,
      avg: queueState?.avgConsultationTime, waiting: queueState?.totalWaiting
    };
  }

  const send = useCallback(async (raw) => {
    const msg = (raw ?? text).trim();
    if (!msg || typing) return;
    setText('');
    inputRef.current?.focus();

    const userMsg = { id: _id++, from: 'user', text: msg };
    setMsgs(prev => [...prev, userMsg]);
    histRef.current = [...histRef.current, { role: 'user', content: msg }];
    setTyping(true);

    const ctx = liveCtx();

    try {
      const res = await fetch(`${API_BASE_URL}/api/clinical-ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: msg, context: ctx })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'API error');
      
      const reply = data.answer || 'Sorry, I had trouble responding.';
      histRef.current = [...histRef.current, { role: 'assistant', content: reply }];
      setMsgs(prev => [...prev, { id: _id++, from: 'bot', text: reply }]);
      setOnline(true);
    } catch {
      const ctx2 = liveCtx();
      const fallback = getBotReply(msg, {
        role: ctx2.role, displayName: ctx2.name,
        myTokenNumber: ctx2.myToken, myEntry: ctx2.myEntry,
        isBeingSeen: ctx2.isCalled, avgConsultationTime: ctx2.avg,
        current: ctx2.current
      });
      histRef.current = [...histRef.current, { role: 'assistant', content: fallback }];
      setMsgs(prev => [...prev, { id: _id++, from: 'bot', text: fallback }]);
      setOnline(false);
    } finally {
      setTyping(false);
    }
  }, [text, typing, user, queueState]);

  function clearChat() {
    histRef.current = [];
    setMsgs([{ id: _id++, from: 'bot', text: greeting }]);
    setText(''); setOnline(null);
  }

  const quick = SUGGESTED_PROMPTS[isStaff ? 'staff' : 'patient'];
  const isCalled = queueState?.currentToken?.tokenNumber === user?.linkedTokenNumber;

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <h1 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HelpCircle size={26} style={{ color: 'var(--color-primary)' }} />Clinic Assistant
          </h1>
          <p className="page-header__sub" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            {online === null
              ? 'Ask a question to get started'
              : online
              ? <><Wifi size={13} style={{ color: 'var(--color-primary)' }} />Virtual Assistant · live queue context</>
              : <><WifiOff size={13} style={{ color: 'var(--color-muted)' }} />Knowledge Base FAQ mode</>}
          </p>
        </div>
        <button className="btn btn--ghost" onClick={clearChat}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Trash2 size={14} />Clear
        </button>
      </header>

      <AnimatePresence>
        {isCalled && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ padding: '14px 20px', borderRadius: 10, marginBottom: 16,
              background: 'var(--color-primary)',
              color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            You're being called — please proceed to the consultation room now!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card" style={{ maxWidth: 780, padding: 0, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', height: '68vh', minHeight: 400 }}>
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 20,
          display: 'flex', flexDirection: 'column', gap: 12 }}>
          {msgs.map(m => <Bubble key={m.id} msg={m} />)}
          <AnimatePresence>
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bot-msg bot-msg--bot" style={{ alignItems: 'flex-start' }}>
                <div className="bot-msg__avatar"><HelpCircle size={14} /></div>
                <div className="bot-msg__bubble bot-msg__typing"><span /><span /><span /></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--color-border)',
          display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {quick.map(s => (
            <button key={s} className="bot-chip" onClick={() => send(s)} disabled={typing}
              style={{ fontSize: 12, padding: '5px 12px' }}>{s}</button>
          ))}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)',
          display: 'flex', gap: 10, alignItems: 'center' }}>
          <input ref={inputRef} className="input" value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about ClinicFlow…"
            style={{ flex: 1 }} disabled={typing} />
          <button className="btn btn--primary" onClick={() => send()}
            disabled={!text.trim() || typing} style={{ padding: '9px 16px', flexShrink: 0 }}>
            {typing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          </button>
        </div>
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Logo size={14} />ClinicFlow Virtual Helper · Live queue integration
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
