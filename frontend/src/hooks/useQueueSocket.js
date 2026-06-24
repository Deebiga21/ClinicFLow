import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, SOCKET_URL } from '../config';
import { useAuth } from '../context/AuthContext';

// We keep a single live socket, but it must be recreated whenever the auth
// token changes (e.g. after login/logout) — otherwise the server never
// learns who's connected, and rooms/permissions can silently go stale.
let _socket = null;
let _socketToken = undefined;

export function getSocket(token) {
  if (_socket && _socketToken === token) return _socket;

  // token changed (login/logout) — tear down the old connection first
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }

  _socketToken = token;
  _socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], auth: { token } });
  return _socket;
}

export function useQueueSocket() {
  const { token } = useAuth() || {};
  const [queueState, setQueueState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/queue`).then(r => r.json()).then(d => {
      if (mounted) { setQueueState(d); setLoading(false); }
    }).catch(() => mounted && setLoading(false));

    const socket = getSocket(token);
    socketRef.current = socket;
    const onConn = () => setConnected(true);
    const onDis  = () => setConnected(false);
    const onUpd  = (d) => setQueueState(d);
    socket.on('connect', onConn);
    socket.on('disconnect', onDis);
    socket.on('queueUpdated', onUpd);
    if (socket.connected) setConnected(true);

    return () => {
      mounted = false;
      socket.off('connect', onConn);
      socket.off('disconnect', onDis);
      socket.off('queueUpdated', onUpd);
    };
  }, [token]);

  return { queueState, connected, loading, socket: socketRef.current };
}
