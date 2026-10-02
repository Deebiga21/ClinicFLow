import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { playChime, playCallAlert } from '../utils/sound';

let nextId = 1;

export function useNotifications() {
  const { token } = useAuth() || {};
  const { socket } = useWebSocket();
  const [items, setItems] = useState([]);

  const push = useCallback((n) => {
    const id = nextId++;
    setItems(prev => [...prev, { id, ...n }]);
    setTimeout(() => setItems(prev => prev.filter(x => x.id !== id)), 4500);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (n) => {
      if (n.title === 'You are being called!') playCallAlert();
      else playChime();
      push(n);
    };
    socket.on('notify', handler);
    return () => socket.off('notify', handler);
  }, [socket, push]);

  const dismiss = (id) => setItems(prev => prev.filter(x => x.id !== id));
  return { items, push, dismiss };
}
