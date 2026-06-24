import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../config';
import { getSocket } from './useQueueSocket';
import { useAuth } from '../context/AuthContext';
import { playMessageBlip } from '../utils/sound';

export function useChat(tokenNumber) {
  const { token, user } = useAuth() || {};
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!tokenNumber) return;
    let alive = true;
    fetch(`${API_BASE}/chat/${tokenNumber}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (alive) setMessages(d.messages || []); })
      .catch(() => {});

    const socket = getSocket(token);
    socket.emit('chat:join', { tokenNumber });
    const onMsg = (m) => {
      if (Number(m.tokenNumber) !== Number(tokenNumber)) return;
      if (m.senderRole !== user?.role) playMessageBlip();
      setMessages(prev => [...prev, m]);
    };
    socket.on('chat:message', onMsg);

    return () => { alive = false; socket.emit('chat:leave', { tokenNumber }); socket.off('chat:message', onMsg); };
  }, [tokenNumber, token, user?.role]);

  const send = useCallback((text) => {
    if (!text || !text.trim() || !tokenNumber || !user) return;
    const socket = getSocket(token);
    socket.emit('chat:send', {
      tokenNumber, text, senderRole: user.role, senderName: user.displayName || user.username
    });
  }, [tokenNumber, user, token]);

  return { messages, send };
}
