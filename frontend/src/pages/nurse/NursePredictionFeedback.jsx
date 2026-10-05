import React, { useState, useEffect } from 'react';
import ChartCard from '../../components/shared/ChartCard';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { Scale, RefreshCw, TrendingDown, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';

const NursePredictionFeedback = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const { lastEvent } = useClinicWebSocket();

  useEffect(() => {
    fetchData();
  }, [lastEvent]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.getPredictionFeedback().catch(() => null);
      if (response && response.data) {
        setData(response);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Failed to fetch prediction feedback', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Scale className="w-6 h-6 text-indigo-600" />
          Prediction vs Actual
        </h1>
        <p className="text-gray-500 mt-1">Measure how predictions compare with real clinic outcomes.</p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-indigo-900 mb-4 uppercase tracking-wider">Closed-Loop Learning Process</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
          <div className="flex-1 bg-white p-3 rounded-lg shadow-sm w-full">
            <Clock className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
            <span className="text-sm font-medium text-gray-700">Prediction</span>
          </div>
          <RefreshCw className="w-4 h-4 text-indigo-300 md:-rotate-90 hidden md:block" />
          <div className="flex-1 bg-white p-3 rounded-lg shadow-sm w-full">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <span className="text-sm font-medium text-gray-700">Real Outcome</span>
          </div>
          <RefreshCw className="w-4 h-4 text-indigo-300 md:-rotate-90 hidden md:block" />
          <div className="flex-1 bg-white p-3 rounded-lg shadow-sm w-full">
            <Scale className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <span className="text-sm font-medium text-gray-700">Comparison</span>
          </div>
          <RefreshCw className="w-4 h-4 text-indigo-300 md:-rotate-90 hidden md:block" />
          <div className="flex-1 bg-white p-3 rounded-lg shadow-sm w-full">
            <TrendingDown className="w-5 h-5 text-rose-500 mx-auto mb-1" />
            <span className="text-sm font-medium text-gray-700">Error Measurement</span>
          </div>
          <RefreshCw className="w-4 h-4 text-indigo-300 md:-rotate-90 hidden md:block" />
          <div className="flex-1 bg-white p-3 rounded-lg shadow-sm w-full">
            <Database className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <span className="text-sm font-medium text-gray-700">Feedback Logged</span>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading feedback data..." />
      ) : !data ? (
        <EmptyState 
          icon={<Scale className="w-12 h-12 text-gray-400" />}
          title="DATA UNAVAILABLE"
          description="No prediction feedback data is currently available."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Error Over Time">
              {data.errorOverTime && data.errorOverTime.length > 0 ? (
                <div className="h-64 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.errorOverTime}>
                      <defs>
                        <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="error" stroke="#EF4444" fillOpacity={1} fill="url(#colorError)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm font-medium">DATA UNAVAILABLE</div>
              )}
            </ChartCard>

            <ChartCard title="Model Error Trend">
              {data.errorTrend && data.errorTrend.length > 0 ? (
                <div className="h-64 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.errorTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="avgError" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm font-medium">DATA UNAVAILABLE</div>
              )}
            </ChartCard>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Recent Prediction Evaluations</h2>
            </div>
            <div className="overflow-x-auto">
              {data.evaluations && data.evaluations.length > 0 ? (
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="text-xs uppercase bg-gray-50 text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Timestamp</th>
                      <th className="px-6 py-3 font-semibold">Prediction Type</th>
                      <th className="px-6 py-3 font-semibold">Predicted</th>
                      <th className="px-6 py-3 font-semibold">Actual</th>
                      <th className="px-6 py-3 font-semibold">Absolute Error</th>
                      <th className="px-6 py-3 font-semibold">Model Version</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.evaluations.map((evalItem, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">{evalItem.timestamp}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{evalItem.type}</td>
                        <td className="px-6 py-4">{evalItem.predicted}</td>
                        <td className="px-6 py-4">{evalItem.actual}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            evalItem.error > evalItem.threshold ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {evalItem.error}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{evalItem.modelVersion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  DATA UNAVAILABLE
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple fallback icon to avoid import errors if not already in lucide-react above
const Database = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

export default NursePredictionFeedback;
