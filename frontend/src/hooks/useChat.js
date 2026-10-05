import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { useClinicWebSocket } from './useClinicWebSocket';
import { useAuth } from '../context/AuthContext';
// import { playMessageBlip } from '../utils/sound'; // Keep commented if sound missing

export function useChat(channelId) {
  const { user } = useAuth() || {};
  const [messages, setMessages] = useState([]);
  const { lastEvent } = useClinicWebSocket();

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      return;
    }

    let alive = true;
    // Fetch historical messages for the channel
    api.get(`/chat/channels/${channelId}/messages`)
      .then(res => {
        const data = Array.isArray(res) ? res : (res.data || []);
        if (alive) setMessages(data);
      })
      .catch(console.error);

    return () => { alive = false; };
  }, [channelId]);

  // Listen for websocket chat events
  useEffect(() => {
    if ((lastEvent?.type === 'chat_message' || lastEvent?.type === 'chat_message_created') && lastEvent.data?.channel === channelId) {
      const msg = lastEvent.data;
      setMessages(prev => {
        if (prev.some(existing => existing.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }
  }, [lastEvent, channelId]);

  const send = useCallback(async (text, messageType = "text") => {
    if (!text || !text.trim() || !channelId) return;
    
    const senderRole = user?.role || 'nurse';
    const senderId = user?.username || 'Nurse_1'; // fallback
    
    try {
      if (channelId === 'bot') {
        await api.post('/chat/bot/query', {
          sender_id: senderId,
          sender_role: senderRole,
          message: text
        });
      } else {
        await api.post(`/chat/messages`, {
          sender_id: senderId,
          sender_role: senderRole,
          channel: channelId,
          message: text,
          message_type: messageType
        });
      }
    } catch (e) {
      console.error("Failed to send message", e);
    }
  }, [channelId, user]);

  return { messages, send };
}
