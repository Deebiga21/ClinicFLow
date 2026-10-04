import React, { useState, useEffect } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart
} from 'recharts';
import { BrainCircuit, Target, TrendingDown } from 'lucide-react';
import LoadingState from '../../components/shared/LoadingState';

const accuracyData = [
  { id: '101', predictedWait: 15, actualWait: 18, predictedDuration: 10, actualDuration: 12 },
  { id: '102', predictedWait: 20, actualWait: 19, predictedDuration: 15, actualDuration: 14 },
  { id: '103', predictedWait: 35, actualWait: 40, predictedDuration: 20, actualDuration: 25 },
  { id: '104', predictedWait: 10, actualWait: 12, predictedDuration: 12, actualDuration: 11 },
  { id: '105', predictedWait: 25, actualWait: 24, predictedDuration: 15, actualDuration: 16 },
  { id: '106', predictedWait: 40, actualWait: 35, predictedDuration: 30, actualDuration: 22 },
  { id: '107', predictedWait: 50, actualWait: 55, predictedDuration: 10, actualDuration: 15 },
  { id: '108', predictedWait: 22, actualWait: 22, predictedDuration: 15, actualDuration: 14 },
];

const trendData = [
  { date: 'Mon', mae: 4.2 },
  { date: 'Tue', mae: 3.8 },
  { date: 'Wed', mae: 3.5 },
  { date: 'Thu', mae: 3.1 },
  { date: 'Fri', mae: 2.8 },
  { date: 'Sat', mae: 2.5 },
  { date: 'Sun', mae: 2.3 },
];

export default function NursePredictionActual() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Prediction vs Actual Outcomes</h1>
        <p className="text-sm text-gray-500">Monitor model accuracy for wait times and consultation durations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><BrainCircuit size={24} /></div>
          <div><p className="text-sm text-gray-500">Model Accuracy Score</p><p className="text-2xl font-bold">92.4%</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Target size={24} /></div>
          <div><p className="text-sm text-gray-500">Mean Abs Error (Wait)</p><p className="text-2xl font-bold text-green-600">2.3 min</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><TrendingDown size={24} /></div>
          <div><p className="text-sm text-gray-500">Error Trend (7d)</p><p className="text-2xl font-bold text-blue-600">-1.9 min</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Wait Time: Predicted vs Actual</h2>
          <p className="text-xs text-gray-500 mb-4">Comparing recent visits (in minutes).</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="id" label={{ value: 'Patient', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="predictedWait" name="Predicted Wait" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="actualWait" name="Actual Wait" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Consultation Duration Accuracy</h2>
          <p className="text-xs text-gray-500 mb-4">Comparing recent consultations (in minutes).</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="id" label={{ value: 'Patient', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="predictedDuration" name="Predicted Duration" fill="#FEF3C7" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="actualDuration" name="Actual Duration" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Model Drift / Error Trend (Last 7 Days)</h2>
          <p className="text-xs text-gray-500 mb-4">Mean Absolute Error (MAE) of wait time predictions over the past week.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="mae" name="MAE (minutes)" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
