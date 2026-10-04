import React, { useState, useEffect } from 'react';
import { Users, Clock, ArrowRight, AlertTriangle, CheckCircle, Activity, BrainCircuit, ActivitySquare, AlertCircle, BarChart2 } from 'lucide-react';
import MetricCard from '../../components/shared/MetricCard';
import ChartCard from '../../components/shared/ChartCard';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';
import { api } from '../../services/api';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar
} from 'recharts';

export default function NursePatientFlow() {
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [liveQueue, setLiveQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { lastEvent, socket } = useClinicWebSocket();
  const isConnected = socket && socket.readyState === WebSocket.OPEN;

  const fetchData = async () => {
    try {
      const [flowDataRes, chartRes, queueRes, docRes] = await Promise.all([
        api.get('/nurse/patient-flow/summary').catch(() => ({})),
        api.get('/nurse/patient-flow/chart').catch(() => []),
        api.get('/nurse/patient-flow/live-queue').catch(() => []),
        api.get('/nurse/patient-flow/doctor-flow').catch(() => [])
      ]);
      
      // Because api.get strips the {data: ...} wrapper, the responses are the actual data
      setData(flowDataRes.data !== undefined ? flowDataRes.data : flowDataRes);
      setChartData(chartRes.data !== undefined ? chartRes.data : (Array.isArray(chartRes) ? chartRes : []));
      setLiveQueue(queueRes.data !== undefined ? queueRes.data : (Array.isArray(queueRes) ? queueRes : []));
      setDoctors(docRes.data !== undefined ? docRes.data : (Array.isArray(docRes) ? docRes : []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastEvent]);

  if (loading) return <LoadingState message="Loading Patient Flow Data..." />;
  if (!data) return <EmptyState title="DATA UNAVAILABLE" description="Could not load patient flow data." />;

  const pl = data.pipeline || {};
  const journeyStages = [
    { key: 'Appointment', val: pl['Appointment'] ?? 0 },
    { key: 'Check-in', val: pl['Check-in'] ?? 0 },
    { key: 'Queue', val: pl['Queue'] ?? 0 },
    { key: 'Nurse', val: pl['Nurse'] ?? 0 },
    { key: 'Doctor', val: pl['Doctor'] ?? 0 },
    { key: 'Consultation', val: pl['Consultation'] ?? 0 },
    { key: 'Prescription', val: pl['Prescription'] ?? 0 },
    { key: 'Medication', val: pl['Medication'] ?? 0 },
    { key: 'Follow-up', val: pl['Follow-up'] ?? 0 },
    { key: 'Completed', val: pl['Completed'] ?? 0 }
  ];

  // Auto Bottleneck detection
  const bottleneckVal = Math.max(pl['Queue']||0, pl['Nurse']||0, pl['Consultation']||0);
  const bottleneckStage = Object.keys(pl).find(k => pl[k] === bottleneckVal && ['Queue','Nurse','Consultation'].includes(k));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0A2540]">Patient Flow Intelligence</h1>
          <p className="text-slate-500 font-medium">Real-time patient movement, bottleneck detection and predictive care-flow analysis</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`text-xs font-bold ${isConnected ? 'text-emerald-600' : 'text-red-600'} uppercase tracking-widest`}>
              {isConnected ? 'AI System Live' : 'OFFLINE — Reconnecting...'}
            </span>
          </div>
          <div className="text-xs text-slate-400">Last data update: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <MetricCard title="Patients Today" value={data.patientsToday ?? "0"} color="blue" />
        <MetricCard title="Checked In" value={data.checkedIn ?? "0"} color="emerald" />
        <MetricCard title="Waiting" value={data.currentlyWaiting ?? "0"} color="amber" />
        <MetricCard title="Consulting" value={data.currentlyConsulting ?? "0"} color="purple" />
        <MetricCard title="Completed" value={data.completed ?? "0"} color="gray" />
        <MetricCard title="Avg Wait" value={`${data.avgWait ?? 0} min`} color="rose" />
        <MetricCard title="Avg Consult" value={`${data.avgConsultation ?? 0} min`} color="indigo" />
        <MetricCard title="Flow Velocity" value={`${data.flowVelocity ?? 0}/hr`} color="cyan" />
      </div>

      {/* MAIN PATIENT FLOW PIPELINE */}
      <ChartCard title="LIVE PATIENT JOURNEY">
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center min-w-max px-2">
            {journeyStages.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[110px] shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.key}</span>
                  <span className="text-3xl font-black text-[#0A2540] my-2">{s.val}</span>
                </div>
                {i < journeyStages.length - 1 && <ArrowRight className="w-5 h-5 text-slate-300 mx-2 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BOTTLENECK ANALYSIS */}
        <div className="lg:col-span-1 space-y-6">
          <ChartCard title="WHERE IS THE CLINIC SLOWING DOWN?">
            {bottleneckVal > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 relative overflow-hidden">
                <AlertTriangle className="absolute -right-4 -bottom-4 text-amber-200/50 w-32 h-32" />
                <h3 className="font-bold text-amber-800 mb-2 relative z-10 flex items-center gap-2">
                  <AlertCircle size={18} /> 
                  {bottleneckStage} Bottleneck
                </h3>
                <p className="text-sm text-amber-900 relative z-10 mb-4">
                  <strong>{bottleneckStage}</strong> stage is currently accumulating patients ({bottleneckVal} waiting).
                </p>
                <div className="text-xs text-amber-700 bg-white/60 p-3 rounded-lg relative z-10">
                  <span className="font-bold uppercase tracking-wider block mb-1">Possible reasons (derived):</span>
                  {bottleneckStage === 'Queue' ? '• High arrival rate vs service rate\n• Limited doctor capacity' : '• Operational delay at specific stage'}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 text-center py-6">No bottlenecks detected. Flow is optimal.</div>
            )}
            
            <div className="mt-6 space-y-4">
               {['Queue', 'Nurse', 'Doctor', 'Consultation'].map(k => (
                 <div key={k}>
                   <div className="flex justify-between text-xs mb-1 font-bold">
                     <span className="text-slate-600 uppercase tracking-wider">{k}</span>
                     <span className="text-slate-700">{pl[k] || 0} patients</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2">
                     <div className={`h-2 rounded-full ${pl[k] > 5 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (pl[k]||0)*10)}%` }}></div>
                   </div>
                 </div>
               ))}
            </div>
          </ChartCard>
          
          {/* WAITING TIME INTELLIGENCE */}
          <ChartCard title="WAITING TIME INTELLIGENCE">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <div className="text-[10px] font-bold text-slate-500 uppercase">Current Average Wait</div>
                   <div className="text-2xl font-black text-slate-800">{data.avgWait ?? 0} min</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                   <div className="text-[10px] font-bold text-indigo-500 uppercase">Predicted Wait</div>
                   <div className="text-2xl font-black text-indigo-700">{data.predictedWait ?? 0} min</div>
                   <div className="mt-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-600 uppercase">
                     Model: XGBoost v1.0
                   </div>
                </div>
             </div>
             
             <div className="mt-6">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">FLOW DRIVER ANALYSIS</h4>
                <div className="text-sm text-slate-500 italic">Explainability (SHAP) is not currently available for this prediction.</div>
             </div>
          </ChartCard>
          
          {/* ALERTS */}
          <ChartCard title="PATIENT FLOW ALERTS">
            <div className="space-y-3">
              {data.alerts && data.alerts.length > 0 ? data.alerts.map((a, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm flex gap-3 ${a.type === 'danger' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold">{a.message}</div>
                    <div className="text-[10px] opacity-75 mt-1">{new Date(a.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-slate-500 text-center py-4 font-medium">No active patient-flow alerts.</div>
              )}
            </div>
          </ChartCard>
        </div>

        {/* CHARTS AND LARGE PANELS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PATIENT FLOW - TODAY */}
          <ChartCard title="PATIENT FLOW OVER TIME">
            {chartData && chartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="arrivals" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Arrivals" />
                    <Area type="monotone" dataKey="queueing" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="Queue Size" />
                    <Area type="monotone" dataKey="consulting" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="Consultations" />
                    <Area type="monotone" dataKey="completed" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="NO DATA" description="Chart data unavailable for today." />
            )}
          </ChartCard>
          
          {/* LIVE QUEUE TABLE */}
          <ChartCard title="LIVE QUEUE">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-bold">Token</th>
                    <th className="pb-3 font-bold">Patient</th>
                    <th className="pb-3 font-bold">Entered At</th>
                    <th className="pb-3 font-bold">Ahead</th>
                    <th className="pb-3 font-bold">Pred. Wait</th>
                    <th className="pb-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveQueue && liveQueue.length > 0 ? liveQueue.map((q, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="py-3 font-bold text-[#0A2540]">A-{q.token_number}</td>
                      <td className="py-3 text-slate-600">{q.patient_name || q.patient_id.substring(0,8)}</td>
                      <td className="py-3 text-slate-500">{new Date(q.entered_queue_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td className="py-3 text-slate-700 font-medium">{q.queue_position}</td>
                      <td className="py-3 text-indigo-600 font-bold">{q.estimated_wait_minutes ? Math.round(q.estimated_wait_minutes) + ' min' : '--'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          q.status === 'Waiting' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-slate-500">No active queue</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>
          
          {/* FLOW BY DOCTOR */}
          <ChartCard title="FLOW BY DOCTOR">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {doctors.map((d, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                   <div className="font-bold text-slate-800 text-lg mb-2">{d.name}</div>
                   <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-slate-500">Avg Consult:</div>
                      <div className="font-medium text-right">{d.average_consultation_duration} min</div>
                      <div className="text-slate-500">Specialty:</div>
                      <div className="font-medium text-right text-xs mt-0.5 truncate">{d.specialization}</div>
                   </div>
                </div>
              ))}
              {doctors.length === 0 && <div className="text-slate-500">No active doctors.</div>}
            </div>
          </ChartCard>

        </div>
      </div>
      
      {/* TODAY'S SUMMARY */}
      <div className="bg-[#0A2540] rounded-xl p-6 text-white shadow-lg">
         <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart2 size={20}/> TODAY'S FLOW SUMMARY</h3>
         <div className="flex flex-wrap gap-8">
            <div>
               <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Total Arrivals</div>
               <div className="text-2xl font-black">{data.patientsToday ?? 0}</div>
            </div>
            <div>
               <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Completed</div>
               <div className="text-2xl font-black">{data.completed ?? 0}</div>
            </div>
            <div>
               <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Avg Wait</div>
               <div className="text-2xl font-black">{data.avgWait ?? 0} min</div>
            </div>
            <div>
               <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Flow Velocity</div>
               <div className="text-2xl font-black">{data.flowVelocity ?? 0}/hr</div>
            </div>
         </div>
      </div>
    </div>
  );
}
