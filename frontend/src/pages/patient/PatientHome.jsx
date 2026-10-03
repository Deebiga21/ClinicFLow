import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import ChartCard from '../../components/shared/ChartCard';
import StatusBadge from '../../components/shared/StatusBadge';
import { User, Clock, CheckCircle, Navigation, Users, RefreshCw, Pill, ArrowRight, Activity, Calendar } from 'lucide-react';

export default function PatientHome() {
  const { data, loading } = useOutletContext();
  const navigate = useNavigate();

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Loading your visit details...</p>
      </div>
    );
  }

  const patient = data.patient || {};
  const appointment = data.today_appointment || {};
  const queueStatus = data.queue_status || {};
  const medications = data.medication_summary || [];
  const journey = data.journey || [];
  
  const hasAppt = !!appointment.id;
  
  // LIVE QUEUE data
  const token = queueStatus.token_number || '--';
  const status = queueStatus.status || 'No active queue';
  const ahead = queueStatus.patients_ahead ?? '--';
  const currentlyServing = queueStatus.currently_serving || '--';
  const nextToken = queueStatus.next_expected_token || '--';
  const waitMin = data.waiting_prediction ? Math.round(data.waiting_prediction.predicted_wait_minutes) : '--';
  const badgeStatus = status === 'Waiting' ? 'warning' : status === 'In Consultation' ? 'success' : 'default';

  // MEDICATION SUMMARY data (today's schedules)
  const todaySchedules = [];
  medications.forEach(med => {
    (med.schedules || []).forEach(sched => {
      todaySchedules.push({
        medicine: med.medicine_name,
        time: sched.scheduled_time,
        status: sched.status
      });
    });
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto pb-12">
      
      {!hasAppt && (
        <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center">
          <Calendar className="mx-auto text-slate-400 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-700">No appointments today</h2>
          <p className="text-slate-500 mt-2">You don't have any active visits scheduled for today.</p>
        </div>
      )}

      {hasAppt && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* TODAY'S VISIT RECEIPT */}
          <ChartCard title="TODAY'S VISIT" subtitle="Your appointment details">
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 border border-blue-100 shadow-sm relative overflow-hidden mt-4">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Patient Name</div>
                  <div className="font-black text-[#0A2540] text-xl">{patient.name || 'Unknown'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Token</div>
                  <div className="font-black text-blue-600 text-2xl">{token}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between border-b border-dashed border-blue-100 pb-3">
                  <span className="text-sm text-slate-500">Date & Time</span>
                  <span className="text-sm font-bold text-slate-700">{appointment.appointment_date} at {appointment.appointment_time}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-blue-100 pb-3">
                  <span className="text-sm text-slate-500">Doctor</span>
                  <span className="text-sm font-bold text-slate-700">Dr. {appointment.doctor_id}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-blue-100 pb-3">
                  <span className="text-sm text-slate-500">Reason</span>
                  <span className="text-sm font-bold text-slate-700">{appointment.appointment_type || 'General'}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-sm text-slate-500">Current Status</span>
                  <StatusBadge status={badgeStatus} text={status.toUpperCase()} />
                </div>
              </div>

              <button 
                onClick={() => navigate('/patient/my-visit')}
                className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
              >
                VIEW FULL DETAILS
              </button>
            </div>
          </ChartCard>

          {/* LIVE QUEUE STATUS */}
          <ChartCard title="LIVE QUEUE STATUS" subtitle="Real-time clinic flow">
            <div className="flex flex-col gap-4 mt-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Now Serving</div>
                  <div className="text-3xl font-black text-slate-700">{currentlyServing}</div>
                </div>
                {nextToken && nextToken !== '--' && (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Up Next</div>
                    <div className="text-xl font-bold text-slate-500">{nextToken}</div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200 flex justify-between items-center shadow-sm">
                <div>
                  <div className="text-[10px] text-blue-600 uppercase font-bold tracking-widest mb-1">Your Token</div>
                  <div className="text-3xl font-black text-blue-700">{token}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Patients Ahead</div>
                  <div className="text-2xl font-black text-slate-700">{ahead}</div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={18} />
                  <span className="font-semibold text-sm">Estimated wait</span>
                </div>
                <div className="text-xl font-black text-[#0A2540]">
                  {waitMin} {waitMin !== '--' ? 'min' : ''}
                </div>
              </div>
            </div>
          </ChartCard>

          {/* WHAT HAPPENS NEXT */}
          <ChartCard title="WHAT HAPPENS NEXT?" subtitle="Your clinic journey today">
             <div className="mt-4 bg-white rounded-xl border border-slate-100 p-5 space-y-4 relative">
                <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-slate-100"></div>
                
                <div className="flex items-center gap-4 relative">
                   <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center z-10 shrink-0"><CheckCircle size={12} /></div>
                   <div className="font-semibold text-sm text-slate-700">Appointment confirmed</div>
                </div>
                
                <div className="flex items-center gap-4 relative">
                   <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center z-10 shrink-0"><CheckCircle size={12} /></div>
                   <div className="font-semibold text-sm text-slate-700">Checked in</div>
                </div>
                
                <div className="flex items-center gap-4 relative">
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0 ${status === 'Waiting' ? 'bg-amber-100 text-amber-600 border-2 border-white ring-2 ring-amber-100' : 'bg-emerald-100 text-emerald-600'}`}>
                     {status === 'Waiting' ? <div className="w-2 h-2 rounded-full bg-amber-500" /> : <CheckCircle size={12} />}
                   </div>
                   <div className={`font-semibold text-sm ${status === 'Waiting' ? 'text-amber-700' : 'text-slate-700'}`}>Queue</div>
                </div>

                <div className="flex items-center gap-4 relative">
                   <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center z-10 shrink-0"><ArrowRight size={12} /></div>
                   <div className="font-medium text-sm text-slate-500">Nurse preparation</div>
                </div>

                <div className="flex items-center gap-4 relative">
                   <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center z-10 shrink-0"><ArrowRight size={12} /></div>
                   <div className="font-medium text-sm text-slate-500">Doctor consultation</div>
                </div>
             </div>
          </ChartCard>

          {/* MEDICATIONS TODAY */}
          <ChartCard title="MEDICATIONS TODAY" subtitle="Your daily schedule">
             <div className="mt-4 bg-white rounded-xl border border-slate-100 p-2">
                {todaySchedules.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <Pill className="mx-auto mb-2 opacity-50" size={24} />
                    <p className="text-sm font-medium">No medications scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todaySchedules.map((sched, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${sched.status === 'Taken' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {sched.status === 'Taken' ? <CheckCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-amber-500" />}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-700">{sched.medicine}</div>
                            <div className="text-xs text-slate-500">{sched.time}</div>
                          </div>
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${sched.status === 'Taken' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {sched.status === 'Taken' ? 'Taken' : 'Upcoming'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </ChartCard>

          {/* CARE JOURNEY */}
          <div className="md:col-span-2">
            <ChartCard title="CARE JOURNEY PROGRESS" subtitle="Based on recorded care and medication events">
              <div className="mt-6 px-4">
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full w-1/5 border-r border-white/20"></div>
                  <div className="bg-emerald-400 h-full w-1/5 border-r border-white/20"></div>
                  <div className="bg-emerald-300 h-full w-1/5 border-r border-white/20"></div>
                  <div className="bg-slate-200 h-full w-2/5"></div>
                </div>
                <div className="flex justify-between mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="text-emerald-600">Appointment</span>
                  <span className="text-emerald-600">Doctor</span>
                  <span className="text-emerald-600">Prescription</span>
                  <span>Medication</span>
                  <span>Follow-up</span>
                </div>
              </div>
            </ChartCard>
          </div>

        </div>
      )}

    </div>
  );
}
