import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50/30 rounded-xl border border-dashed border-rose-200 h-full min-h-[200px]">
      <AlertTriangle size={32} className="text-rose-500 mb-3" />
      <h4 className="text-sm font-bold text-slate-800">Connection Interrupted</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-xs">{error?.message || 'Unable to load intelligence module.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-100 hover:bg-rose-200 px-4 py-2 rounded-lg transition-colors">
          <RefreshCcw size={14} /> Retry Connection
        </button>
      )}
    </div>
  );
}
