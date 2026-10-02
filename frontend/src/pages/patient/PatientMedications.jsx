import React from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';
import { Pill, RefreshCw } from 'lucide-react';

export default function PatientMedications() {
  const { data, loading } = useOutletContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Loading your medications...</p>
      </div>
    );
  }

  const medications = data?.medication_summary || [];

  if (medications.length === 0) return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-[#0A2540] mb-6">Medications</h1>
      <div className="flex-1">
        <EmptyState title="No active medications" message="You don't have any active medications at this time." icon={Pill} />
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0A2540] mb-2">Active Medications</h1>
        <p className="text-slate-500">Keep track of what you need to take and when.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {medications.map((med, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start gap-4">
            <div className="bg-blue-50 text-blue-500 p-4 rounded-xl shrink-0">
              <Pill size={28} />
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{med.medicine_name}</h3>
                  <p className="text-slate-600 font-medium">{med.dosage}</p>
                </div>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {med.frequency}
                </span>
              </div>
              
              <div className="mt-4 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Scheduled Times</h4>
                {med.schedules && med.schedules.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {med.schedules.map((s, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                        <div className="text-sm font-semibold text-slate-700">{s.scheduled_time || 'Pending'}</div>
                        <div className="text-xs text-slate-500 mt-1">{s.scheduled_date || 'Daily'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic">No specific times specified by the doctor yet.</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
