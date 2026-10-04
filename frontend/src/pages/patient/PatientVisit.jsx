import React from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';
import { Clock, RefreshCw, UserCheck, ArrowRight, User } from 'lucide-react';

export default function PatientVisit() {
  const { data, loading } = useOutletContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Checking your token status...</p>
      </div>
    );
  }

  // The patient needs a valid appointment and either a 'queue_status' (after checkin) 
  // or a 'token_status' (after payment but before checkin).
  // Actually, we made `queue_status` 'Scheduled' upon payment!
  if (!data?.queue_status && !data?.today_appointment?.token_status) {
    return (
      <div className="p-6 h-full flex flex-col">
        <h1 className="text-2xl font-semibold text-[#0A2540] mb-6">My Token</h1>
        <div className="flex-1">
          <EmptyState title="No Active Token" message="You don't have an active clinic token yet. Please book an appointment and complete payment." icon={Clock} />
        </div>
      </div>
    );
  }

  const tokenLabel = data?.today_appointment?.token_status || `A-${data?.queue_status?.queue_position || 10}`;
  const pos = parseInt(tokenLabel.replace('A-', '')) || 10;
  
  // Calculate mock or real queue lengths
  const nowServing = pos > 3 ? pos - 3 : Math.max(1, pos - 1);
  const nextToken = nowServing + 1;
  const patientsAhead = Math.max(0, pos - nowServing);
  const waitMin = data?.waiting_prediction ? Math.round(data.waiting_prediction.predicted_wait_minutes) : patientsAhead * 15;
  const status = data?.queue_status?.status || data?.today_appointment?.status || 'Waiting';

  // Build the visual queue path
  const visualQueue = [];
  for (let i = nowServing; i <= pos; i++) {
    visualQueue.push(`A-${i}`);
  }

  return (
    <div className="p-6 h-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#0A2540] mb-6">My Token</h1>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Your Token Details */}
        <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-gray-100 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full -z-10 opacity-50"></div>
          
          <p className="text-sm font-bold text-blue-600 tracking-widest uppercase mb-2">YOUR TOKEN</p>
          <h2 className="text-7xl font-black text-[#0A2540] mb-8">{tokenLabel}</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-500 font-medium">DOCTOR</span>
              <span className="font-bold text-[#0A2540]">{data?.today_appointment?.doctor_name || 'Dr. Kumar'}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-500 font-medium">DEPARTMENT</span>
              <span className="font-bold text-[#0A2540]">{data?.today_appointment?.department || 'General Medicine'}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-500 font-medium">STATUS</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                status === 'In Consultation' ? 'bg-purple-100 text-purple-700' :
                status === 'Completed' ? 'bg-green-100 text-green-700' :
                status === 'Scheduled' ? 'bg-gray-100 text-gray-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Live Queue Status */}
        <div className="flex-1 p-8 bg-white">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">NOW SERVING</p>
              <p className="text-2xl font-black text-[#0A2540]">A-{nowServing}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">NEXT</p>
              <p className="text-2xl font-black text-gray-600">A-{nextToken}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">PATIENTS AHEAD</p>
              <p className="text-3xl font-black text-blue-700">{patientsAhead}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">ESTIMATED WAIT</p>
              <p className="text-3xl font-black text-amber-700">{waitMin} <span className="text-sm">min</span></p>
            </div>
          </div>

          {/* Visual Queue Timeline */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">LIVE QUEUE LINE</p>
            <div className="flex items-center justify-between">
              {visualQueue.map((vq, idx) => (
                <React.Fragment key={vq}>
                  <div className={`flex flex-col items-center ${idx === 0 ? 'opacity-50' : ''}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-2 border-2 ${
                      vq === tokenLabel 
                        ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100' 
                        : idx === 0 
                          ? 'bg-gray-100 text-gray-500 border-gray-200'
                          : 'bg-white text-[#0A2540] border-gray-200 shadow-sm'
                    }`}>
                      {vq}
                    </div>
                    {vq === tokenLabel ? (
                      <span className="text-xs font-bold text-blue-600">YOU</span>
                    ) : idx === 0 ? (
                      <span className="text-xs font-bold text-gray-400">CURRENT</span>
                    ) : (
                      <span className="text-xs text-transparent">_</span>
                    )}
                  </div>
                  {idx < visualQueue.length - 1 && (
                    <ArrowRight className="text-gray-300 -mt-6" size={20} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
