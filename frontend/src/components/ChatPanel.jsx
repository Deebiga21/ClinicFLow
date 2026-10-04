import { useState, useRef, useEffect } from 'react';
import { Send, Stethoscope, User as UserIcon, BrainCircuit, Activity } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';

export default function ChatPanel({ channelId, tokenNumber }) {
  const { user } = useAuth();
  
  // Backward compatibility: if tokenNumber is passed, use it as channelId
  const actualChannel = channelId || (tokenNumber ? `token_${tokenNumber}` : null);
  
  const { messages, send } = useChat(actualChannel);
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [actualChannel]);

  if (!actualChannel) {
    return <div style={{ color: 'var(--color-muted)', padding: 20, textAlign: 'center' }}>Select a chat to start communicating.</div>;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    send(trimmed);
    setText('');
    inputRef.current?.focus();
  }

  const isStaff = user?.role === 'staff' || user?.role === 'admin' || user?.role === 'nurse';
  
  // If we are talking to the bot, we provide operational suggestions
  const quickReplies = actualChannel === 'bot' ? [
    'Who is next?',
    'How many patients are waiting?',
    'What is the predicted waiting time for the next patient?',
    'Which medicines are approaching expiry?',
    'Which doctor currently has the highest workload?',
    "What is today's patient flow?"
  ] : (isStaff ? [
    'Please prepare the next patient.',
    'Queue is increasing.',
    'Doctor is available.',
    'Doctor is delayed.'
  ] : []);

  return (
    <div className="chat flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden" style={{ minHeight: '400px' }}>
      <div className="chat__list flex-1 overflow-y-auto p-4 space-y-4" ref={listRef}>
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center p-8">
            No messages yet. {actualChannel === 'bot' ? "Ask the AI Assistant a question!" : "Say hi!"}
          </div>
        ) : messages.map(m => {
          const sRole = m.sender_role || m.senderRole;
          const sText = m.message || m.text;
          const sTime = m.timestamp || m.createdAt;
          const sName = m.sender_id || m.senderName;
          
          const mine = sRole === user?.role;
          
          let Icon = UserIcon;
          if (sRole === 'bot') Icon = BrainCircuit;
          else if (sRole === 'admin') Icon = Activity;
          else if (sRole === 'staff' || sRole === 'nurse') Icon = Stethoscope;
          
          return (
            <div key={m.id || m._id || sTime} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 ${mine ? 'bg-indigo-600 text-white' : (sRole === 'bot' ? 'bg-indigo-50 border border-indigo-100 text-gray-800' : 'bg-gray-100 text-gray-800')}`}>
                <div className="flex items-start">
                  {!mine && <Icon size={16} className={`mr-2 mt-0.5 flex-shrink-0 ${sRole === 'bot' ? 'text-indigo-600' : 'text-gray-500'}`} />}
                  <div className="text-sm whitespace-pre-wrap">{sText}</div>
                </div>
                <div className={`text-xs mt-1 ${mine ? 'text-indigo-200' : 'text-gray-400'} ${mine ? 'text-right' : 'text-left'}`}>
                  {sName || sRole} • {sTime ? new Date(sTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {quickReplies.length > 0 && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto">
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              type="button"
              className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 whitespace-nowrap transition-colors"
              onClick={() => send(reply)}
            >
              {reply}
            </button>
          ))}
        </div>
      )}
      
      <form className="p-3 bg-white border-t border-gray-200 flex items-center gap-2" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg px-4 py-2 text-sm outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e);
          }}
          placeholder={actualChannel === 'bot' ? "Ask operational queries..." : "Type a message..."}
        />
        <button 
          type="submit" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={!text.trim()}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
