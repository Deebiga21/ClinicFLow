import React from 'react';
import { Bell, User, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function Header({ title, subtitle, role }) {
  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white/40 backdrop-blur-md border-b border-white/60 sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-6">
        <div className="flex flex-col min-w-[200px]">
          <h2 className="text-xl font-bold text-[#0A2540] tracking-tight">{title}</h2>
          {subtitle && <p className="text-[13px] text-blue-600 font-medium">{subtitle}</p>}
        </div>
        
        <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 w-[300px] shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <Search size={16} className="text-slate-400 mr-2 flex-shrink-0" />
          <input type="text" placeholder="Search patients, tokens, medicines..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400" />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold tracking-wide border border-emerald-100 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          System Operational
        </div>
        
        <div className="hidden lg:flex flex-col text-right">
          <span className="text-slate-800 font-bold text-xs">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} &nbsp; {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-[10px] font-medium text-slate-500">Last data update: 2 min ago</span>
        </div>
        
        <Link to="/nurse/notifications" className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors bg-white rounded-full shadow-sm border border-slate-100">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        </Link>

        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
           <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shadow-inner">
              <User size={18} />
           </div>
           <div className="hidden sm:block">
             <div className="text-slate-800 text-sm font-bold leading-tight">{role === 'admin' || role === 'nurse' ? 'Staff' : 'Patient'}</div>
             <div className="text-slate-400 text-[10px] font-medium leading-tight">{role === 'admin' || role === 'nurse' ? 'System Administrator' : 'Verified User'}</div>
           </div>
        </div>
      </div>
    </header>
  );
}
