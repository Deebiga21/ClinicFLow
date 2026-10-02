import { useEffect, useState, useCallback, useRef } from 'react';
import { SOCKET_URL } from '../config';

export function useClinicWebSocket() {
  const [socket, setSocket] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    // Determine ws url based on current host or hardcoded API
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If we're proxying or connecting directly:
    const wsHost = SOCKET_URL.replace(/^http(s?):\/\//, '');
    const wsUrl = `${wsProtocol}//${wsHost}/ws/clinic`;

    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WS Event:', data);
        setLastEvent(data);
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    ws.onclose = () => {
      console.log('WS closed. Reconnecting in 5s...');
      reconnectTimeout.current = setTimeout(connect, 5000);
    };

    ws.onerror = (err) => {
      console.error('WS Error', err);
      ws.close();
    };

    setSocket(ws);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (socket) socket.close();
    };
  }, [connect]); // Only run once on mount

  return { socket, lastEvent };
}
