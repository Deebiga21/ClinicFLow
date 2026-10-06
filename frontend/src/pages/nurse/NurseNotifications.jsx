import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2, Clock, Check, Activity, Pill, Cpu, ShieldAlert, MessageCircle, X } from 'lucide-react';
import ChatPanel from '../../components/ChatPanel';
import { api } from '../../services/api';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';

export default function NurseNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatPatientId, setChatPatientId] = useState(null);
  const { lastEvent } = useClinicWebSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getNurseNotifications().catch(() => []);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (lastEvent?.type === 'ADMIN_NOTIFICATION') {
      fetchNotifications();
    }
  }, [lastEvent]);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  if (loading) return <LoadingState message="Loading Notifications..." />;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  const getIconForType = (type) => {
    switch (type) {
      case 'Congestion Alert': return <Activity className="w-5 h-5 text-orange-500" />;
      case 'Prediction Alert': return <Clock className="w-5 h-5 text-indigo-500" />;
      case 'Anomaly Alert': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'Medicine Alert': return <Pill className="w-5 h-5 text-amber-500" />;
      case 'Model Alert': return <Cpu className="w-5 h-5 text-purple-500" />;
      case 'System Alert': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-50 text-red-700 border-red-100';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'info': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-gray-700" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Clinic operational and ML alerts.</p>
        </div>
        <button 
          onClick={fetchNotifications}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Refresh Alerts
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                notification.is_read ? 'bg-white border-gray-200 opacity-75' : getSeverityStyles(notification.severity)
              }`}
            >
              <div className="mt-1 flex-shrink-0">
                {getIconForType(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className={`font-semibold text-sm ${notification.is_read ? 'text-gray-900' : ''}`}>
                    {notification.title || 'DATA UNAVAILABLE'}
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : '-'}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${notification.is_read ? 'text-gray-500' : 'opacity-90'}`}>
                  {notification.message || 'DATA UNAVAILABLE'}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-75">
                    {notification.type || 'Unknown'}
                  </span>
                  {!notification.is_read && (
                    <button 
                      onClick={() => handleMarkRead(notification.id)}
                      className="text-xs font-medium flex items-center gap-1 hover:underline ml-auto"
                    >
                      <Check className="w-3 h-3" /> Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 py-12">
            <EmptyState icon={CheckCircle2} title="All Caught Up!" message="No recent notifications to display." />
          </div>
        )}
      </div>

      {chatPatientId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[600px]">
            <div className="px-4 py-3 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <MessageCircle size={18} /> Chat with Patient
              </h3>
              <button onClick={() => setChatPatientId(null)} className="hover:bg-blue-700 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-gray-50 p-0 relative">
              <ChatPanel channelId={patient_} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

