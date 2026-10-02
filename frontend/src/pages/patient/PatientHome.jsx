import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ChartCard from '../../components/shared/ChartCard';
import StatusBadge from '../../components/shared/StatusBadge';
import { User, Clock, CheckCircle, Navigation, Users, RefreshCw } from 'lucide-react';

export default function PatientHome() {
  const { data, loading } = useOutletContext();

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Loading your visit details...</p>
      </div>
    );
  }

  const token = data.queue_status?.token_number || '--';
  const status = data.queue_status?.status || 'Scheduled';
  const ahead = data.queue_status?.patients_ahead || 0;
  const currentlyServing = data.queue_status?.currently_serving || '--';
  const waitMin = data.waiting_prediction ? Math.round(data.waiting_prediction.predicted_wait_minutes) : '--';

  const badgeStatus = status === 'Waiting' ? 'warning' : status === 'In Consultation' ? 'success' : 'default';

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-12">
      
      {/* TODAY'S VISIT MAIN CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <ChartCard title="TODAY'S VISIT" subtitle="Your current waiting status">
             <div className="flex items-start gap-4 mt-4 bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 border border-blue-200">
                   <User size={32} className="text-blue-600" />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Your Token</div>
                        <div className="text-4xl font-black text-[#0A2540]">{token}</div>
                      </div>
                      <StatusBadge status={badgeStatus} text={status.toUpperCase()} />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-blue-100">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Currently Serving</div>
                        <div className="text-xl font-bold text-slate-700">{currentlyServing}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Patients Ahead</div>
                        <div className="text-xl font-bold text-slate-700">{ahead}</div>
                      </div>
                      <div className="col-span-2 bg-white rounded-lg p-3 border border-blue-100 mt-2 flex justify-between items-center shadow-sm">
                         <div className="flex items-center gap-2 text-blue-700">
                           <Clock size={16} />
                           <span className="text-[11px] font-bold uppercase tracking-wide">Estimated Wait</span>
                         </div>
                         <div className="text-2xl font-black text-blue-700">{waitMin} {waitMin !== '--' ? 'min' : ''}</div>
                      </div>
                   </div>
                </div>
             </div>
          </ChartCard>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <ChartCard title="NEXT EXPECTED EVENT" subtitle="Your next step in the clinic">
             <div className="flex flex-col items-center justify-center h-full py-8 text-center bg-cyan-50/30 rounded-xl border border-dashed border-cyan-100 mt-4">
                <Navigation size={32} className="text-cyan-500 mb-3" />
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Up Next</h4>
                <div className="text-2xl font-black text-[#0A2540]">{data.next_expected_event ? data.next_expected_event.event : 'Consultation'}</div>
                <p className="text-[11px] text-slate-500 mt-2 max-w-xs">{status === 'Waiting' ? 'Please remain in the waiting area. The nurse will call your token number shortly.' : 'You are currently being seen.'}</p>
             </div>
          </ChartCard>

          <ChartCard title="MY VISIT STATUS" subtitle="Your journey today">
             <div className="flex items-center justify-between mt-6 px-2 overflow-x-auto pb-2">
                <div className="flex flex-col items-center min-w-[60px]">
                   <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2 border border-emerald-200"><CheckCircle size={14} /></div>
                   <div className="text-[9px] font-bold text-slate-500 uppercase">Appt</div>
                </div>
                <div className="text-emerald-300 w-full text-center border-b-2 border-emerald-300 mb-6 -mx-2"></div>
                
                <div className="flex flex-col items-center min-w-[60px]">
                   <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2 border border-emerald-200"><CheckCircle size={14} /></div>
                   <div className="text-[9px] font-bold text-slate-500 uppercase">Check-in</div>
                </div>
                <div className="text-amber-300 w-full text-center border-b-2 border-amber-300 mb-6 -mx-2"></div>

                <div className="flex flex-col items-center min-w-[60px]">
                   <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white mb-2 shadow-[0_0_12px_rgba(245,158,11,0.5)]"><Users size={14} /></div>
                   <div className="text-[9px] font-bold text-[#0A2540] uppercase">Queue</div>
                </div>
                <div className="text-slate-200 w-full text-center border-b-2 border-slate-200 border-dashed mb-6 -mx-2"></div>

                <div className="flex flex-col items-center min-w-[60px]">
                   <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2 border border-slate-200"><User size={14} /></div>
                   <div className="text-[9px] font-bold text-slate-400 uppercase">Doctor</div>
                </div>
             </div>
          </ChartCard>
        </div>
      </div>

    </div>
  );
}
