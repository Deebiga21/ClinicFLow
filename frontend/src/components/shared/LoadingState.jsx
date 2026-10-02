import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function LoadingState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]">
      <RefreshCw size={28} className="animate-spin text-blue-500 mb-4" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{message || 'Loading Intelligence...'}</p>
    </div>
  );
}
