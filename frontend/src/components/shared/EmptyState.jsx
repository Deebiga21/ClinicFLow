import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function EmptyState({ icon, title, message, description }) {
  const IconComponent = icon || AlertCircle;
  const isElement = React.isValidElement(icon);
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 w-full h-full min-h-[200px]">
      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
        {isElement ? icon : <IconComponent size={24} />}
      </div>
      <h4 className="text-sm font-bold text-slate-700">{title || 'No Data Available'}</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{message || description || 'There is currently no data to display in this section.'}</p>
    </div>
  );
}
