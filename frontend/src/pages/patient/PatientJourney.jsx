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
        <p className="text-slate-500">A step-by-step look at your past visits and milestones.</p>
      </div>

      <div className="relative border-l-2 border-sky-100 ml-4 space-y-8 pb-8">
        {journey.map((item, i) => (
          <div key={i} className="relative pl-8">
            {/* Timeline Dot */}
            <div className="absolute -left-[17px] top-1 bg-white border-4 border-sky-500 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
              <Activity size={14} className="text-sky-500" />
            </div>
            
            {/* Content Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-800">{item.stage || 'Milestone'}</h3>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                  {new Date(item.stage_started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {item.notes || 'Status successfully updated for this stage of your journey.'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
