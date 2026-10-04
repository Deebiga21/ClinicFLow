import React, { useState, useEffect } from 'react';
import ChartCard from '../../components/shared/ChartCard';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';
import { Cpu, Play, AlertCircle, Settings2, Users, Clock, Calendar, Activity, Zap } from 'lucide-react';
import { api } from '../../services/api';

const NurseDigitalTwin = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentState, setCurrentState] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);

  const [controls, setControls] = useState({
    numDoctors: 3,
    arrivalRate: 15,
    avgConsultationDuration: 20,
    appointmentCapacity: 100,
    workingHours: 8
  });

  useEffect(() => {
    fetchCurrentState();
  }, []);

  const fetchCurrentState = async () => {
    try {
      setInitialLoading(true);
      const response = await api.getCurrentClinicState().catch(() => null);
      if (response) {
        setCurrentState(response);
        // Pre-fill controls with actual state if available
        setControls({
          numDoctors: response.numDoctors || 3,
          arrivalRate: response.arrivalRate || 15,
          avgConsultationDuration: response.avgConsultationDuration || 20,
          appointmentCapacity: response.appointmentCapacity || 100,
          workingHours: response.workingHours || 8
        });
      } else {
        setCurrentState(null);
      }
    } catch (err) {
      console.error('Failed to fetch current clinic state', err);
      setCurrentState(null);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleControlChange = (e) => {
    const { name, value } = e.target;
    setControls(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleRunSimulation = async () => {
    try {
      setLoading(true);
      const response = await api.runDigitalTwinSimulation(controls).catch(() => null);
      if (response) {
        setSimulationResult(response);
      } else {
        setSimulationResult({ unavailable: true });
      }
    } catch (err) {
      console.error('Simulation failed', err);
      setSimulationResult({ unavailable: true });
    } finally {
      setLoading(false);
    }
  };

  const MetricComparison = ({ label, current, simulated, unit = "" }) => {
    if (current === undefined || current === null || current === "UNAVAILABLE") {
      return (
        <div className="flex flex-col py-3 border-b border-gray-100 last:border-0">
          <span className="text-sm font-medium text-gray-500 mb-1">{label}</span>
          <div className="text-sm text-gray-400">DATA UNAVAILABLE</div>
        </div>
      );
    }

    const diff = typeof simulated === 'number' && typeof current === 'number' 
      ? simulated - current 
      : 0;
      
    const isPositive = diff > 0;
    const isNegative = diff < 0;
    const isNeutral = diff === 0;

    return (
      <div className="flex flex-col py-3 border-b border-gray-100 last:border-0">
        <span className="text-sm font-medium text-gray-500 mb-2">{label}</span>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Current</span>
            <span className="text-lg font-semibold text-gray-700">{current} {unit}</span>
          </div>
          <div className="mx-4 text-gray-300">
             <Zap className="w-4 h-4" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-indigo-400 font-medium">Simulated</span>
            <span className="text-lg font-bold text-indigo-700">{simulated !== undefined ? `${simulated} ${unit}` : "N/A"}</span>
          </div>
        </div>
        {simulated !== undefined && !isNeutral && (
          <div className={`mt-2 text-xs font-medium text-right ${isPositive ? (label.includes('Utilization') || label.includes('Throughput') ? 'text-emerald-600' : 'text-red-600') : (label.includes('Utilization') || label.includes('Throughput') ? 'text-red-600' : 'text-emerald-600')}`}>
            {isPositive ? '+' : ''}{diff.toFixed(1)} {unit} diff
          </div>
        )}
      </div>
    );
  };

  if (initialLoading) return <LoadingState message="Initializing Digital Twin environment..." />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-600" />
            Clinic Digital Twin
          </h1>
          <p className="text-gray-500 mt-1">Simulate operational scenarios before changing the real clinic.</p>
        </div>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">Simulation — Not Real-Time Clinical Prediction</h3>
            <p className="text-sm text-amber-700 mt-1">
              The results displayed here are based on mathematical models and historical distributions. They are meant for capacity planning and operational strategy. Do not present simulation results to patients as actual future outcomes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <Settings2 className="w-5 h-5 text-gray-500" />
              Control Panel
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" /> Number of Doctors
                </label>
                <input 
                  type="number" 
                  name="numDoctors" 
                  value={controls.numDoctors} 
                  onChange={handleControlChange}
                  className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> Arrival Rate (pts/hr)
                </label>
                <input 
                  type="number" 
                  name="arrivalRate" 
                  value={controls.arrivalRate} 
                  onChange={handleControlChange}
                  className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" /> Avg Consultation (min)
                </label>
                <input 
                  type="number" 
                  name="avgConsultationDuration" 
                  value={controls.avgConsultationDuration} 
                  onChange={handleControlChange}
                  className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" /> Appointment Capacity
                </label>
                <input 
                  type="number" 
                  name="appointmentCapacity" 
                  value={controls.appointmentCapacity} 
                  onChange={handleControlChange}
                  className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" /> Working Hours
                </label>
                <input 
                  type="number" 
                  name="workingHours" 
                  value={controls.workingHours} 
                  onChange={handleControlChange}
                  className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <button 
              onClick={handleRunSimulation}
              disabled={loading}
              className="mt-8 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
              {loading ? 'Simulating...' : 'RUN SIMULATION'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Simulation Output Comparison</h2>
            
            {!simulationResult ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Cpu className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium text-gray-500">Awaiting Simulation</p>
                <p className="text-sm mt-1">Adjust parameters and click "Run Simulation" to see projected outcomes.</p>
              </div>
            ) : simulationResult.unavailable ? (
               <EmptyState 
                  icon={<AlertCircle className="w-12 h-12 text-gray-400" />}
                  title="SIMULATION UNAVAILABLE"
                  description="The simulation engine is currently offline or unconfigured."
                />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
                <MetricComparison 
                  label="Expected Queue" 
                  current={currentState?.expectedQueue || "UNAVAILABLE"} 
                  simulated={simulationResult?.expectedQueue} 
                  unit="pts"
                />
                <MetricComparison 
                  label="Expected Wait Time" 
                  current={currentState?.expectedWaitTime || "UNAVAILABLE"} 
                  simulated={simulationResult?.expectedWaitTime} 
                  unit="min"
                />
                <MetricComparison 
                  label="Congestion Level" 
                  current={currentState?.congestionLevel || "UNAVAILABLE"} 
                  simulated={simulationResult?.congestionLevel} 
                  unit="%"
                />
                <MetricComparison 
                  label="Doctor Utilization" 
                  current={currentState?.doctorUtilization || "UNAVAILABLE"} 
                  simulated={simulationResult?.doctorUtilization} 
                  unit="%"
                />
                <MetricComparison 
                  label="Patient Throughput" 
                  current={currentState?.patientThroughput || "UNAVAILABLE"} 
                  simulated={simulationResult?.patientThroughput} 
                  unit="pts/day"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseDigitalTwin;
