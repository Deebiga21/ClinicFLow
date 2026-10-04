import React, { useState, useEffect } from 'react';
import ChartCard from '../../components/shared/ChartCard';
import MetricCard from '../../components/shared/MetricCard';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Activity, ShieldCheck, Database, Calendar, BarChart2 } from 'lucide-react';
import { api } from '../../services/api';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';

const NurseModelPerformance = () => {
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
      const response = await api.getModelPerformanceData(selectedModel).catch(() => null);
      if (response && response.data) {
        setData(response);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Failed to fetch model performance data', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const models = [
    { id: 'waitingTime', name: 'Waiting Time' },
    { id: 'consultationDuration', name: 'Consultation Duration' },
    { id: 'noShow', name: 'No-Show' },
    { id: 'congestion', name: 'Congestion' },
    { id: 'anomalyDetection', name: 'Anomaly Detection' },
    { id: 'doctorWorkload', name: 'Doctor Workload' },
    { id: 'medicineDemand', name: 'Medicine Demand' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Model Performance
          </h1>
          <p className="text-gray-500 mt-1">Evaluate ClinicFlow prediction quality.</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm overflow-x-auto max-w-full">
          {models.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedModel === m.id 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading model metrics..." />
      ) : !data ? (
        <EmptyState 
          icon={<Database className="w-12 h-12 text-gray-400" />}
          title="NOT TRAINED OR DATA UNAVAILABLE"
          description="No evaluation data is available for this model yet."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard 
              title="Training Dataset" 
              value={data.trainingDatasetSize || "UNAVAILABLE"} 
              icon={<Database className="text-blue-500" />}
            />
            <MetricCard 
              title="Test Dataset" 
              value={data.testDatasetSize || "UNAVAILABLE"} 
              icon={<Database className="text-blue-500" />}
            />
            <MetricCard 
              title="Training Date" 
              value={data.trainingDate || "UNAVAILABLE"} 
              icon={<Calendar className="text-purple-500" />}
            />
            <MetricCard 
              title="Model Version" 
              value={data.modelVersion || "UNAVAILABLE"} 
              icon={<Activity className="text-emerald-500" />}
            />
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Evaluation Metrics</h2>
              <span className="text-sm text-gray-500">Last Evaluation: {data.lastEvaluation || "UNAVAILABLE"}</span>
            </div>
            
            {data.modelType === 'classification' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-500 font-medium mb-1">Precision</div>
                  <div className="text-2xl font-bold text-gray-900">{data.metrics?.precision ?? "UNAVAILABLE"}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-500 font-medium mb-1">Recall</div>
                  <div className="text-2xl font-bold text-gray-900">{data.metrics?.recall ?? "UNAVAILABLE"}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-500 font-medium mb-1">F1 Score</div>
                  <div className="text-2xl font-bold text-gray-900">{data.metrics?.f1 ?? "UNAVAILABLE"}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-500 font-medium mb-1">ROC-AUC</div>
                  <div className="text-2xl font-bold text-gray-900">{data.metrics?.rocAuc ?? "UNAVAILABLE"}</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-500 font-medium mb-1">MAE (Mean Absolute Error)</div>
                  <div className="text-2xl font-bold text-gray-900">{data.metrics?.mae ?? "UNAVAILABLE"}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-500 font-medium mb-1">RMSE (Root Mean Square Error)</div>
                  <div className="text-2xl font-bold text-gray-900">{data.metrics?.rmse ?? "UNAVAILABLE"}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-500 font-medium mb-1">R² (Coefficient of Determination)</div>
                  <div className="text-2xl font-bold text-gray-900">{data.metrics?.r2 ?? "UNAVAILABLE"}</div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Performance Over Time">
              {data.performanceOverTime && data.performanceOverTime.length > 0 ? (
                <div className="h-64 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.performanceOverTime}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm font-medium">DATA UNAVAILABLE</div>
              )}
            </ChartCard>

            <ChartCard title={data.modelType === 'classification' ? 'Error Distribution' : 'Actual vs Predicted'}>
              {data.chartData && data.chartData.length > 0 ? (
                <div className="h-64 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {data.modelType === 'classification' ? (
                       <LineChart data={data.chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={2} />
                       </LineChart>
                    ) : (
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="actual" name="Actual" />
                        <YAxis type="number" dataKey="predicted" name="Predicted" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Predictions" data={data.chartData} fill="#8B5CF6" />
                      </ScatterChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm font-medium">DATA UNAVAILABLE</div>
              )}
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseModelPerformance;
