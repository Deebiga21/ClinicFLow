import React, { useState, useEffect } from 'react';
import { useClinicWebSocket } from '../hooks/useClinicWebSocket';

const API_BASE = 'http://localhost:8000';

const PipelinePage = () => {
  const [pipelineState, setPipelineState] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [wsMessages, setWsMessages] = useState([]);
  
  const { lastEvent } = useClinicWebSocket();

  useEffect(() => {
    // Fetch initial state
    const loadState = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/pipeline/state`);
        const data = await res.json();
        setPipelineState(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadState();
  }, []);

  useEffect(() => {
    if (lastEvent) {
      setWsMessages(prev => [lastEvent, ...prev].slice(0, 10)); // keep last 10
      // Refresh state on any event
      fetch(`${API_BASE}/api/pipeline/state`)
        .then(r => r.json())
        .then(setPipelineState)
        .catch(console.error);
    }
  }, [lastEvent]);

  const runTestFlow = async () => {
    setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/pipeline/test-flow`);
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">ClinicFlow Core Pipeline & Workflow</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">1. The Base Pipeline Architecture</h3>
          <div className="bg-gray-800 text-green-400 p-4 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto shadow-inner">
{`PATIENT ACTION (e.g. Check-in)
       ↓
FASTAPI BACKEND
       ↓
ORCHESTRATION SERVICE (Transaction Safe)
       ↓
SQLITE DATABASE (Single Source of Truth)
       ↓
ML FEATURE ENGINEERING (Real-time DB query)
       ↓
XGBOOST ML MODELS (Prediction)
       ↓
WEBSOCKET BROADCAST
       ↓
FRONTEND (Nurse/Admin Dashboards Update)`}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">2. Live Clinic State</h3>
          {pipelineState ? (
            <ul className="space-y-3 text-gray-700">
              <li className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-semibold">Patients Waiting</span>
                <span className="text-xl font-bold text-blue-600">{pipelineState.waiting_count}</span>
              </li>
              <li className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-semibold">In Consultation</span>
                <span className="text-xl font-bold text-purple-600">{pipelineState.in_consultation_count}</span>
              </li>
              <li className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-semibold">ML Models Loaded</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                  {pipelineState.models_loaded ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </li>
            </ul>
          ) : (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-2">3. End-To-End Patient Journey Test</h3>
        <p className="text-gray-600 mb-6">
          This simulates a full patient workflow hitting the unified backend APIs. It checks the patient in, scores readiness, calls them next, begins the consultation, records the completion (creating ML feedback), and prescribes medication.
        </p>
        <button 
          onClick={runTestFlow}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md active:scale-95"
        >
          Execute Full Workflow Pipeline
        </button>

        {testResult && (
          <div className="mt-6 bg-blue-50 border border-blue-100 p-6 rounded-lg">
            <h4 className="text-lg font-bold text-blue-800 mb-4">Pipeline Execution Output:</h4>
            {testResult.error ? (
              <div className="p-4 bg-red-100 text-red-700 rounded-md font-mono">{JSON.stringify(testResult.error)}</div>
            ) : (
              <div className="space-y-4">
                {testResult.flow?.map((step, idx) => (
                  <div key={idx} className="bg-white p-4 rounded border shadow-sm">
                    <strong className="block text-gray-800 mb-2 uppercase text-sm tracking-wider">
                      Step {idx + 1}: {step?.event?.replace(/_/g, ' ')}
                    </strong>
                    <pre className="text-xs font-mono bg-gray-50 p-3 rounded overflow-x-auto text-gray-600">
                      {JSON.stringify(step, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center">
          <span className="relative flex h-3 w-3 mr-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          4. Live WebSocket Stream
        </h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm min-h-[250px] shadow-inner flex flex-col gap-2">
          {wsMessages.length === 0 && (
            <p className="text-gray-500 italic">Waiting for backend broadcasts... Try executing the pipeline above.</p>
          )}
          {wsMessages.map((msg, i) => (
            <div key={i} className="border-b border-gray-800 pb-2">
              <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> 
              <span className="text-blue-300 ml-2 font-bold">{msg.type}</span>
              <pre className="mt-1 pl-4 text-xs text-gray-300 whitespace-pre-wrap">{JSON.stringify(msg.data, null, 2)}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PipelinePage;
