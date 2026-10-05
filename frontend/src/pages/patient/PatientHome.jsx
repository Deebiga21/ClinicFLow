import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  User, Clock, CheckCircle2, QrCode, 
  MapPin, Calendar, Pill, Navigation, Activity, X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function PatientHome() {
  const { data, loading } = useOutletContext();
  const [waitExplanation, setWaitExplanation] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleQRClick = async () => {
    if (!data?.today_appointment?.id || data?.queue_status || isCheckingIn || checkInSuccess) return;
    setIsCheckingIn(true);
    try {
      await fetch('http://localhost:8000/api/pipeline/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: data.today_appointment.id })
      });
      setCheckInSuccess(true);
      setTimeout(() => setCheckInSuccess(false), 3000);
    } catch(err) {
      console.error(err);
    } finally {
      setIsCheckingIn(false);
    }
  };

  useEffect(() => {
    if (data?.patient?.id) {
      fetch(`http://localhost:8000/api/patient/${data.patient.id}/wait-explanation`)
         .then(res => res.json())
         .then(res => setWaitExplanation(res))
         .catch(err => console.error(err));
    }
  }, [data?.patient?.id, data?.queue_status]);

  if (loading || !data) {
    return <div className="flex h-[80vh] items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }

  const patient = data?.patient || {};
  const today_appointment = data?.today_appointment || {};
  const queue_status = data?.queue_status || {};
  const waiting_prediction = data?.waiting_prediction || {};
  const journey = data?.journey || [];
  const medication_summary = data?.medication_summary || [];
  const live_queue = data?.live_queue || {};
  
  const tokenNumber = queue_status.token_number ? String(queue_status.token_number) : (today_appointment.id ? 'Not generated yet' : 'N/A');
  const status = queue_status.status ? queue_status.status : (today_appointment.status || 'No Appointment');
  const patientsAhead = queue_status.queue_position ? Math.max(0, queue_status.queue_position - 1) : 0;
  const waitTime = waiting_prediction.prediction_value ? Math.round(waiting_prediction.prediction_value) : '--';
  
  const nowServingToken = live_queue.current || '--';
  const nextToken = live_queue.next || '--';

  const journeyTotal = 6;
  const journeyCompleted = journey.filter(j => j.stage_completed_at).length;
  const journeyPercent = Math.min(100, Math.round((journeyCompleted / journeyTotal) * 100)) || 10;

  const allSchedules = [];
  medication_summary.forEach(rx => {
    rx.schedules.forEach(s => {
      allSchedules.push({ ...s, medicine_name: rx.medicine_name, dosage: rx.dosage });
    });
  });

  return (
    <div className="font-sans space-y-6 relative">
      
      {/* Appointment Details Modal */}
      {detailsOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-[#0A2540]">Appointment Details</h2>
              <button onClick={() => setDetailsOpen(false)} className="p-2 hover:bg-gray-200 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-sm space-y-4">
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Patient</span>
                 <span className="font-semibold">{patient.name}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Patient ID</span>
                 <span className="font-semibold">{patient.id}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Appointment ID</span>
                 <span className="font-mono text-xs">{today_appointment.id}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Doctor</span>
                 <span className="font-semibold">{today_appointment.doctor_name ? `Dr. ${today_appointment.doctor_name}` : 'Unassigned'}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Department</span>
                 <span className="font-semibold">{today_appointment.doctor_department || '--'}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Date & Time</span>
                 <span className="font-semibold">{today_appointment.appointment_date} {today_appointment.appointment_time}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Type</span>
                 <span className="font-semibold">{today_appointment.appointment_type}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Check-in Status</span>
                 <span className="font-semibold">{queue_status.id ? 'Checked In' : 'Not Checked In'}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Token</span>
                 <span className="font-semibold">{tokenNumber}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Queue Status</span>
                 <span className="font-semibold">{status}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Estimated wait</span>
                 <span className="font-semibold">{waitTime} min</span>
               </div>
               <div className="flex justify-center mt-6">
                 <QRCodeSVG value={today_appointment.id || 'N/A'} size={100} />
               </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
              <button onClick={() => setDetailsOpen(false)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-1">Good Morning, {patient.name || 'Patient'} 👋</h2>
          <p className="text-sm text-gray-500">Your clinic journey, all in one place.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-[#0A2540]">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <p className="text-xs text-gray-500">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Live
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          {/* Today's Visit Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" /> Today's Visit
              </h3>
              {today_appointment.id && (
                <button onClick={() => setDetailsOpen(true)} className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">VIEW DETAILS</button>
              )}
            </div>
            {today_appointment.id ? (
              <div className="p-5 flex gap-4">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500">Doctor</span>
                    <span className="col-span-2 font-medium text-[#0A2540]">{today_appointment.doctor_name ? `Dr. ${today_appointment.doctor_name}` : 'Unassigned'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500">Department</span>
                    <span className="col-span-2 font-medium text-[#0A2540]">{today_appointment.doctor_department || '--'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500">Reason</span>
                    <span className="col-span-2 font-medium text-[#0A2540]">{today_appointment.appointment_type || '--'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500">Appointment</span>
                    <span className="col-span-2 font-medium text-[#0A2540]">{today_appointment.appointment_date} {today_appointment.appointment_time}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500">Appt ID</span>
                    <span className="col-span-2 font-mono text-xs text-gray-600 mt-0.5">{today_appointment.id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm items-center">
                    <span className="text-gray-500">Token</span>
                    <span className="col-span-2 font-bold text-[#0A2540]">{tokenNumber}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm items-center">
                    <span className="text-gray-500">Status</span>
                    <span className="col-span-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${status === 'Waiting' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {status}
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm items-center">
                    <span className="text-gray-500">Clinic</span>
                    <span className="col-span-2 font-medium text-[#0A2540]">City Health Clinic</span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-start w-28">
                  <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center p-1 mb-2 border border-gray-200">
                    <QRCodeSVG value={today_appointment.id} size={88} />
                  </div>
                  {!queue_status.id ? (
                     <button onClick={handleQRClick} disabled={isCheckingIn} className="w-full text-[10px] font-bold bg-blue-600 text-white py-1.5 rounded disabled:opacity-50">
                        {isCheckingIn ? 'CHECKING IN...' : 'CHECK IN'}
                     </button>
                  ) : (
                     <button className="w-full text-[10px] font-bold bg-green-100 text-green-700 py-1.5 rounded cursor-default border border-green-200">
                        CHECKED IN
                     </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No appointments booked for today.</p>
              </div>
            )}
          </div>

          {/* Explainable AI block */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                <Clock size={18} className="text-blue-500" /> AI WAIT-TIME PREDICTION
              </h3>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              {!waitExplanation || !waitExplanation.factors ? (
                <div className="flex flex-col items-center justify-center text-center text-gray-400 py-4">
                  <p className="text-sm">{waitExplanation?.explanation || "Prediction unavailable — insufficient data"}</p>
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
              
              {queue_status.id && (
                 <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <Clock size={24} className="text-blue-500" />
                     <div>
                       <p className="text-[10px] text-gray-500 uppercase font-bold">Estimated wait</p>
                       <p className="text-xl font-bold text-[#0A2540]">{waitTime} min</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] text-gray-400 uppercase font-bold">Prediction generated</p>
                     <p className="text-xs text-gray-500">{waiting_prediction.created_at ? new Date(waiting_prediction.created_at).toLocaleTimeString() : 'Just now'}</p>
                   </div>
                 </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* Live Queue Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                <Activity size={18} className="text-green-500" /> LIVE CLINIC QUEUE
              </h3>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex flex-col justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-green-700 uppercase mb-1">Currently Serving</span>
                  <span className="text-2xl font-bold text-green-700">{nowServingToken}</span>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-blue-500 flex flex-col justify-center shadow-md transform scale-105 z-10 relative">
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase mb-1">Your Token</span>
                  <span className="text-3xl font-black text-[#0A2540]">{tokenNumber === 'Not generated yet' ? '--' : tokenNumber}</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Next</span>
                  <span className="text-2xl font-bold text-gray-600">{nextToken}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mt-2 border-t border-gray-100 pt-5">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-medium mb-1">Patients Ahead</p>
                  <p className="text-xl font-bold text-[#0A2540]">{patientsAhead}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-medium mb-1">AI Est. Wait</p>
                  <p className="text-xl font-bold text-[#0A2540]">{waitTime} min</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-medium mb-1">Queue Position</p>
                  <p className="text-xl font-bold text-[#0A2540]">{queue_status.queue_position || '-'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-medium mb-1">Queue Status</p>
                  <p className="text-xs font-bold text-blue-600">Moderate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Your Queue Progress */}
          {queue_status.id && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full opacity-50 transform translate-x-32 -translate-y-32 pointer-events-none"></div>
               
               <h3 className="font-semibold text-[#0A2540] flex items-center gap-2 mb-8 relative z-10">
                  <Navigation size={18} className="text-blue-500" /> Your Queue Progress
               </h3>
               
               <div className="flex items-center justify-between relative z-10 max-w-lg mx-auto px-4">
                  {/* Connection line */}
                  <div className="absolute top-6 left-12 right-12 h-0.5 bg-gray-200 -z-10"></div>
                  
                  {/* Node 1 */}
                  <div className="flex flex-col items-center">
                     <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm z-10">
                        {nowServingToken}
                     </div>
                     <span className="text-[10px] font-semibold text-green-700 mt-2">Serving</span>
                  </div>
                  
                  {/* Node 2 */}
                  <div className="flex flex-col items-center">
                     <div className="w-12 h-12 bg-white text-gray-500 rounded-full flex items-center justify-center font-bold border border-gray-200 shadow-sm z-10">
                        {nextToken}
                     </div>
                     <span className="text-[10px] text-gray-500 mt-2">Next</span>
                  </div>
                  
                  {/* Node 4 (You) */}
                  <div className="flex flex-col items-center">
                     <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold border-2 border-blue-200 shadow-sm z-10">
                        {tokenNumber}
                     </div>
                     <span className="text-[10px] font-bold text-blue-600 mt-2">You</span>
                  </div>
               </div>
               <p className="text-center text-xs text-gray-500 mt-6 relative z-10">{patientsAhead} patients ahead of you</p>
            </div>
          )}

          {/* Medications Today */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                <Pill size={18} className="text-blue-500" /> My Medications Today
              </h3>
            </div>
            <div className="p-2 overflow-y-auto">
              {allSchedules.length === 0 ? (
                 <p className="text-center text-sm text-gray-500 py-6">No medications scheduled for today.</p>
              ) : allSchedules.slice(0, 3).map((med, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                     <div className={`mt-0.5 rounded-full p-1 ${med.status === 'Taken' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-400'}`}>
                        <CheckCircle2 size={16} />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-[#0A2540]">{med.medicine_name} <span className="text-gray-500 font-normal">{med.dosage}</span></p>
                       <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-xs text-gray-500">{med.scheduled_time} AM</span>
                         <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wide ${med.status === 'Taken' ? 'text-gray-500' : 'text-blue-600 bg-blue-50'}`}>
                           {med.status === 'Taken' ? 'Taken' : 'Upcoming'}
                         </span>
                       </div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
