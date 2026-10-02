import React from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';
import { Bell, RefreshCw } from 'lucide-react';

export default function PatientNotifications() {
  const { data, loading } = useOutletContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Loading notifications...</p>
      </div>
    );
  }

  const notifications = data?.notifications || [];

  if (notifications.length === 0) return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-[#0A2540] mb-6">Notifications</h1>
      <div className="flex-1">
        <EmptyState title="All caught up!" message="You have no new notifications to review." icon={Bell} />
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0A2540] mb-2">Notifications</h1>
        <p className="text-slate-500">Stay informed about your appointments and health updates.</p>
      </div>

      <div className="space-y-3">
        {notifications.map((note, i) => (
          <div key={i} className={`p-4 rounded-xl border flex gap-4 items-start ${note.unread ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className={`mt-1 rounded-full p-2 shrink-0 ${note.unread ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
              <Bell size={18} />
            </div>
            <div>
              <h4 className={`text-sm font-medium ${note.unread ? 'text-slate-900' : 'text-slate-700'}`}>{note.message}</h4>
              <span className="text-xs text-slate-400 mt-1 block">{note.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
