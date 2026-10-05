import React, { useEffect, useState } from 'react';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';
import { Users, Clock, ArrowRight, CheckCircle } from 'lucide-react';
const API_BASE = 'http://localhost:8000/api';

export default function NursePatientFlow() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useClinicWebSocket();

  const fetchQueue = async () => {
    try {
      // Create backend API for this or use an existing one. Let's assume we can query it.
      // We will create GET /api/operational/queue in the backend shortly
      const res = await fetch(`${API_BASE}/operational/queue`);
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [lastEvent]);

  const handleCallNext = async (queueId, doctorId) => {
    try {
      await fetch(`${API_BASE}/operational/call-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, queueId })
      });
      fetchQueue();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#0A2540]">Live Patient Queue</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-semibold uppercase tracking-wider">
              <th className="p-4">Token</th>
              <th className="p-4">Patient</th>
              <th className="p-4">Doctor</th>
              <th className="p-4">Status</th>
              <th className="p-4">Predicted Wait</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {queue.map(q => (
              <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-[#0A2540]">{q.token}</td>
                <td className="p-4 text-slate-700">{q.patient_name}</td>
                <td className="p-4 text-slate-600">{q.doctor_name}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    q.status === 'Waiting' ? 'bg-amber-100 text-amber-700' :
                    q.status === 'Ready' ? 'bg-blue-100 text-blue-700' :
                    q.status === 'In Consultation' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {q.status}
                  </span>
                </td>
                <td className="p-4 text-slate-600 font-medium">
                  {q.predicted_wait} min
                </td>
                <td className="p-4">
                  {q.status === 'Waiting' || q.status === 'Scheduled' || q.status === 'Ready' ? (
                    <button 
                      onClick={() => handleCallNext(q.id, q.doctor_id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded shadow-sm flex items-center gap-2 text-sm transition-colors"
                    >
                      Call Next <ArrowRight size={14} />
                    </button>
                  ) : q.status === 'In Consultation' ? (
                    <span className="text-purple-600 text-sm font-semibold flex items-center gap-1">
                      Consulting...
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm font-medium">Completed</span>
                  )}
                </td>
              </tr>
            ))}
            {queue.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">No patients currently in the live queue.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
