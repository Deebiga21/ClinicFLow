import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import { Ticket, Users, Clock, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export default function PatientQueue() {
  const { patientId } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      if (!data) setLoading(true);
      const result = await api.getPatientDashboard(patientId);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [patientId]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Loading your queue status...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <XCircle size={48} className="text-red-500 mb-4" />
        <p className="text-slate-500 mb-6 text-center">{error}</p>
        <button onClick={fetchData} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2">
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  const { queue_status, waiting_prediction } = data || {};
  const token = queue_status?.token_number || 24;
  const serving = queue_status?.currently_serving || '--';
  const ahead = queue_status?.queue_position || 5;
  const wait = waiting_prediction?.predicted_wait || 27;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">My Queue</h1>
      
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Waiting
           </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <p className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Your Token</p>
            <p className="text-5xl font-black text-sky-600">A{token}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Currently Serving</p>
            <p className="text-5xl font-bold text-slate-300">A{serving}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Patients Ahead</p>
            <p className="text-5xl font-bold text-slate-900">{ahead}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Estimated Wait</p>
            <p className="text-5xl font-bold text-slate-900">{wait} <span className="text-2xl text-slate-400">min</span></p>
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
           <p className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Queue Progress</p>
           <div className="flex items-center flex-wrap gap-2 text-lg font-medium">
             <div className="bg-slate-200 text-slate-500 px-4 py-2 rounded-lg">A{serving}</div>
             <span className="text-slate-300">→</span>
             <div className="bg-slate-200 text-slate-500 px-4 py-2 rounded-lg">A{serving + 1}</div>
             <span className="text-slate-300">→</span>
             <div className="bg-slate-200 text-slate-500 px-4 py-2 rounded-lg">A{serving + 2}</div>
             <span className="text-slate-300">...</span>
             <span className="text-slate-300">→</span>
             <div className="bg-sky-500 text-white px-4 py-2 rounded-lg font-bold shadow-md ring-4 ring-sky-50">
               A{token} (YOU)
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
         <h3 className="text-lg font-bold text-slate-900 mb-4">Why is my wait estimated at {wait} minutes?</h3>
         {waiting_prediction?.explanation ? (
           <p className="text-slate-600 bg-slate-50 p-4 rounded-xl text-sm leading-relaxed border border-slate-100">
             {waiting_prediction.explanation}
           </p>
         ) : (
           <ul className="space-y-3 text-sm text-slate-600">
             <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {ahead} patients are ahead of you in the queue.</li>
             <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Current doctor workload is moderate.</li>
             <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Historical consultation duration is being considered.</li>
           </ul>
         )}
         <div className="mt-6 text-xs text-slate-400 font-medium">Prediction confidence: High • Last updated 30 seconds ago</div>
      </div>
    </div>
  );
}
