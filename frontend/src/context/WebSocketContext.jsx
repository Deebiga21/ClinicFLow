import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, SOCKET_URL } from '../config';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

let _socket = null;
let _socketToken = undefined;

function getSocket(token) {
  if (_socket && _socketToken === token) return _socket;

  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }

  _socketToken = token;
  // If no token is provided, socket will still connect but as an anonymous user
  _socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], auth: { token } });
  return _socket;
}

export function WebSocketProvider({ children }) {
  const { token } = useAuth() || {};
  const [queueState, setQueueState] = useState(null);
  const [systemEvents, setSystemEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    
    // Initial fetch of queue state
    fetch(`${API_BASE}/queue`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
      .then(r => r.json())
      .then(d => {
        if (mounted) { setQueueState(d); setLoading(false); }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const socket = getSocket(token);
    socketRef.current = socket;
    
    const onConn = () => setConnected(true);
    const onDis  = () => setConnected(false);
    const onUpd  = (d) => {
      if (mounted) setQueueState(d);
    };
    const onNotify = () => {
      // Re-fetch queue on general notify
      fetch(`${API_BASE}/queue`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
        .then(r => r.json())
        .then(d => {
          if (mounted) setQueueState(d);
        }).catch(() => {});
    };
    
    // System-wide events handler
    const onSystemBroadcast = (event) => {
      if (mounted) {
        setSystemEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
        // Broadcasts might also trigger specific state updates in the future
      }
    };

    socket.on('connect', onConn);
    socket.on('disconnect', onDis);
    socket.on('queueUpdated', onUpd);
    socket.on('tokenLinked', onUpd);
    socket.on('tokenCreated', onUpd);
    socket.on('notify', onNotify);
    socket.on('systemBroadcast', onSystemBroadcast);
    
    if (socket.connected) setConnected(true);

    return () => {
      mounted = false;
      socket.off('connect', onConn);
      socket.off('disconnect', onDis);
      socket.off('queueUpdated', onUpd);
      socket.off('tokenLinked', onUpd);
      socket.off('tokenCreated', onUpd);
      socket.off('notify', onNotify);
      socket.off('systemBroadcast', onSystemBroadcast);
    };
  }, [token]);

  const value = {
    socket: socketRef.current,
    connected,
    loading,
    queueState,
    systemEvents
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
