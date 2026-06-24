import { useState, useRef, useEffect, useCallback } from 'react';
import AppShell from '../components/AppShell';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Send, Sparkles, Bot, Wifi, WifiOff, Trash2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MODEL = 'claude-sonnet-4-6';
let nextId = 1;

const QUICK = {
  patient: ['How long is my wait?', "What's my token?", 'Who is being called now?', 'How do I check out?', 'How do I link my token?'],
  staff:   ['How do I add a patient?', 'How do I call next?', "What's the average wait time?", 'How do I skip a patient?', 'How do I reset the queue?'],
};

function buildSystem(ctx) {
  return `You are the ClinicFlow AI Assistant — smart, helpful, concise. You're embedded inside a live clinic queue management system.

Live clinic context right now:
- User role: ${ctx.role}
- User name: ${ctx.name}
- Currently serving: ${ctx.current ? `Token #${ctx.current.tokenNumber} — ${ctx.current.patientName}` : 'Nobody'}
- Total waiting: ${ctx.waiting ?? 0}
- Average consult time: ${ctx.avg ?? 10} min
${ctx.myToken ? `- This patient's token: #${ctx.myToken}` : ''}
${ctx.myEntry ? `- Their wait: ~${ctx.myEntry.estimatedWaitMinutes} min, ${ctx.myEntry.peopleAhead} people ahead` : ''}
${ctx.isCalled ? '⚠️ This patient is currently being called right now!' : ''}

Answer questions about:
- Queue status, wait times, token numbers
- How to use ClinicFlow features (for patients: link token, checkout, chat; for staff: add patient, call next, skip, reset, settings)
- General clinic guidance

Rules:
- Be concise: 1-3 sentences unless more detail is needed
- If asked about something outside clinic context, still help but note it's outside your main scope
- Friendly, professional tone
- Never make up clinical/medical advice`;
}

function MsgBubble({ msg }) {
  const [copied, setCopied] = useState(false);
  const isBot = msg.from === 'bot';

  function copy() {
    navigator.clipboard.writeText(msg.text);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`bot-msg ${isBot ? 'bot-msg--bot' : 'bot-msg--user'}`}
      style={{ alignItems: 'flex-start' }}>
      {isBot && <div className="bot-msg__avatar"><Bot size={14} /></div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '80%' }}>
        <div className="bot-msg__bubble" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.text}</div>
        {isBot && (
          <button onClick={copy} style={{ background: 'none', border: 'none', padding: '2px 4px', alignSelf: 'flex-start',
            color: 'var(--color-muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Assistant() {
  const { user, token } = useAuth();
  const { queueState } = useQueueSocket();
  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  const greeting = `Hi${user?.displayName ? ' ' + user.displayName : ''}! I'm the ClinicFlow AI Assistant — ask me anything about the queue, your token, or how to use ClinicFlow.`;

  const [messages, setMessages] = useState([{ id: nextId++, from: 'bot', text: greeting }]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(true);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typing]);

  function ctx() {
    const current = queueState?.currentToken;
    const myToken = user?.linkedTokenNumber;
    const myEntry = (queueState?.waitingQueue || []).find(t => t.tokenNumber === myToken);
    return {
      role: user?.role, name: user?.displayName || user?.username,
      current, myToken, myEntry,
      isCalled: current?.tokenNumber === myToken,
      avg: queueState?.avgConsultationTime,
      waiting: queueState?.totalWaiting
    };
  }

  const send = useCallback(async (rawText) => {
    const msg = (rawText ?? text).trim();
    if (!msg || typing) return;
    setText('');
    inputRef.current?.focus();

    const userMsg = { id: nextId++, from: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    historyRef.current = [...historyRef.current, { role: 'user', content: msg }];
    setTyping(true);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL, max_tokens: 1000,
          system: buildSystem(ctx()),
          messages: historyRef.current
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'API error');

      const reply = data.content?.find(b => b.type === 'text')?.text || 'Sorry, I had trouble responding.';
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
      setMessages(prev => [...prev, { id: nextId++, from: 'bot', text: reply }]);
      setOnline(true);
    } catch {
      // Offline fallback
      const fallback = offlineFallback(msg, ctx());
      historyRef.current = [...historyRef.current, { role: 'assistant', content: fallback }];
      setMessages(prev => [...prev, { id: nextId++, from: 'bot', text: fallback }]);
      setOnline(false);
    } finally {
      setTyping(false);
    }
  }, [text, typing, user, queueState]);

  function clearChat() {
    historyRef.current = [];
    setMessages([{ id: nextId++, from: 'bot', text: greeting }]);
  }

  const quick = QUICK[isStaff ? 'staff' : 'patient'];

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <h1 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={26} style={{ color: 'var(--color-accent)' }} /> AI Assistant
          </h1>
          <p className="page-header__sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {online
              ? <><Wifi size={13} style={{ color: '#2ecc71' }} /> Claude AI — live clinic context</>
              : <><WifiOff size={13} style={{ color: 'var(--color-muted)' }} /> Offline FAQ mode</>}
          </p>
        </div>
        <button className="btn btn--ghost" onClick={clearChat} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Trash2 size={14} /> Clear chat
        </button>
      </header>

      <div className="card" style={{ maxWidth: 780, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '70vh' }}>
        {/* Message list */}
        <div ref={listRef} className="bot-chat__list" style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map(m => <MsgBubble key={m.id} msg={m} />)}
          <AnimatePresence>
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bot-msg bot-msg--bot">
                <div className="bot-msg__avatar"><Bot size={14} /></div>
                <div className="bot-msg__bubble bot-msg__typing"><span /><span /><span /></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick prompts */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {quick.map(s => (
            <button key={s} className="bot-chip" onClick={() => send(s)} disabled={typing}
              style={{ fontSize: 12, padding: '5px 12px' }}>{s}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10 }}>
          <input ref={inputRef} className="input" value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask me anything about ClinicFlow…"
            style={{ flex: 1 }} />
          <button className="btn btn--primary" onClick={() => send()} disabled={!text.trim() || typing}
            style={{ padding: '10px 16px' }}>
            <Send size={16} />
          </button>
        </div>
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Logo size={14} /> Powered by Claude AI · Falls back to FAQ mode if offline
      </p>
    </AppShell>
  );
}

// Simple offline fallback
function offlineFallback(msg, ctx) {
  const m = msg.toLowerCase();
  if (m.includes('wait') || m.includes('how long') || m.includes('minutes')) {
    if (ctx.myEntry) return `You have ~${ctx.myEntry.estimatedWaitMinutes} minute(s) left with ${ctx.myEntry.peopleAhead} people ahead.`;
    if (ctx.isCalled) return "You're being called right now — please head to the consultation room!";
    return `Average consult time is ${ctx.avg ?? 10} min. Link your token to see your personal wait.`;
  }
  if (m.includes('token') || m.includes('number')) return ctx.myToken ? `Your token is #${ctx.myToken}.` : "You haven't linked a token yet. Go to the Waiting Room and enter your token number.";
  if (m.includes('now serving') || m.includes('calling') || m.includes('current')) return ctx.current ? `Currently serving Token #${ctx.current.tokenNumber} — ${ctx.current.patientName}.` : 'No one is currently being served.';
  if (m.includes('checkout') || m.includes('done') || m.includes('finish')) return 'Go to Check Out in the sidebar and tap "Check out now" to complete your visit.';
  if (m.includes('chat') || m.includes('staff') || m.includes('nurse')) return 'Use "Chat with Staff" in the sidebar to message reception directly.';
  if (m.includes('add patient') || m.includes('new patient')) return 'Go to Front Desk and use the "Add patient" form to issue a new token.';
  if (m.includes('call next') || m.includes('next patient')) return 'On the Front Desk page, press "Call next" to advance the queue.';
  if (m.includes('hi') || m.includes('hello') || m.includes('hey')) return `Hi${ctx.name ? ' ' + ctx.name : ''}! I'm in offline mode right now. I can still answer basic queue questions.`;
  return "I'm in offline mode. Ask me about wait times, your token, calling next patient, or how to use ClinicFlow features.";
}