import { useState, useRef, useEffect } from 'react';
import { Send, Stethoscope, User as UserIcon } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';

export default function ChatPanel({ tokenNumber }) {
  const { user } = useAuth();
  const { messages, send } = useChat(tokenNumber);
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // Re-focus the input whenever we switch to a new token thread
  useEffect(() => {
    inputRef.current?.focus();
  }, [tokenNumber]);

  if (!tokenNumber) {
    return <div style={{ color: 'var(--color-muted)', padding: 20, textAlign: 'center' }}>Select a token to start chatting.</div>;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    send(trimmed);
    setText('');
    inputRef.current?.focus();
  }

  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const quickReplies = isStaff ? [
    'Please wait 5–10 minutes.',
    'Please proceed to Room 101.',
    'The doctor is ready for you now.',
    'Please check in with the nurse.'
  ] : [
    'How long is my wait time?',
    'I have arrived at reception.',
    'Can I step out for 5 minutes?',
    'Is the doctor available?'
  ];

  return (
    <div className="chat">
      <div className="chat__list" ref={listRef}>
        {messages.length === 0 ? (
          <div style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 30 }}>
            No messages yet. Say hi 👋
          </div>
        ) : messages.map(m => {
          const mine = m.senderRole === user?.role;
          const Icon = m.senderRole === 'staff' ? Stethoscope : UserIcon;
          return (
            <div key={m._id || m.createdAt} className={`chat__msg ${mine ? 'chat__msg--me' : 'chat__msg--them'}`}>
              <div className="chat__msg-row">
                {!mine && <Icon size={13} className="chat__msg-icon" />}
                <div>{m.text}</div>
              </div>
              <div className="chat__meta">{m.senderName || m.senderRole} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Suggestion Chips */}
      <div style={{ padding: '4px 10px', display: 'flex', gap: 6, overflowX: 'auto', background: 'var(--color-surface-2)', borderTop: '1px solid var(--color-border)' }}>
        {quickReplies.map((reply, i) => (
          <button
            key={i}
            type="button"
            className="btn btn--ghost"
            style={{ padding: '3px 8px', fontSize: 11, whiteSpace: 'nowrap', borderRadius: 999 }}
            onClick={() => send(reply)}
          >
            {reply}
          </button>
        ))}
      </div>
      <form className="chat__input" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e);
          }}
          placeholder="Type a message…"
        />
        <button type="submit" className="btn btn--primary" disabled={!text.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
