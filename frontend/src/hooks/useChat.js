import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../config';
import { getSocket } from './useQueueSocket';
import { useAuth } from '../context/AuthContext';
import { playMessageBlip } from '../utils/sound';

export function useChat(tokenNumber) {
  const { token, user } = useAuth() || {};
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!tokenNumber) {
      setMessages([]);
      return;
    }

    let alive = true;
    fetch(`${API_BASE}/chat/${tokenNumber}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (alive) setMessages(d.messages || []); })
      .catch(() => {});

    const socket = getSocket(token);
    socket.emit('chat:join', { tokenNumber: Number(tokenNumber) });

    const onMsg = (m) => {
      if (Number(m.tokenNumber) === Number(tokenNumber)) {
        if (m.senderRole !== user?.role) playMessageBlip();
        setMessages(prev => {
          if (prev.some(existing => existing._id === m._id && m._id)) return prev;
          return [...prev, m];
        });
      }
    };

    socket.on('chat:message', onMsg);
    socket.on('chat:new_message', onMsg);

    return () => {
      alive = false;
      socket.emit('chat:leave', { tokenNumber: Number(tokenNumber) });
      socket.off('chat:message', onMsg);
      socket.off('chat:new_message', onMsg);
    };
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
