import { useWebSocket } from '../context/WebSocketContext';

export function getSocket(token) {
  // Backwards compatibility, but it's recommended to just use WebSocketContext
  console.warn('getSocket is deprecated. Use useWebSocket hook instead.');
  return null; // The global provider handles socket connection now
}

export function useQueueSocket() {
  return useWebSocket();
}
