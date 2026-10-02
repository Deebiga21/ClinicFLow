import React, { useState, useEffect } from 'react';
import { Users, Clock, ArrowRight, AlertTriangle, CheckCircle, Activity, BrainCircuit } from 'lucide-react';
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

export default function AdminPatientFlow() {
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useClinicWebSocket();

  const fetchData = async () => {
    try {
      // Assuming api endpoints exist or will be mocked in api.js
      const [flowDataRes, chartRes] = await Promise.all([
        api.get('/admin/patient-flow/summary').catch(() => null),
        api.get('/admin/patient-flow/chart').catch(() => [])
      ]);
      
      setData(flowDataRes);
      setChartData(chartRes);
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Flow Intelligence</h1>
          <p className="text-gray-500">Monitor the complete patient journey through the clinic.</p>
        </div>
      </div>

      {/* Main Visual: Journey Flow */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-500" /> Current Patient Journey Flow
        </h2>
        <div className="flex items-center min-w-max space-x-2 text-sm">
          {data.stages ? data.stages.map((stage, i) => (
            <React.Fragment key={stage.name}>
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg min-w-[120px] text-center border border-gray-100">
                <span className="font-semibold text-gray-700">{stage.name}</span>
                <span className="text-2xl font-bold text-blue-600 my-1">{stage.count}</span>
                <span className="text-xs text-gray-500">{stage.avgDuration} avg</span>
                {stage.predictedDelay && <span className="text-xs text-red-500 mt-1">+{stage.predictedDelay} delay</span>}
              </div>
              {i < data.stages.length - 1 && <ArrowRight className="w-5 h-5 text-gray-300" />}
            </React.Fragment>
          )) : <span className="text-gray-500">DATA UNAVAILABLE</span>}
        </div>
      </div>

      {/* Current Flow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Patients Today" value={data.patientsToday ?? "DATA UNAVAILABLE"} icon={Users} color="blue" />
        <MetricCard title="Checked In" value={data.checkedIn ?? "DATA UNAVAILABLE"} icon={CheckCircle} color="emerald" />
        <MetricCard title="Waiting" value={data.currentlyWaiting ?? "DATA UNAVAILABLE"} icon={Clock} color="amber" />
        <MetricCard title="Consulting" value={data.currentlyConsulting ?? "DATA UNAVAILABLE"} icon={Activity} color="purple" />
        <MetricCard title="Completed" value={data.completed ?? "DATA UNAVAILABLE"} icon={CheckCircle} color="gray" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bottleneck Analysis */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" /> Bottleneck Analysis
            </h3>
            {data.bottleneck ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Current Bottleneck</p>
                  <p className="font-semibold text-gray-900">{data.bottleneck.current}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average Delay</p>
                  <p className="font-semibold text-red-600">{data.bottleneck.avgDelay}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Predicted Bottleneck</p>
                  <p className="font-semibold text-gray-900">{data.bottleneck.predicted}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Affected Patients</p>
                  <p className="font-semibold text-gray-900">{data.bottleneck.affectedCount}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">DATA UNAVAILABLE</p>
            )}
          </div>

          {/* ML Connection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-100">
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <BrainCircuit className="w-5 h-5 mr-2 text-indigo-500" /> ML Models in Use
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Waiting Time Prediction</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Consultation Duration</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Arrival Forecast</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Congestion Prediction</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Doctor Workload</li>
            </ul>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2">
          <ChartCard title="Patient Flow Volume (Today)">
            {chartData && chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="arrivals" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Arrivals" />
                    <Area type="monotone" dataKey="queueing" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} name="Entering Queue" />
                    <Area type="monotone" dataKey="consulting" stackId="3" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} name="Consultation" />
                    <Area type="monotone" dataKey="completed" stackId="4" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="NO DATA" description="Chart data unavailable" />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
