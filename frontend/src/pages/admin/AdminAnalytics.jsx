import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Users, Clock, Calendar, Activity } from 'lucide-react';
import LoadingState from '../../components/shared/LoadingState';

// Mock data for analytics
const throughputData = [
  { name: 'Mon', patients: 45, walkIns: 12 },
  { name: 'Tue', patients: 52, walkIns: 15 },
  { name: 'Wed', patients: 38, walkIns: 8 },
  { name: 'Thu', patients: 65, walkIns: 22 },
  { name: 'Fri', patients: 58, walkIns: 18 },
  { name: 'Sat', patients: 70, walkIns: 30 },
  { name: 'Sun', patients: 20, walkIns: 5 },
];

const peakTimesData = [
  { time: '08:00', load: 10 },
  { time: '10:00', load: 45 },
  { time: '12:00', load: 30 },
  { time: '14:00', load: 25 },
  { time: '16:00', load: 60 },
  { time: '18:00', load: 50 },
  { time: '20:00', load: 15 },
];

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Analytics Overview</h1>
          <p className="text-sm text-gray-500">Historical performance, throughput, and peak time analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
          <div><p className="text-sm text-gray-500">Total Patients (Week)</p><p className="text-2xl font-bold">348</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Clock size={24} /></div>
          <div><p className="text-sm text-gray-500">Avg Wait Time</p><p className="text-2xl font-bold">24 min</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Calendar size={24} /></div>
          <div><p className="text-sm text-gray-500">Busiest Day</p><p className="text-2xl font-bold">Saturday</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Activity size={24} /></div>
          <div><p className="text-sm text-gray-500">Resource Utilization</p><p className="text-2xl font-bold">78%</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Patient Throughput (This Week)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="patients" name="Appointments" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="walkIns" name="Walk-Ins" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Average Load by Time of Day</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={peakTimesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="load" name="Patient Load" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
