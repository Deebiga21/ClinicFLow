import { useEffect, useState, useCallback } from 'react';
import { getSocket } from './useQueueSocket';
import { useAuth } from '../context/AuthContext';
import { playChime, playCallAlert } from '../utils/sound';

let nextId = 1;

export function useNotifications() {
  const { token } = useAuth() || {};
  const [items, setItems] = useState([]);

  const push = useCallback((n) => {
    const id = nextId++;
    setItems(prev => [...prev, { id, ...n }]);
    setTimeout(() => setItems(prev => prev.filter(x => x.id !== id)), 4500);
  }, []);

  useEffect(() => {
    const socket = getSocket(token);
    const handler = (n) => {
      // "You are being called!" is the targeted alert sent only to the
      // specific patient's room — give it a distinct, louder sound so it
      // actually grabs attention if the tab isn't focused.
      if (n.title === 'You are being called!') playCallAlert();
      else playChime();
      push(n);
    };
    socket.on('notify', handler);
    return () => socket.off('notify', handler);
  }, [token, push]);

  const dismiss = (id) => setItems(prev => prev.filter(x => x.id !== id));
  return { items, push, dismiss };
}
