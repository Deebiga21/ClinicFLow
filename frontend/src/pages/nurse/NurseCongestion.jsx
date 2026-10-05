import React, { useState, useEffect } from 'react';
import { Activity, Clock, Users, Calendar, AlertTriangle, TrendingUp, BrainCircuit, CheckCircle, BarChart2 } from 'lucide-react';
import MetricCard from '../../components/shared/MetricCard';
import ChartCard from '../../components/shared/ChartCard';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';
import { api } from '../../services/api';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

export default function NurseCongestion() {
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useClinicWebSocket();

  const fetchData = async () => {
    try {
      const [congestionRes, chartRes] = await Promise.all([
        api.get('/nurse/congestion/summary').catch(() => null),
        api.get('/nurse/congestion/chart').catch(() => [])
      ]);
      setData(congestionRes);
      setChartData(chartRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastEvent]);

  if (loading) return <LoadingState message="Loading Congestion Forecast..." />;

  const currentState = data?.current || {};
  const prediction = data?.prediction || {};
  const bottleneck = data?.bottleneck || {};

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Congestion Forecast</h1>
        <p className="text-gray-500">Predict future clinic crowding and operational pressure.</p>
      </div>

      {/* Current State */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-500" /> Current State
        </h2>
        {data ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <MetricCard title="Queue Size" value={currentState.queueSize ?? "N/A"} icon={Users} color="blue" />
            <MetricCard title="Arrival Rate" value={currentState.arrivalRate ?? "N/A"} icon={TrendingUp} color="emerald" />
            <MetricCard title="Service Rate" value={currentState.serviceRate ?? "N/A"} icon={Activity} color="indigo" />
            <MetricCard title="Active Doctors" value={currentState.activeDoctors ?? "N/A"} icon={Users} color="purple" />
            <MetricCard title="Appt Load" value={currentState.appointmentLoad ?? "N/A"} icon={Calendar} color="amber" />
            <MetricCard title="Wait Time" value={currentState.currentWaitTime ?? "N/A"} icon={Clock} color="orange" />
            <MetricCard title="Congestion" value={currentState.currentCongestion ?? "N/A"} icon={BarChart2} color="red" />
          </div>
        ) : (
          <EmptyState title="DATA UNAVAILABLE" description="Could not load current state." />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 space-y-6">
          <ChartCard title="Congestion Levels: Historical vs Predicted">
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="historical" stroke="#64748b" fill="#64748b" fillOpacity={0.2} name="Historical Congestion" />
                    <Area type="monotone" dataKey="predicted" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Predicted Congestion" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="NO DATA" description="Chart data unavailable." />
            )}
          </ChartCard>

          {/* Predictions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
             <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-red-500" /> Predictions
            </h2>
            {data ? (
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Predicted Congestion</p>
                    <p className="font-semibold text-gray-900">{prediction.congestion ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Predicted Peak Time</p>
                    <p className="font-semibold text-gray-900">{prediction.peakTime ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expected Queue</p>
                    <p className="font-semibold text-gray-900">{prediction.expectedQueue ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expected Wait</p>
                    <p className="font-semibold text-gray-900">{prediction.expectedWait ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expected Arrivals</p>
                    <p className="font-semibold text-gray-900">{prediction.expectedArrivals ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Risk Level</p>
                    {prediction.riskLevel ? (
                      <StatusBadge status={prediction.riskLevel === 'High' ? 'danger' : prediction.riskLevel === 'Medium' ? 'warning' : 'success'}>
                        {prediction.riskLevel}
                      </StatusBadge>
                    ) : (
                      <span className="font-semibold text-gray-900">N/A</span>
                    )}
                  </div>
               </div>
            ) : (
               <EmptyState title="DATA UNAVAILABLE" description="Could not load predictions." />
            )}
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" /> Bottleneck Alert
            </h3>
            {data ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Predicted Bottleneck</p>
                  <p className="font-semibold text-gray-900">{bottleneck.predicted ?? "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expected Time</p>
                  <p className="font-semibold text-orange-600">{bottleneck.expectedTime ?? "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="font-semibold text-gray-900">{bottleneck.reason ?? "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Affected Flow Stage</p>
                  <p className="font-semibold text-gray-900">{bottleneck.affectedStage ?? "N/A"}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">DATA UNAVAILABLE</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-100">
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <BrainCircuit className="w-5 h-5 mr-2 text-indigo-500" /> Congestion Model Inputs
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Queue Length</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Arrival Rate</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Service Rate</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Doctor Capacity</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Appointment Load</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Historical Pattern</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
