import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';
import { Calendar, RefreshCw, Plus, ChevronRight, X, User, Clock, FileText } from 'lucide-react';
import BookingWizard from './BookingWizard';

export default function PatientAppointments() {
  const { data, loading, fetchData } = useOutletContext();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Loading your appointments...</p>
      </div>
    );
  }

  const appointments = data?.upcoming_appointments || [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#0A2540] mb-2">Your Appointments</h1>
          <p className="text-slate-500">Manage your upcoming and past appointments.</p>
        </div>
        <button onClick={() => setIsWizardOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition font-medium">
          <Plus size={18} /> Book New
        </button>
      </div>

      <BookingWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        patientId={data?.patient?.id || 'P_1'} 
        onComplete={() => {
          fetchData(); // Refresh data!
        }}
      />

      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
          <EmptyState title="No upcoming appointments" message="You have no appointments scheduled at the moment." icon={Calendar} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appt, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedAppt(appt)}
              className="group relative bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-sky-300 hover:ring-2 hover:ring-sky-100 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="font-semibold text-slate-800">{appt.appointment_date} - {appt.appointment_time}</div>
                <StatusBadge status={appt.status === 'Completed' ? 'success' : appt.status === 'Scheduled' ? 'warning' : 'default'} text={appt.status} />
              </div>
              <p className="text-slate-600 font-medium">Doctor ID: {appt.doctor_id}</p>
              <p className="text-slate-500 text-sm mt-1">Type: {appt.appointment_type}</p>
              
              <div className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="text-sky-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAppt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-sky-50">
              <h2 className="text-lg font-bold text-[#0A2540]">Appointment Details</h2>
              <button onClick={() => setSelectedAppt(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-100 text-sky-600 rounded-full">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Doctor</p>
                  <p className="font-semibold text-slate-800">ID: {selectedAppt.doctor_id}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Date & Time</p>
                  <p className="font-semibold text-slate-800">{selectedAppt.appointment_date} at {selectedAppt.appointment_time}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Visit Type</p>
                  <p className="font-semibold text-slate-800">{selectedAppt.appointment_type}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-2">
                <button onClick={() => setSelectedAppt(null)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">Close</button>
                <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">Cancel Visit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
