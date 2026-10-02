import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Calendar, Ticket, Compass, Stethoscope, 
  Pill, Clock, Bell, User, HelpCircle, Moon 
} from 'lucide-react';
import Logo from '../Logo';

export default function PatientSidebar({ patientId, setPatientId, patients }) {
  const items = [
    { to: '/patient', end: true, icon: Home, label: 'Home' },
    { to: '/patient/appointments', icon: Calendar, label: 'My Appointments' },
    { to: '/patient/queue', icon: Ticket, label: 'My Queue' },
    { to: '/patient/journey', icon: Compass, label: 'My Journey' },
    { to: '/patient/consultation', icon: Stethoscope, label: 'My Consultation' },
    { to: '/patient/prescriptions', icon: Pill, label: 'Prescriptions' },
    { to: '/patient/medications', icon: Clock, label: 'Medications' },
    { to: '/patient/notifications', icon: Bell, label: 'Notifications' },
    { to: '/patient/profile', icon: User, label: 'My Profile' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <Logo />
      </div>
      
      <div className="p-4 border-b border-slate-100">
        <label className="text-xs font-semibold text-slate-500 mb-2 block uppercase tracking-wider">
          Demo Patient Selector
        </label>
        <select 
          value={patientId}
          onChange={(e) => {
            setPatientId(e.target.value);
            localStorage.setItem('demo_patient_id', e.target.value);
          }}
          className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm text-slate-700 outline-none focus:border-sky-500"
        >
          {patients.map(p => (
            <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
          ))}
          {!patients.length && <option value="P_1">Default Patient (P_1)</option>}
        </select>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-1 px-4">
        <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider px-2">
          MY CARE
        </div>
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                isActive 
                  ? 'bg-sky-50 text-sky-600' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <div className="mt-8 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider px-2">
          SUPPORT
        </div>
        <NavLink
          to="/patient/help"
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
              isActive 
                ? 'bg-sky-50 text-sky-600' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <HelpCircle size={18} />
          Help & Support
        </NavLink>
      </div>

      <div className="p-4 border-t border-slate-200">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 w-full transition-colors font-medium text-sm">
          <Moon size={18} />
          Dark Mode
        </button>
      </div>
    </aside>
  );
}
