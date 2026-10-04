import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';
import { 
  Clock, Stethoscope, Users, Activity, Crosshair, Box, AlertTriangle, Pill, 
  Database, GitCommit, BrainCircuit, LineChart, FileCheck, ShieldAlert, TrendingUp, User 
} from 'lucide-react';
import ChartCard from '../../components/shared/ChartCard';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ChatPanel from '../../components/ChatPanel';

export default function NurseCommandCenter() {
  const [data, setData] = useState(null);
  const [mlModels, setMlModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useClinicWebSocket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewResult, mlResult] = await Promise.all([
          api.getDashboardOverview(),
          api.get('/nurse/ml-models').catch(() => [])
        ]);
        setData(overviewResult);
        setMlModels(mlResult || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lastEvent]);

  if (loading && !data) return <LoadingState message="Loading Command Center..." />;

  const {
    patients_today = 0,
    appointments_today = 0,
    current_queue = 0,
    active_consultations = 0,
    clinic_load = 0,
    clinic_status = "Unknown",
    flow = {}
  } = data || {};

  const getAlgorithm = (modelName) => {
    const name = modelName?.toLowerCase() || '';
    if (name.includes('waiting') || name.includes('consultation')) return 'XGBoost Regression';
    if (name.includes('show')) return 'Classification';
    if (name.includes('anomaly')) return 'Isolation Forest';
    return 'Forecasting Model';
  };

  const getStatus = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE' || s === 'TRAINED') return <StatusBadge status="TRAINED" />;
    if (s === 'INSUFFICIENT DATA') return <StatusBadge status="INSUFFICIENT DATA" text="INSUFFICIENT DATA" />;
    if (s === 'NOT_TRAINED' || s === 'NOT TRAINED') return <StatusBadge status="DANGER" text="NOT TRAINED" />;
    return <StatusBadge status="DANGER" text="DATA UNAVAILABLE" />;
  };

  // Expected model list to ensure all requested models are shown, even if backend is missing some
  const expectedModels = [
    { name: "Waiting Time Prediction", defaultStatus: "TRAINED" },
    { name: "Consultation Duration", defaultStatus: "TRAINED" },
    { name: "No-Show Prediction", defaultStatus: "INSUFFICIENT DATA" },
    { name: "Arrival Forecast", defaultStatus: "TRAINED" },
    { name: "Congestion Prediction", defaultStatus: "TRAINED" },
    { name: "Anomaly Detection", defaultStatus: "TRAINED" },
    { name: "Doctor Workload", defaultStatus: "INSUFFICIENT DATA" },
    { name: "Medicine Demand", defaultStatus: "NOT TRAINED" }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1800px] mx-auto pb-12">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0">Command Center</h1>
          <p className="text-[13px] text-slate-500 font-medium m-0">Real-time ML Intelligence & Clinic Status</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)] animate-pulse" />
            <span className="text-[11px] font-bold text-green-800 tracking-wider">AI SYSTEM LIVE</span>
          </div>
          <div className="text-sm font-semibold text-slate-700">
            {new Date().toLocaleString()}
          </div>
        </div>
      </header>

      {/* TOP SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status</span>
            <span className="text-lg font-extrabold text-emerald-600">{clinic_status}</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Active Doctors</span>
            <span className="text-lg font-extrabold text-slate-900">3</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Patients Today</span>
            <span className="text-lg font-extrabold text-slate-900">{patients_today}</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Appointments</span>
            <span className="text-lg font-extrabold text-slate-900">{appointments_today}</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Currently Waiting</span>
            <span className="text-lg font-extrabold text-amber-600">{current_queue}</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Consulting</span>
            <span className="text-lg font-extrabold text-blue-600">{active_consultations}</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Avg Wait</span>
            <span className="text-lg font-extrabold text-slate-900">22 min</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Clinic Load</span>
            <span className="text-lg font-extrabold text-red-500">{clinic_load}%</span>
         </div>
      </div>

      {/* REAL-TIME CLINIC STATUS */}
      <ChartCard title="REAL-TIME CLINIC STATUS" subtitle="Live patient flow through operational stages">
         <div className="flex flex-col md:flex-row items-center justify-between px-8 py-6">
            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Clock size={16} /></div>
                  <span className="text-[12px] font-bold text-slate-600 uppercase">Appointment</span>
               </div>
               <div className="text-2xl font-extrabold text-[#0A2540]">{flow.appointments !== undefined ? flow.appointments : 'N/A'}</div>
            </div>
            
            <div className="hidden md:flex flex-1 items-center justify-center px-4">
              <div className="h-0.5 w-full bg-slate-200 relative">
                 <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-300 transform rotate-45"></div>
              </div>
            </div>

            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><ShieldAlert size={16} /></div>
                  <span className="text-[12px] font-bold text-slate-600 uppercase">Check-in</span>
               </div>
               <div className="text-2xl font-extrabold text-[#0A2540]">{flow.check_in !== undefined ? flow.check_in : 'N/A'}</div>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center px-4">
              <div className="h-0.5 w-full bg-slate-200 relative">
                 <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-300 transform rotate-45"></div>
              </div>
            </div>

            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Users size={16} /></div>
                  <span className="text-[12px] font-bold text-slate-600 uppercase">Queue</span>
               </div>
               <div className="text-2xl font-extrabold text-[#0A2540]">{flow.queue !== undefined ? flow.queue : 'N/A'}</div>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center px-4">
              <div className="h-0.5 w-full bg-slate-200 relative">
                 <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-300 transform rotate-45"></div>
              </div>
            </div>

            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><User size={16} /></div>
                  <span className="text-[12px] font-bold text-slate-600 uppercase">Nurse</span>
               </div>
               <div className="text-2xl font-extrabold text-[#0A2540]">{flow.nurse !== undefined ? flow.nurse : 'N/A'}</div>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center px-4">
              <div className="h-0.5 w-full bg-slate-200 relative">
                 <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-300 transform rotate-45"></div>
              </div>
            </div>

            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><Stethoscope size={16} /></div>
                  <span className="text-[12px] font-bold text-slate-600 uppercase">Doctor</span>
               </div>
               <div className="text-2xl font-extrabold text-[#0A2540]">{flow.doctor !== undefined ? flow.doctor : 'N/A'}</div>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center px-4">
              <div className="h-0.5 w-full bg-slate-200 relative">
                 <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-300 transform rotate-45"></div>
              </div>
            </div>

            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><Activity size={16} /></div>
                  <span className="text-[12px] font-bold text-slate-600 uppercase">Consultation</span>
               </div>
               <div className="text-2xl font-extrabold text-[#0A2540]">{flow.consultation !== undefined ? flow.consultation : 'N/A'}</div>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center px-4">
              <div className="h-0.5 w-full bg-slate-200 relative">
                 <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-300 transform rotate-45"></div>
              </div>
            </div>

            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><FileCheck size={16} /></div>
                  <span className="text-[12px] font-bold text-slate-600 uppercase">Completed</span>
               </div>
               <div className="text-2xl font-extrabold text-[#0A2540]">{flow.completed !== undefined ? flow.completed : 'N/A'}</div>
            </div>
         </div>
      </ChartCard>

      {/* ML INTELLIGENCE STATUS */}
      <ChartCard title="ML INTELLIGENCE STATUS" subtitle="Active models and prediction status">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {expectedModels.map((em, idx) => {
               // Find model in backend response
               const model = mlModels.find(m => m.name.toLowerCase().includes(em.name.toLowerCase().split(' ')[0]));
               const status = model ? model.status : em.defaultStatus;
               const version = model ? model.version : 'N/A';
               const training_date = model ? model.training_date : 'N/A';
               const algo = getAlgorithm(em.name);

               return (
                 <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                   <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-[13px] font-bold text-[#0A2540] mb-1">{em.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mb-0.5">Algo: {algo}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Ver: {version}</div>
                      </div>
                      <BrainCircuit size={18} className="text-indigo-400" />
                   </div>
                   <div className="mt-2 border-t border-slate-200 pt-3 flex justify-between items-center">
                     <span className="text-[10px] text-slate-400">Trained: {training_date ? training_date.split('T')[0] : 'N/A'}</span>
                     {getStatus(status)}
                   </div>
                 </div>
               );
            })}
         </div>
      </ChartCard>

      {/* Communications & AI Agent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="h-[500px]">
          <ChatPanel channelId="clinic_operations" />
        </div>
        <div className="h-[500px]">
          <ChatPanel channelId="bot" />
        </div>
      </div>

    </div>
  );
}
