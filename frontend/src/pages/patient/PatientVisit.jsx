import React from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';
import { Clock, RefreshCw } from 'lucide-react';

export default function PatientVisit() {
  const { data, loading } = useOutletContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Checking your visit status...</p>
      </div>
    );
  }

  if (!data?.queue_status) {
    return (
      <div className="p-6 h-full flex flex-col">
        <h1 className="text-2xl font-semibold text-[#0A2540] mb-6">Current Visit</h1>
        <div className="flex-1">
          <EmptyState title="No active visit" message="You don't have an ongoing visit today. Check your appointments for upcoming schedules." icon={Clock} />
        </div>
      </div>
    );
  }

  const { queue_status, waiting_prediction, today_appointment } = data;
  const waitMin = waiting_prediction ? Math.round(waiting_prediction.predicted_wait_minutes) : null;
  const status = queue_status.status || 'Waiting';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0A2540] mb-2">Current Visit</h1>
        <p className="text-slate-500">Track your progress for today's visit.</p>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-[18px] border border-slate-100 p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center border border-blue-100">
            <Clock size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest">{status}</h2>
            <p className="text-slate-500 mt-1">Doctor ID: {queue_status.doctor_id || (today_appointment?.doctor_id) || 'Assigned soon'}</p>
          </div>
        </div>
        
        {waitMin !== null && status === 'Waiting' && (
          <div className="p-6 bg-blue-50 rounded-xl text-blue-800 border border-blue-200 shadow-sm flex items-start gap-4">
            <Clock className="mt-1 shrink-0 text-blue-600" />
            <div>
              <strong className="block text-lg mb-1 text-blue-900">Estimated Wait Time: {waitMin} minutes</strong>
              <p className="opacity-90">{waiting_prediction.explanation || 'Please relax in the waiting area.'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
