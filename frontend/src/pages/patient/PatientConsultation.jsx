import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import { Stethoscope, Clock, CheckCircle2 } from 'lucide-react';

export default function PatientConsultation() {
  const { patientId } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.getPatientDashboard(patientId);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  if (loading || !data) return <div className="p-8 text-slate-500">Loading consultation details...</div>;

  const appt = data.today_appointment;
  // If backend says they are in consultation, change state
  // For demo, we just assume upcoming if they have an appointment.
  const status = 'upcoming'; 

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">My Consultation</h1>
      
      {appt ? (
        <>
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex flex-col items-center justify-center text-center mb-8">
               <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mb-4">
                 <Stethoscope size={32} />
               </div>
               <h2 className="text-2xl font-bold text-slate-900 mb-2">Your consultation is upcoming</h2>
               <p className="text-slate-500">Please remain in the waiting area until your token is called.</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 grid grid-cols-2 gap-6">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Doctor</p>
                  <p className="text-lg font-bold text-slate-900">Dr. {appt.doctor_id}</p>
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Appointment</p>
                  <p className="text-lg font-bold text-slate-900">Today, {appt.appointment_time}</p>
               </div>
               <div className="col-span-2 pt-4 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock size={14} /> Expected Duration
                  </p>
                  <p className="text-lg font-bold text-slate-900">18 minutes</p>
               </div>
            </div>
          </div>
          
          {data.readiness && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Before Your Consultation</h3>
               <p className="text-slate-600 mb-4 text-sm">Please make sure your required appointment information is complete.</p>
               
               <div className="space-y-3">
                  <div className="flex items-center gap-3">
                     <CheckCircle2 size={18} className="text-emerald-500" />
                     <span className="text-slate-700 font-medium">Appointment details confirmed</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <CheckCircle2 size={18} className="text-emerald-500" />
                     <span className="text-slate-700 font-medium">Basic visit information provided</span>
                  </div>
                  
                  {data.readiness.missing_info && (
                    <div className="flex items-center gap-3 mt-4 p-4 bg-orange-50 text-orange-800 rounded-lg border border-orange-100">
                       <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></div>
                       <span className="font-medium">Missing: {data.readiness.missing_info}</span>
                    </div>
                  )}
               </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          No consultation scheduled for today.
        </div>
      )}
    </div>
  );
}
