import re

with open('frontend/src/pages/StaffChat.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''
import { useEffect, useState, useCallback } from 'react';
import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Clock } from 'lucide-react';
import { API_BASE } from '../config';

export default function StaffChat() {
  const { user } = useAuth();
  const [activePatient, setActivePatient] = useState(null);
  const [patients, setPatients] = useState([]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch(${API_BASE}/nurse/dashboard);
      const data = await res.json();
      setPatients(data.live_queue || []);
    } catch(e) {}
  }, []);

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 10000);
    return () => clearInterval(interval);
  }, [fetchPatients]);

  useEffect(() => {
    if (patients.length === 0) { setActivePatient(null); return; }
    const stillExists = patients.find(p => p.patient_id === activePatient?.patient_id);
    if (!stillExists && !activePatient) {
        setActivePatient(patients[0]);
    } else if (stillExists) {
        setActivePatient(stillExists);
    }
  }, [patients, activePatient]);

  return (
    <div className="font-sans h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A2540]">Patient Chat</h1>
        <p className="text-gray-500">Pick a patient from the active queue to message.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, flex: 1, minHeight: 0 }}>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-3 font-bold text-slate-700 text-xs tracking-wider uppercase">
            Active Queue ({patients.length})
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            {patients.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">No patients in the queue.</div>
            ) : patients.map(p => (
              <button 
                key={p.patient_id} 
                onClick={() => setActivePatient(p)}
                className={w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 }
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-[#0A2540] truncate pr-2">{p.patient_name}</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">#{p.token_number}</span>
                </div>
                <div className="flex justify-between items-center w-full text-xs">
                  <span className={px-2 py-0.5 rounded font-bold }>
                    {p.status}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock size={10} /> {p.predicted_wait || '-'}m
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          {activePatient ? (
            <>
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-3">
                <div className="bg-blue-100 text-blue-700 p-2 rounded-full">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A2540]">{activePatient.patient_name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    Token #{activePatient.token_number} • {activePatient.status}
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-hidden p-4">
                <ChatPanel channelId={patient_} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-3">
              <MessageSquare size={48} className="opacity-20" />
              <p>Select a patient to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'''

with open('frontend/src/pages/StaffChat.jsx', 'w', encoding='utf-8') as f:
    f.write(replacement.strip() + "\\n")
