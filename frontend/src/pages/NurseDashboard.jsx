import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Stethoscope, CheckCircle2, 
  AlertTriangle, Pill, User, Bell, Clock, Activity, MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useClinicWebSocket } from '../hooks/useClinicWebSocket';
import ChatPanel from '../components/ChatPanel';

export default function NurseDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isConnected, lastEvent } = useClinicWebSocket();

  const fetchData = async () => {
    try {
      const res = await api.get('/nurse/dashboard');
      setData(res);
    } catch (error) {
      console.error('Error fetching nurse dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for websocket updates
  useEffect(() => {
    if (lastEvent) {
      const relevantEvents = [
        'queue_updated', 'patient_readiness_updated', 
        'patient_called', 'consultation_completed'
      ];
      if (relevantEvents.includes(lastEvent.type)) {
        fetchData();
      }
    }
  }, [lastEvent]);

  const markReady = async (queueId) => {
     // call backend to mark ready
     // trigger patient_readiness_updated
     // for now just refetch
     fetchData();
  };

  if (loading || !data) {
    return <div className="flex h-screen items-center justify-center bg-[#f8fafc]"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>;
  }

  const { clinic_overview, live_queue, patient_readiness, medicine_alerts, recommendations } = data;
  
  // Find next patient
  const nextPatient = live_queue.length > 0 ? live_queue.find(q => q.status === 'Waiting') : null;
  const nextReadiness = nextPatient ? patient_readiness.find(pr => pr.patient_id === nextPatient.patient_id) : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      {/* Top Navigation Bar / Header Area */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-full">
            <User className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0A2540]">Nurse Dashboard</h1>
            <p className="text-sm text-gray-500">Manage patients, prepare for consultations, coordinate with doctors</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-[#0A2540]">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <p className="text-xs text-gray-500">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
            {isConnected ? 'Live Connection' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Welcome & KPIs */}
        <div>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">Good Morning, Nurse Sarah</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1 flex items-center gap-2">
                  <Users size={16} className="text-blue-500" /> Patients in Queue
                </p>
                <p className="text-3xl font-bold text-[#0A2540]">{clinic_overview.patients_checked_in || 0}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1 flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" /> Waiting for Nurse
                </p>
                <p className="text-3xl font-bold text-[#0A2540]">{clinic_overview.patients_waiting || 0}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1 flex items-center gap-2">
                  <Stethoscope size={16} className="text-indigo-500" /> With Doctor
                </p>
                <p className="text-3xl font-bold text-[#0A2540]">{clinic_overview.patients_consulting || 0}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" /> Completed Today
                </p>
                <p className="text-3xl font-bold text-[#0A2540]">{0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1: Preparation */}
          <div className="space-y-6">
            {/* Next Patient */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                  <UserCheck size={18} className="text-blue-500" /> Next Patient to Prepare
                </h3>
                <span className="text-xs text-blue-600 font-medium cursor-pointer">View All</span>
              </div>
              
              {nextPatient ? (
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xl border-4 border-blue-50">
                      <User size={24} />
                    </div>
                    <div>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">Token</span>
                      <p className="text-2xl font-black text-[#0A2540] leading-none mt-1">A-{nextPatient.queue_position}</p>
                      <p className="text-sm text-gray-500 mt-1">{nextPatient.patient_name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-6">
                    <div>
                      <p className="text-xs text-gray-500">Queue Position</p>
                      <p className="font-semibold text-[#0A2540]">{nextPatient.queue_position}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Predicted Wait</p>
                      <p className="font-semibold text-[#0A2540]">{nextPatient.predicted_wait || 8} min</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Readiness</p>
                      <p className="font-semibold text-blue-600">{nextReadiness ? nextReadiness.readiness_score : 100}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Missing Info</p>
                      <p className="font-semibold text-amber-600">{nextReadiness && nextReadiness.missing_information ? 'Yes' : 'None'}</p>
                    </div>
                  </div>
                  
                  <button className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm">
                    Prepare Patient
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <p>No patients currently waiting.</p>
                </div>
              )}
            </div>

            {/* Patient Readiness Donut */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-64">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                  <Activity size={18} className="text-blue-500" /> Patient Readiness
                </h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-gray-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-blue-500" strokeDasharray="70, 100" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-[#0A2540]">70%</span>
                  </div>
                </div>
                <p className="font-semibold text-[#0A2540]">Ready for Doctor</p>
                <p className="text-xs text-gray-500">(2 of 3)</p>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Live Queue & Alerts */}
          <div className="space-y-6">
            {/* Live Queue */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-96">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                  <Users size={18} className="text-blue-500" /> Live Queue
                </h3>
                <span className="text-xs text-blue-600 font-medium cursor-pointer">View All</span>
              </div>
              <div className="overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Token</th>
                      <th className="px-4 py-3 font-medium">Patient</th>
                      <th className="px-4 py-3 font-medium">Stage</th>
                      <th className="px-4 py-3 font-medium">Wait</th>
                    </tr>
                  </thead>
                  <tbody>
                    {live_queue.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-8">No queue data</td></tr>
                    ) : live_queue.map((q, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-[#0A2540]">A-{q.queue_position}</td>
                        <td className="px-4 py-3">{q.patient_name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${q.status === 'In Consultation' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-600">{q.predicted_wait || 15} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Operational Alerts */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-64">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" /> Operational Alerts
                </h3>
                <span className="text-xs text-blue-600 font-medium cursor-pointer">View All</span>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto">
                {recommendations.length > 0 ? recommendations.map((r, i) => (
                   <div key={i} className="flex gap-3 items-start p-3 bg-amber-50 rounded-lg border border-amber-100">
                     <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                     <div>
                       <p className="text-sm font-semibold text-gray-800">{r.message}</p>
                       <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleTimeString()} • {r.reason}</p>
                     </div>
                   </div>
                )) : null}
                {medicine_alerts.length > 0 ? medicine_alerts.map((m, i) => (
                   <div key={`med-${i}`} className="flex gap-3 items-start p-3 bg-red-50 rounded-lg border border-red-100">
                     <Pill size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                     <div>
                       <p className="text-sm font-semibold text-gray-800">Medicine stock low ({m.name})</p>
                       <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleTimeString()} • Pharmacy</p>
                     </div>
                   </div>
                )) : null}
                {recommendations.length === 0 && medicine_alerts.length === 0 && (
                   <p className="text-sm text-gray-400 text-center py-4">No active alerts.</p>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 3: Communication & AI */}
          <div className="space-y-6 flex flex-col h-full">
            {/* Nurse Chat */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-500" /> Nurse Chat
                </h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-1 bg-gray-200 rounded">Clinic Operations</span>
              </div>
              <div className="flex-1 relative">
                <ChatPanel channelId="clinic_operations" />
              </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px]">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
                  <BrainCircuit size={18} className="text-indigo-500" /> AI Assistant
                </h3>
              </div>
              <div className="flex-1 relative">
                <ChatPanel channelId="bot" />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
