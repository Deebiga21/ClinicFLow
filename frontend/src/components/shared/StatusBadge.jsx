import React from 'react';

export default function StatusBadge({ status, text }) {
  let colors = 'bg-slate-100 text-slate-600 border-slate-200';
  if (status === 'success' || status === 'TRAINED' || status === 'Normal') {
    colors = 'bg-emerald-50 text-emerald-600 border-emerald-100';
  } else if (status === 'warning' || status === 'Busy' || status === 'INSUFFICIENT DATA' || status === 'Moderate') {
    colors = 'bg-amber-50 text-amber-600 border-amber-100';
  } else if (status === 'error' || status === 'ERROR' || status === 'Critical') {
    colors = 'bg-rose-50 text-rose-600 border-rose-100';
  } else if (status === 'info' || status === 'Active') {
    colors = 'bg-blue-50 text-blue-600 border-blue-100';
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors}`}>
      {text || status}
    </span>
  );
}