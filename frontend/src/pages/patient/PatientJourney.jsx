import React from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';
import { Activity, RefreshCw } from 'lucide-react';

export default function PatientJourney() {
  const { data, loading } = useOutletContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Loading your health journey...</p>
      </div>
    );
  }

  const journey = data?.journey || [];

  if (journey.length === 0) return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-[#0A2540] mb-6">Health Journey</h1>
      <div className="flex-1">
        <EmptyState title="No records found" message="We couldn't find past visits in your journey yet." icon={Activity} />
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0A2540] mb-2">Health Journey</h1>
        <p className="text-slate-500">A look back at your past visits and milestones.</p>
      </div>

      <div className="space-y-4">
        {journey.map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-start">
            <div className="mt-1 bg-cyan-50 text-cyan-600 p-2 rounded-full shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{item.stage}</h3>
              <p className="text-sm text-slate-500">{new Date(item.stage_started_at).toLocaleString()}</p>
              <p className="text-slate-600 mt-2">{item.notes || 'Status updated.'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
