import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  User, Clock, CheckCircle2, QrCode, 
  MapPin, Calendar, Pill, Navigation, AlertCircle, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';

export default function PatientHome() {
  const { data, loading } = useOutletContext();
  const [waitExplanation, setWaitExplanation] = useState(null);

  useEffect(() => {
    if (data?.patient?.id) {
      api.get(`/patient/${data.patient.id}/wait-explanation`)
         .then(res => setWaitExplanation(res))
         .catch(err => console.error("Could not fetch wait explanation", err));
    }
  }, [data?.patient?.id, data?.queue_status]);

  if (loading || !data) {
    return <div className="flex h-screen items-center justify-center bg-[#f8fafc]"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>;
  }

  const { 
    patient = {}, 
    today_appointment = {}, 
    queue_status = {}, 
    waiting_prediction = {}, 
    journey = [], 
    medication_summary = []
  } = data;
  
  const hasAppt = !!today_appointment.id;
  const tokenNumber = queue_status.queue_position ? `A-${queue_status.queue_position}` : 'N/A';
  const status = queue_status.status || 'Scheduled';
  const patientsAhead = queue_status.queue_position ? Math.max(0, queue_status.queue_position - 1) : 0;
  const waitTime = waiting_prediction.prediction_value ? Math.round(waiting_prediction.prediction_value) : '--';
  
  // Calculate Journey Progress
  const journeyTotal = 6;
  const journeyCompleted = journey.filter(j => j.stage_completed_at).length;
  const journeyPercent = Math.min(100, Math.round((journeyCompleted / journeyTotal) * 100)) || 10;

  // Flatten medications
  const allSchedules = [];
  medication_summary.forEach(rx => {
    rx.schedules.forEach(s => {
      allSchedules.push({ ...s, medicine_name: rx.medicine_name, dosage: rx.dosage });
    });
  });

  return (
    <div className="font-sans space-y-6">
      
      {/* Welcome Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#0A2540] mb-1">Good Morning, {patient.name || 'Patient'}</h2>
        <p className="text-sm text-gray-500">Here is your clinic visit status for today.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT/MAIN COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Visit & Live Queue (Split layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Today's Visit Details */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[320px]">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500" /> Today's Visit
                </h3>
                <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">View Details</span>
              </div>
              <div className="p-5 flex-1 flex gap-4">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500">Doctor</span>
                    <span className="col-span-2 font-medium text-[#0A2540]">{today_appointment.doctor_id ? `Doctor ${today_appointment.doctor_id}` : 'Unassigned'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500">Reason</span>
                    <span className="col-span-2 font-medium text-[#0A2540]">{today_appointment.appointment_type || 'Consultation'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500">Time</span>
                    <span className="col-span-2 font-medium text-[#0A2540]">{today_appointment.appointment_time || '--'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500">Token</span>
                    <span className="col-span-2 font-bold text-blue-600">{tokenNumber}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="col-span-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-amber-100 text-amber-700">
                        {status}
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500">Clinic</span>
                    <span className="col-span-2 font-medium text-[#0A2540] flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400"/> City Health Clinic
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center p-2 mb-2 border border-gray-200">
                    <QrCode size={64} className="text-gray-700" />
                  </div>
                  <span className="text-[10px] text-gray-400">Scan at desk</span>
                </div>
              </div>
            </div>

            {/* Live Queue Status */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[320px]">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                  <Activity size={18} className="text-green-500" /> Live Queue Status
                </h3>
                <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">View Queue</span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-green-700 uppercase mb-1">Now Serving</span>
                    <span className="text-xl font-bold text-green-700">A-21</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 flex flex-col justify-center shadow-inner">
                    <span className="text-[10px] font-bold text-blue-700 uppercase mb-1">Your Token</span>
                    <span className="text-2xl font-black text-blue-700">{tokenNumber}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Next</span>
                    <span className="text-xl font-bold text-gray-600">A-22</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mt-auto border-t border-gray-100 pt-5">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#0A2540]">{patientsAhead}</p>
                    <p className="text-[10px] text-gray-500 uppercase mt-1">Ahead</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#0A2540]">{waitTime}</p>
                    <p className="text-[10px] text-gray-500 uppercase mt-1">Est Min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#0A2540]">{queue_status.queue_position || '-'}</p>
                    <p className="text-[10px] text-gray-500 uppercase mt-1">Position</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-blue-600 leading-tight">Waiting for Doctor</p>
                    <p className="text-[9px] text-gray-400 uppercase mt-2">Stage</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Your Queue Progress */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full opacity-50 transform translate-x-32 -translate-y-32 pointer-events-none"></div>
             
             <h3 className="font-semibold text-[#0A2540] flex items-center gap-2 mb-8 relative z-10">
                <Navigation size={18} className="text-blue-500" /> Your Queue Progress
             </h3>
             
             <div className="flex items-center justify-between relative z-10 max-w-2xl mx-auto px-4">
                {/* Connection line */}
                <div className="absolute top-6 left-12 right-12 h-0.5 bg-gray-200 -z-10"></div>
                
                {/* Node 1 */}
                <div className="flex flex-col items-center">
                   <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm z-10">
                      A-21
                   </div>
                   <span className="text-xs font-semibold text-green-700 mt-2">Now Serving</span>
                </div>
                
                {/* Node 2 */}
                <div className="flex flex-col items-center">
                   <div className="w-12 h-12 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm z-10">
                      A-22
                   </div>
                   <span className="text-xs text-gray-500 mt-2">Next</span>
                </div>
                
                {/* Node 3 */}
                <div className="flex flex-col items-center">
                   <div className="w-12 h-12 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm z-10">
                      A-23
                   </div>
                   <span className="text-xs text-gray-500 mt-2">Waiting</span>
                </div>
                
                {/* Node 4 (You) */}
                <div className="flex flex-col items-center">
                   <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-lg border-4 border-blue-100 shadow-md z-10 transform scale-110">
                      {tokenNumber}
                   </div>
                   <span className="text-xs font-bold text-blue-600 mt-3 uppercase tracking-wide">Your Turn</span>
                </div>
             </div>
             <p className="text-center text-sm text-gray-500 mt-8 relative z-10">{patientsAhead} patients ahead of you</p>
          </div>
          
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* Explainable AI block */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-[320px] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                <Clock size={18} className="text-blue-500" /> Why is my wait {waitTime} min?
              </h3>
              <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">View Details</span>
            </div>
            
            <div className="p-5 flex-1 flex flex-col overflow-y-auto">
              {!waitExplanation || !waitExplanation.factors ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
                  <AlertCircle size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">{waitExplanation?.explanation || "Explanation currently unavailable."}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {waitExplanation.factors.map((factor, idx) => {
                    const impactVal = parseFloat(factor.impact);
                    const isPositive = impactVal >= 0;
                    const widthPercent = Math.min(100, Math.max(10, Math.abs(impactVal) * 100));
                    
                    return (
                      <div key={idx} className="relative">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{factor.label}</span>
                          <span className={isPositive ? "text-amber-600 font-bold" : "text-green-600 font-bold"}>
                            {isPositive ? '+' : ''}{factor.impact}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${isPositive ? 'bg-amber-400' : 'bg-green-400'}`} 
                            style={{ width: `${widthPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {waitExplanation?.factors && waitExplanation.factors.length > 0 && (
                 <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-blue-600">
                     <Clock size={16} />
                     <span className="text-sm font-semibold">Estimated Wait</span>
                   </div>
                   <span className="text-xl font-bold text-[#0A2540]">{waitTime} minutes</span>
                 </div>
              )}
            </div>
          </div>

          {/* Medications Today */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-auto max-h-[320px] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                <Pill size={18} className="text-blue-500" /> My Medications Today
              </h3>
              <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
            </div>
            
            <div className="p-0 overflow-y-auto">
              {allSchedules.length === 0 ? (
                 <p className="text-center text-sm text-gray-500 py-8">No medications scheduled for today.</p>
              ) : allSchedules.slice(0, 4).map((med, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                     <div className={`mt-0.5 rounded-full p-1 ${med.status === 'Taken' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {med.status === 'Taken' ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-current"></div>}
                     </div>
                     <div>
                       <p className="text-sm font-bold text-[#0A2540]">{med.medicine_name} <span className="text-gray-500 font-normal">{med.dosage}</span></p>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs text-gray-500">{med.scheduled_time}</span>
                         <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${med.status === 'Taken' ? 'text-green-700 bg-green-50' : 'text-blue-700 bg-blue-50'}`}>
                           {med.status === 'Taken' ? 'Taken' : 'Upcoming'}
                         </span>
                       </div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Care Journey & Follow-up (Stacked in 1 card or 2 small cards) */}
          <div className="grid grid-cols-1 gap-4">
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex justify-between items-center mb-3">
                   <h3 className="text-sm font-semibold text-[#0A2540]">Care Journey Progress</h3>
                   <span className="text-xs font-bold text-blue-600">{journeyPercent}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                   <div className="h-2 rounded-full bg-blue-500" style={{ width: `${journeyPercent}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-500">Based on recorded care and medication events</p>
             </div>
             
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between group cursor-pointer hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                   <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                     <Calendar size={18} />
                   </div>
                   <div>
                      <p className="text-xs text-gray-500 font-medium">Next Follow-Up</p>
                      <p className="text-sm font-bold text-[#0A2540]">05 Oct 2026 • Dr. Kumar</p>
                   </div>
                </div>
                <div className="text-blue-500 group-hover:translate-x-1 transition-transform">
                   <ChevronRight size={18} />
                </div>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
