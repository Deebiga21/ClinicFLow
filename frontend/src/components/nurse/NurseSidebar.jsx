import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Users, Stethoscope, Activity, 
  Cpu, Zap, Lightbulb, BarChart2, RefreshCw, AlertTriangle, 
  Box, Pill, FileText, Bell, Settings, Moon
} from 'lucide-react';

export default function NurseSidebar() {
  const sections = [
    {
      title: 'COMMAND CENTER',
      items: [
        { to: '/nurse', end: true, icon: Home, label: 'Command Center' },
      ]
    },
    {
      title: 'CLINIC INTELLIGENCE',
      items: [
        { to: '/nurse/patient-flow', icon: Users, label: 'Patient Flow' },
        { to: '/nurse/doctor-workload', icon: Stethoscope, label: 'Doctor Workload' },
        { to: '/nurse/congestion', icon: Activity, label: 'Congestion Forecast' },
      ]
    },
    {
      title: 'AI / ML',
      items: [
        { to: '/nurse/ml', icon: Cpu, label: 'ML Model Center' },
        { to: '/nurse/predictions', icon: Zap, label: 'Predictions' },
        { to: '/nurse/explainability', icon: Lightbulb, label: 'Explainable AI' },
        { to: '/nurse/model-performance', icon: BarChart2, label: 'Model Performance' },
        { to: '/nurse/prediction-feedback', icon: RefreshCw, label: 'Prediction vs Actual' },
        { to: '/nurse/anomalies', icon: AlertTriangle, label: 'Anomaly Center' },
      ]
    },
    {
      title: 'SIMULATION',
      items: [
        { to: '/nurse/digital-twin', icon: Box, label: 'Digital Twin' },
      ]
    },
    {
      title: 'RESOURCE INTELLIGENCE',
      items: [
        { to: '/nurse/medicines', icon: Pill, label: 'Medicine Intelligence' },
        { to: '/nurse/reports', icon: FileText, label: 'Reports' },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { to: '/nurse/notifications', icon: Bell, label: 'Notifications' },
        { to: '/nurse/settings', icon: Settings, label: 'Settings' },
      ]
    }
  ];

  return (
    <aside className="w-72 bg-white/70 backdrop-blur-2xl border-r border-white/50 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto custom-scrollbar z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-6 pb-2 flex items-center justify-between shrink-0">
        <div className="text-[26px] font-black flex items-center tracking-tighter">
           <span className="text-slate-800">CLINIC</span><span className="text-cyan-400">FLOW</span>
        </div>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-6 px-4">
        {sections.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <div className="text-[11px] font-bold text-slate-800 mb-1 uppercase tracking-wider px-3">
              {section.title}
            </div>
            {section.items.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-2.5 rounded-full transition-all font-semibold text-[13px] ${
                    isActive 
                      ? 'bg-cyan-400 text-slate-900 shadow-md shadow-cyan-400/20' 
                      : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="p-5 border-t border-slate-900/5 flex flex-col gap-3 shrink-0">
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-full text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 w-full transition-all font-semibold text-[13px]">
          <Moon size={16} strokeWidth={2} />
          Dark Mode
        </button>
        <div className="flex items-center gap-3 px-4 py-2">
           <div className="w-9 h-9 rounded-full bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              A
           </div>
           <span className="text-slate-800 text-sm font-bold truncate">Nurse User</span>
        </div>
      </div>
    </aside>
  );
}
