import React, { useState, useEffect } from 'react';
import ChartCard from '../../components/shared/ChartCard';
import MetricCard from '../../components/shared/MetricCard';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Activity, Brain, ArrowRight, Zap, Target, Search } from 'lucide-react';
import { api } from '../../services/api';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';

const AdminExplainability = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedModel, setSelectedModel] = useState('waitingTime');
  const { lastEvent } = useClinicWebSocket();

  useEffect(() => {
    fetchData();
  }, [selectedModel, lastEvent]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Ensure this endpoint exists or will return empty gracefully
      const response = await api.getExplainabilityData(selectedModel).catch(() => null);
      if (response && response.data) {
        setData(response);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Failed to fetch explainability data', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const models = [
    { id: 'waitingTime', name: 'Waiting Time' },
    { id: 'consultationDuration', name: 'Consultation Duration' },
    { id: 'congestion', name: 'Congestion' },
    { id: 'other', name: 'Other Supported Models' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" />
            Explainable AI
          </h1>
          <p className="text-gray-500 mt-1">Understand why ClinicFlow generated a prediction.</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <label className="text-sm font-medium text-gray-700 px-2">Select Model:</label>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 py-1.5 pl-3 pr-8"
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading AI explanations..." />
      ) : !data ? (
        <EmptyState 
          icon={<Search className="w-12 h-12 text-gray-400" />}
          title="DATA UNAVAILABLE"
          description="No explainability data is currently available for this model."
        />
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-3">Prediction Summary</h2>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <p className="text-sm text-gray-500 uppercase font-semibold tracking-wide">Expected Outcome</p>
                <div className="mt-2 text-3xl font-bold text-indigo-700">
                  {data.prediction || "DATA UNAVAILABLE"}
                </div>
              </div>
              <div className="flex-[2] bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Example Reasoning:</p>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {data.reasoningText || "Explanation unavailable."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Top Contributing Features (SHAP)">
              {data.shapValues && data.shapValues.length > 0 ? (
                <div className="h-72 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data.shapValues} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="feature" width={100} tick={{fontSize: 12}} />
                      <Tooltip />
                      <Bar dataKey="impact">
                        {data.shapValues.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#10B981' : '#EF4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm font-medium">DATA UNAVAILABLE</div>
              )}
            </ChartCard>

            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  Positive Contributions
                </h3>
                {data.positiveContributors && data.positiveContributors.length > 0 ? (
                  <ul className="space-y-2">
                    {data.positiveContributors.map((factor, i) => (
                      <li key={i} className="flex justify-between items-center text-sm p-2 bg-emerald-50 rounded">
                        <span className="text-gray-700 font-medium">{factor.name}</span>
                        <span className="text-emerald-700 font-bold">+{factor.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">DATA UNAVAILABLE</p>
                )}
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />
                  Negative Contributions
                </h3>
                {data.negativeContributors && data.negativeContributors.length > 0 ? (
                  <ul className="space-y-2">
                    {data.negativeContributors.map((factor, i) => (
                      <li key={i} className="flex justify-between items-center text-sm p-2 bg-red-50 rounded">
                        <span className="text-gray-700 font-medium">{factor.name}</span>
                        <span className="text-red-700 font-bold">{factor.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">DATA UNAVAILABLE</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExplainability;
