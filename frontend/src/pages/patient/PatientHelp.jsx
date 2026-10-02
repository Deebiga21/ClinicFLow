import React from 'react';
import { HelpCircle, Info, Ticket, Calendar, Clock, AlertTriangle } from 'lucide-react';

export default function PatientHelp() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Help & Support</h1>
      <p className="text-slate-500 mb-8">How to use your ClinicFlow Patient Dashboard.</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 text-amber-800 mb-8">
         <AlertTriangle size={24} className="shrink-0 mt-1" />
         <div>
           <p className="font-bold mb-1">Important Notice</p>
           <p className="text-sm">ClinicFlow provides operational information about your visit. It does not replace medical advice from qualified healthcare professionals. If you are experiencing a medical emergency, please alert staff immediately or call emergency services.</p>
         </div>
      </div>

      <div className="space-y-4">
         <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2"><Info size={18} className="text-sky-500"/> How ClinicFlow Works</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              ClinicFlow uses live clinic data to keep you informed about your visit. You can track your position in the queue, view upcoming appointments, and access your medication schedules all in one place.
            </p>
         </div>
         
         <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2"><Ticket size={18} className="text-emerald-500"/> Queue Information</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Your "Token" represents your place in line. The "Estimated Wait" is calculated using live data and historical consultation times. This number is an estimate and may fluctuate as clinic conditions change.
            </p>
         </div>
         
         <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2"><Calendar size={18} className="text-purple-500"/> Appointment Help</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              To check in, please arrive 15 minutes before your scheduled appointment. If you need to reschedule, please contact the clinic reception directly.
            </p>
         </div>
         
         <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2"><Clock size={18} className="text-orange-500"/> Medication Schedule Help</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
               The medications page displays the times prescribed by your doctor. Your regularity score helps you and your doctor understand your medication adherence.
            </p>
         </div>
      </div>
      
      <div className="mt-12 text-center">
         <p className="text-slate-500 mb-4">Still need help?</p>
         <button className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors">
            Contact Clinic Reception
         </button>
      </div>
    </div>
  );
}
