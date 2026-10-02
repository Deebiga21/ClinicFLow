const fs = require('fs');

const fixMetric = `import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[18px] border border-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-start gap-4 transition-transform hover:-translate-y-1">
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
              <span className={\`text-[10px] font-bold px-1.5 py-0.5 rounded \${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}\`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}`;
fs.writeFileSync('src/components/shared/MetricCard.jsx', fixMetric, 'utf8');

const fixStatus = `import React from 'react';

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
    <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border \${colors}\`}>
      {text || status}
    </span>
  );
}`;
fs.writeFileSync('src/components/shared/StatusBadge.jsx', fixStatus, 'utf8');

let sidebar = fs.readFileSync('src/components/shared/Sidebar.jsx', 'utf8');
sidebar = sidebar.replace(/\\`/g, '`');
fs.writeFileSync('src/components/shared/Sidebar.jsx', sidebar, 'utf8');

let acc = fs.readFileSync('src/pages/admin/AdminCommandCenter.jsx', 'utf8');
acc = acc.replace(/\u202C/g, ''); 
acc = acc.replace(/\\`/g, '`');
fs.writeFileSync('src/pages/admin/AdminCommandCenter.jsx', acc, 'utf8');

let explain = fs.readFileSync('src/pages/admin/AdminExplainability.jsx', 'utf8');
explain = explain.replace(/> 5 people/g, '&gt; 5 people');
fs.writeFileSync('src/pages/admin/AdminExplainability.jsx', explain, 'utf8');
