import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, Moon, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ items, role }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <aside className="w-64 bg-white/70 backdrop-blur-xl border-r border-slate-200/50 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-6 border-b border-slate-100/50 flex items-center justify-between">
        <div className="text-xl font-black text-[#0A2540] tracking-tight flex items-center gap-2">
           <Activity className="text-blue-600" />
           CLINIC<span className="text-cyan-500 font-normal">FLOW</span>
        </div>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-1 px-3">
        {items.map((group, i) => (
          <div key={i} className="mb-6">
            <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest px-3">
              {group.title}
            </div>
            {group.links.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-[13px] ${
                    isActive 
                      ? 'bg-blue-50/80 text-blue-700 shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100/50 flex flex-col gap-3 bg-white/50">
        <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 w-full transition-colors font-semibold text-[13px]">
          <Moon size={18} className="text-slate-400" />
          Dark Mode
        </button>
        <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 w-full transition-colors font-semibold text-[13px]">
          <LogOut size={18} className="text-red-400" />
          Logout
        </button>
        <div className="flex items-center gap-3 px-3 py-2">
           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
              <User size={16} />
           </div>
           <div>
             <div className="text-slate-800 text-sm font-bold leading-tight">{role === 'admin' ? 'Admin' : 'Patient'}</div>
             <div className="text-slate-400 text-[10px] font-medium leading-tight">{role === 'admin' ? 'System Administrator' : 'Verified User'}</div>
           </div>
        </div>
      </div>
    </aside>
  );
}
