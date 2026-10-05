import React, { useState, useEffect } from 'react';
import { UserCheck, Activity, Calendar, Clock, BarChart2, TrendingUp, BrainCircuit, CheckCircle } from 'lucide-react';
import MetricCard from '../../components/shared/MetricCard';
import ChartCard from '../../components/shared/ChartCard';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';
import { api } from '../../services/api';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceDot
} from 'recharts';

export default function NurseDoctorWorkload() {
  const [summary, setSummary] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useClinicWebSocket();

  const fetchData = async () => {
    try {
      const [summaryRes, doctorsRes, chartRes] = await Promise.all([
        api.get('/nurse/workload/summary').catch(() => null),
        api.get('/nurse/workload/doctors').catch(() => []),
        api.get('/nurse/workload/chart').catch(() => [])
      ]);
      setSummary(summaryRes);
      setDoctors(doctorsRes.data || []);
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

  if (loading) return <LoadingState message="Loading Doctor Workload..." />;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'success';
      case 'consulting': return 'warning';
      case 'overloaded': return 'danger';
      case 'offline': return 'gray';
      default: return 'gray';
    }
  };

  const peakPoint = chartData.find(d => d.isPeak);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Doctor Workload Intelligence</h1>
        <p className="text-gray-500">Monitor current and predicted clinical workload.</p>
      </div>

      {summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard title="Active Doctors" value={summary.activeDoctors ?? "DATA UNAVAILABLE"} icon={UserCheck} color="blue" />
          <MetricCard title="Active Consultations" value={summary.activeConsultations ?? "DATA UNAVAILABLE"} icon={Activity} color="emerald" />
          <MetricCard title="Upcoming Appointments" value={summary.upcomingAppointments ?? "DATA UNAVAILABLE"} icon={Calendar} color="purple" />
          <MetricCard title="Avg Consult Duration" value={summary.avgDuration ?? "DATA UNAVAILABLE"} icon={Clock} color="amber" />
          <MetricCard title="Current Workload" value={summary.currentWorkload ?? "DATA UNAVAILABLE"} icon={BarChart2} color="indigo" />
          <MetricCard title="Predicted Peak" value={summary.predictedPeak ?? "DATA UNAVAILABLE"} icon={TrendingUp} color="red" />
        </div>
      ) : (
        <EmptyState title="SUMMARY UNAVAILABLE" description="Could not load workload summary." />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Workload Forecast (Today)">
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="current" stroke="#3b82f6" strokeWidth={2} name="Current Workload" />
                    <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Predicted Workload" />
                    {peakPoint && (
                      <ReferenceDot x={peakPoint.time} y={peakPoint.predicted} r={5} fill="red" stroke="none" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="NO DATA" description="Chart data unavailable." />
            )}
          </ChartCard>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-100 h-full">
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <BrainCircuit className="w-5 h-5 mr-2 text-indigo-500" /> ML Models in Use
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500"/> Consultation Duration Model</li>
              <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500"/> Arrival Forecast</li>
              <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500"/> Appointment Load</li>
              <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500"/> Historical Consultation Data</li>
              <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500"/> Congestion Prediction</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Doctor Status & Workload</h2>
        </div>
        <div className="overflow-x-auto">
          {doctors.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Doctor</th>
                  <th className="px-6 py-3 font-medium">Current Consultations</th>
                  <th className="px-6 py-3 font-medium">Upcoming Appts</th>
                  <th className="px-6 py-3 font-medium">Avg Duration</th>
                  <th className="px-6 py-3 font-medium">Current Workload</th>
                  <th className="px-6 py-3 font-medium">Predicted Workload</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {doctors.map((doc, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{doc.name}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.currentConsultations ?? "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.upcomingAppointments ?? "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.avgDuration ?? "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.currentWorkload ?? "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.predictedWorkload ?? "N/A"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={getStatusColor(doc.status)}>{doc.status || "UNKNOWN"}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <EmptyState title="NO DOCTORS FOUND" description="No doctor data available." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
