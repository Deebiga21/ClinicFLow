import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[18px] border border-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-start gap-4 transition-transform hover:-translate-y-1">
      {Icon && (
        <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
          <Icon size={20} />
        </div>
      )}
      <div className="flex-1">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</h4>
        <div className="text-2xl font-black text-[#0A2540] tracking-tight">{value !== undefined ? value : '--'}</div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {subtitle && <span className="text-xs font-medium text-slate-500">{subtitle}</span>}
            {trend && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}