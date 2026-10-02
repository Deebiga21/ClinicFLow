import React from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';
import { Calendar, RefreshCw } from 'lucide-react';

export default function PatientAppointments() {
  const { data, loading } = useOutletContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Loading your appointments...</p>
      </div>
    );
  }

  const appointments = data?.upcoming_appointments || [];

  if (appointments.length === 0) return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-[#0A2540] mb-6">Appointments</h1>
      <div className="flex-1">
        <EmptyState title="No upcoming appointments" message="You have no appointments scheduled at the moment." icon={Calendar} />
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0A2540] mb-2">Your Appointments</h1>
        <p className="text-slate-500">Manage your upcoming and past appointments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointments.map((appt, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="font-semibold text-slate-800">{appt.appointment_date} - {appt.appointment_time}</div>
              <StatusBadge status={appt.status === 'Completed' ? 'success' : appt.status === 'Scheduled' ? 'warning' : 'default'} text={appt.status} />
            </div>
            <p className="text-slate-600 font-medium">Doctor ID: {appt.doctor_id}</p>
            <p className="text-slate-500 text-sm mt-1">Type: {appt.appointment_type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
