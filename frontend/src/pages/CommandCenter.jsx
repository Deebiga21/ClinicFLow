import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import {
  Activity, AlertTriangle, ArrowRight, Brain, Clock, ChevronRight,
  TrendingUp, Users, Zap, CheckCircle2, ShieldAlert, Sparkles, Box,
  MessageSquare, Sliders, Battery, FileText
} from 'lucide-react';

export default function CommandCenter() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/dashboard/overview')
      .then(r => r.json())
      .then(d => {
        setDashboardData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error('Failed to load dashboard:', e);
        setLoading(false);
      });
  }, []);

  return (
    <AppShell>
      {/* 3. TOP HEADER */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0">Clinic Intelligence</h1>
          <p className="text-[13px] text-slate-500 font-medium m-0">Real-time predictive healthcare operations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)] pulse-dot" />
            <span className="text-[11px] font-bold text-green-800 tracking-wider">AI SYSTEM LIVE</span>
          </div>
          <div className="text-sm font-semibold text-slate-700">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* 4. HERO AI INTELLIGENCE CARD */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-2xl mb-6 shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 grid grid-cols-2 gap-8">
          <div>
            <div className="text-[11px] font-bold tracking-[0.08em] text-sky-400 mb-2 flex items-center gap-1.5">
              <Sparkles size={14} /> WHAT WILL HAPPEN NEXT?
            </div>
            <h2 className="text-[28px] font-extrabold leading-tight mb-6">
              Clinic congestion is predicted to increase within 32 minutes.
            </h2>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div><div className="text-[11px] text-slate-400">Predicted peak</div><div className="text-lg font-bold">11:30 AM</div></div>
              <div><div className="text-[11px] text-slate-400">Expected queue</div><div className="text-lg font-bold">18 patients</div></div>
              <div><div className="text-[11px] text-slate-400">Expected wait</div><div className="text-lg font-bold">41 min</div></div>
              <div><div className="text-[11px] text-slate-400">Confidence</div><div className="text-lg font-bold text-sky-400">89%</div></div>
            </div>
            <button onClick={() => navigate('/recommendations')} className="bg-sky-500 text-white border-none px-5 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors hover:bg-sky-600 btn-hover-cyan">
              View AI Recommendation <ArrowRight size={16} />
            </button>
          </div>
          <div className="flex flex-col justify-center">
            {/* Visual prediction timeline */}
            <div className="flex justify-between text-slate-400 text-[11px] font-semibold mb-2">
              <span>NOW</span><span>30 MIN</span><span>60 MIN</span><span>90 MIN</span>
            </div>
            <div className="h-10 w-full relative border-b border-white/10">
              <svg width="100%" height="40" preserveAspectRatio="none">
                <path d="M 0,35 Q 25%,35 50%,20 T 100%,5" fill="none" stroke="#38bdf8" strokeWidth="3" />
                <circle cx="50%" cy="20" r="4" fill="#38bdf8" />
              </svg>
            </div>
            <div className="flex justify-center mt-3">
              <div className="text-[11px] text-red-500 flex items-center gap-1 font-semibold">
                <TrendingUp size={12} /> congestion rising
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 5. LIVE CLINIC STATUS */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Patients Today', value: dashboardData?.patients_today ?? '128', icon: Users, color: '#0ea5e9', trend: '+12%' },
          { label: 'Active Consults', value: dashboardData?.active_consultations ?? '6', icon: Activity, color: '#22c55e', trend: 'Stable' },
          { label: 'Current Waiting', value: dashboardData?.current_waiting ?? '14', icon: Users, color: '#f59e0b', trend: 'Rising' },
          { label: 'Average Wait', value: `${dashboardData?.average_wait ?? 23} min`, icon: Clock, color: '#64748b', trend: '-4m' },
          { label: 'Clinic Load', value: `${dashboardData?.clinic_load ?? 74}%`, icon: Battery, color: '#ef4444', trend: 'High' },
          { label: 'Bottleneck Risk', value: dashboardData?.bottleneck_risk?.severity ?? 'Med', icon: AlertTriangle, color: '#f97316', trend: 'Watch' }
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-slate-500">
              <stat.icon size={14} color={stat.color} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
            <div className="text-[11px] font-semibold mt-1" style={{ color: stat.color }}>{stat.trend}</div>
          </div>
        ))}
      </div>

      {/* 6. PATIENT JOURNEY MAP */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
          PATIENT JOURNEY MAP
        </h3>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-[30px] left-10 right-10 h-0.5 bg-slate-200 z-0" />
          {[
            { stage: 'Arrival', pts: 12, time: '2m', status: 'Stable', color: '#10b981' },
            { stage: 'Registration', pts: 4, time: '5m', status: 'Stable', color: '#10b981' },
            { stage: 'Nurse', pts: 8, time: '12m', status: 'Busy', color: '#f59e0b' },
            { stage: 'Doctor', pts: 14, time: '24m', status: '⚠ BOTTLENECK', color: '#ef4444', isBottleneck: true },
            { stage: 'Diagnostics', pts: 3, time: '8m', status: 'Stable', color: '#10b981' },
            { stage: 'Pharmacy', pts: 5, time: '10m', status: 'Stable', color: '#10b981' },
            { stage: 'Exit', pts: '-', time: '-', status: '-', color: '#94a3b8' }
          ].map((node, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center w-[100px]">
              <div className="w-4 h-4 rounded-full border-4 border-white shadow-[0_0_0_1px_#e2e8f0] mb-3" style={{ background: node.color }} />
              <div className="text-[11px] font-bold text-slate-700 uppercase">{node.stage}</div>
              {node.pts !== '-' && (
                <div className={`bg-slate-50 border rounded-lg p-2 mt-2 w-full text-center ${node.isBottleneck ? 'border-red-300' : 'border-slate-200'}`}>
                  <div className="text-sm font-extrabold text-slate-900">{node.pts} pts</div>
                  <div className="text-[11px] text-slate-500">{node.time} avg</div>
                  <div className="text-[10px] font-bold mt-1" style={{ color: node.color }}>{node.status}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg mt-6 inline-flex items-center gap-2">
          <Brain size={16} className="text-red-500" />
          <span className="text-[13px] font-semibold text-red-800">AI predicts Doctor Consultation as the next bottleneck.</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* 7. PATIENT JOURNEY PREDICTION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-5">Patient Journey Intelligence</h3>
          <div className="text-xs font-bold text-sky-500 mb-4">Patient #108</div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-[13px]"><span className="text-slate-500">Arrival</span><span className="text-emerald-500 font-semibold">✓ Completed</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-slate-500">Registration</span><span className="text-emerald-500 font-semibold">✓ Completed</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-slate-500">Nurse</span><span className="text-emerald-500 font-semibold">✓ Completed</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-slate-900 font-semibold">Doctor</span><span className="text-sky-500 font-semibold">→ 14 min predicted</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-slate-900 font-semibold">Diagnostics</span><span className="text-sky-500 font-semibold">→ 18 min predicted</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-slate-900 font-semibold">Pharmacy</span><span className="text-sky-500 font-semibold">→ 8 min predicted</span></div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">Estimated total visit</div>
              <div className="text-lg font-extrabold text-slate-900">46 minutes</div>
            </div>
            <div className="bg-green-50 text-green-800 px-2.5 py-1 rounded-full text-[11px] font-bold">
              Journey delay risk: LOW
            </div>
          </div>
        </div>

        {/* 14. PRE-CONSULTATION READINESS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-5">Next Consultation Readiness</h3>
          <div className="text-[11px] font-bold text-slate-400 mb-1">NEXT PATIENT</div>
          <div className="text-2xl font-extrabold text-slate-900 mb-6">Patient #108</div>
          
          <div className="mb-4">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
              <span>Information Completeness</span><span>91%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-[91%] bg-emerald-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-auto mb-auto">
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">Predicted Consultation</div>
              <div className="text-base font-bold text-slate-900">14 min</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">Complexity</div>
              <div className="text-base font-bold text-amber-500">Medium</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-6">
            <div className="bg-green-50 text-green-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Handoff Ready
            </div>
            <button onClick={() => navigate('/consultation')} className="bg-white border border-slate-300 px-4 py-1.5 rounded-lg text-[13px] font-semibold text-slate-900 cursor-pointer flex-1 text-center hover:bg-slate-50 transition-colors">
              View Consultation Brief
            </button>
          </div>
        </div>
      </div>

      {/* 8. AI PREDICTION CARDS */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/ml-analytics')}>
          <div className="text-2xl font-extrabold text-slate-900">24 min</div>
          <div className="text-[13px] text-slate-500 font-semibold mb-4">Predicted waiting time</div>
          <div className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
             ↓ 18% vs historical avg
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Confidence: 91%</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/doctors')}>
          <div className="text-2xl font-extrabold text-slate-900">16 min</div>
          <div className="text-[13px] text-slate-500 font-semibold mb-4">Predicted consult duration</div>
          <div className="text-xs text-red-500 font-semibold">Doctor workload: High</div>
          <div className="text-[11px] text-slate-400 mt-1">Confidence: 87%</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/congestion')}>
          <div className="text-2xl font-extrabold text-slate-900">+18 patients</div>
          <div className="text-[13px] text-slate-500 font-semibold mb-4">Expected next 2 hours</div>
          <div className="text-xs text-amber-500 font-semibold">Peak: 11:30 AM</div>
          <div className="text-[11px] text-slate-400 mt-1">Confidence: 84%</div>
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-6 mb-8">
        {/* 11. AI RECOMMENDATION PANEL */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-sky-500" /> AI RECOMMENDED ACTIONS
          </h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2 text-[13px] font-bold text-red-700 mb-3">
              <AlertTriangle size={16} /> Predicted congestion at 11:30 AM
            </div>
            <div className="text-[15px] font-semibold text-slate-900 mb-4">
              Redistribute 2 flexible appointments to 12:30 PM.
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-lg flex gap-6 mb-5">
              <div>
                <div className="text-[11px] text-slate-500 font-semibold mb-1">Expected impact (Wait time)</div>
                <div className="text-sm font-bold text-emerald-500">38 min → 24 min</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-semibold mb-1">Expected impact (Peak queue)</div>
                <div className="text-sm font-bold text-emerald-500">21 → 14</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="bg-sky-500 text-white border-none px-4 py-2 rounded-md text-[13px] font-semibold cursor-pointer hover:bg-sky-600 transition-colors">Apply Recommendation</button>
              <button className="bg-white text-slate-500 border border-slate-300 px-4 py-2 rounded-md text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">Dismiss</button>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button onClick={() => navigate('/recommendations')} className="bg-transparent border-none text-sky-500 text-[13px] font-semibold cursor-pointer flex items-center gap-1 hover:text-sky-600">
              View all recommendations <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* 12. WHAT-IF SIMULATION */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
            <Box size={20} className="text-indigo-500" /> WHAT IF?
          </h2>
          <p className="text-xs text-slate-500 mb-5">Test operational decisions before making them.</p>
          
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-200">
              <span className="text-[13px] font-semibold text-slate-700">Doctors</span>
              <span className="text-sm font-bold font-mono">− 3 +</span>
            </div>
            <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-200">
              <span className="text-[13px] font-semibold text-slate-700">Avg Consult</span>
              <span className="text-sm font-bold font-mono">− 15m +</span>
            </div>
          </div>
          
          <button onClick={() => navigate('/digital-twin')} className="w-full bg-indigo-500 text-white border-none py-2.5 rounded-lg text-sm font-semibold cursor-pointer mb-5 hover:bg-indigo-600 transition-colors">
            Run Simulation
          </button>
          
          <div className="bg-white border border-indigo-200 rounded-lg p-3">
            <div className="text-[10px] font-extrabold text-indigo-500 mb-2 uppercase tracking-wider">SIMULATED RESULT</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-slate-500 font-semibold">Wait Time</div>
                <div className="font-bold">38m → <span className="text-emerald-500">21m</span></div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">Peak Queue</div>
                <div className="font-bold">21 → <span className="text-emerald-500">13</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* 13. DOCTOR WORKLOAD INTELLIGENCE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/doctors')}>
          <h3 className="text-sm font-bold text-slate-900 mb-4">Doctor Workload Forecast</h3>
          <div className="flex flex-col gap-3">
            <div className="border-l-4 border-red-500 pl-3">
              <div className="text-[13px] font-bold text-slate-900">Dr. A</div>
              <div className="text-xs text-slate-500">Cur: 72% | Pred: <span className="font-bold text-red-500">89%</span></div>
              <div className="text-[11px] text-red-500 font-semibold mt-0.5">⚠ Overload Risk</div>
            </div>
            <div className="border-l-4 border-emerald-500 pl-3">
              <div className="text-[13px] font-bold text-slate-900">Dr. B</div>
              <div className="text-xs text-slate-500">Cur: 54% | Pred: 61%</div>
              <div className="text-[11px] text-emerald-500 font-semibold mt-0.5">Stable</div>
            </div>
          </div>
        </div>

        {/* 10. RESOURCE INTELLIGENCE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Clinic Resource Readiness</h3>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Doctors', val: 86, color: 'bg-red-500' },
              { label: 'Nurses', val: 71, color: 'bg-amber-500' },
              { label: 'Rooms', val: 79, color: 'bg-amber-500' },
              { label: 'Diagnostics', val: 88, color: 'bg-red-500' }
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>{r.label}</span><span>{r.val}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full w-[${r.val}%] ${r.color}`} style={{ width: `${r.val}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-red-700 font-semibold mt-3 bg-red-50 p-2 rounded-md">
            Diagnostics may reach critical capacity at 12:10 PM.
          </div>
        </div>

        {/* 15. ANOMALY ALERT */}
        <div className="bg-white border border-red-300 rounded-2xl p-6 shadow-[0_4px_10px_rgba(239,68,68,0.1)] flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/anomalies')}>
          <div className="flex items-center gap-2 mb-4 text-red-500 font-extrabold text-sm">
            <Zap size={18} /> Operational Anomaly Detected
          </div>
          <div className="text-[15px] font-bold text-slate-900 mb-3">Unusually long consultation</div>
          <div className="grid grid-cols-2 gap-2 mb-4 text-[13px]">
            <div>
              <div className="text-slate-500">Expected</div>
              <div className="font-semibold text-slate-900">16 min</div>
            </div>
            <div>
              <div className="text-slate-500">Current</div>
              <div className="font-semibold text-red-500">39 min</div>
            </div>
          </div>
          <div className="bg-red-50 text-red-700 px-2.5 py-1.5 rounded-md text-xs font-bold inline-block mb-auto self-start">
            Anomaly Score: High
          </div>
          <button className="mt-5 w-full bg-red-500 text-white border-none py-2 rounded-md text-[13px] font-semibold cursor-pointer hover:bg-red-600 transition-colors">
            Investigate →
          </button>
        </div>
      </div>

      {/* 16. CLOSED-LOOP AI STATUS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-6 text-white text-center">
        <h3 className="text-lg font-extrabold mb-2 text-sky-400">ClinicFlow AI Intelligence Loop</h3>
        <p className="text-[13px] text-slate-400 mb-8">Every completed patient journey becomes feedback for improving future predictions.</p>
        
        <div className="flex justify-center items-center gap-3 flex-wrap">
          {['OBSERVE', 'PREDICT', 'EXPLAIN', 'RECOMMEND', 'SIMULATE', 'ACT', 'LEARN'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-3">
              <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-full text-xs font-bold text-slate-50 shadow-[0_0_10px_rgba(56,189,248,0.1)]">
                {step}
              </div>
              {i < arr.length - 1 && <ArrowRight size={14} className="text-slate-600" />}
            </div>
          ))}
        </div>
      </div>

      {/* 17. ML HEALTH STATUS */}
      <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl px-6 py-3">
        <div className="text-[11px] font-extrabold text-slate-500 tracking-wider">AI MODEL STATUS</div>
        <div className="flex gap-6 text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> Waiting Time</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> Consultation</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> Demand</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> Congestion</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> Anomaly</span>
        </div>
      </div>
      
    </AppShell>
  );
}
