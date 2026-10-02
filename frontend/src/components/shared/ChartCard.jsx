import React from 'react';

export default function ChartCard({ title, subtitle, children, extraTopRight }) {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[20px] border border-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col h-full relative overflow-hidden">
      <div className="flex justify-between items-start mb-6 z-10 relative">
        <div>
          <h3 className="text-sm font-bold text-[#0A2540] uppercase tracking-wider">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
        </div>
        {extraTopRight && <div>{extraTopRight}</div>}
      </div>
      <div className="flex-1 w-full relative z-10">
        {children}
      </div>
    </div>
  );
}
