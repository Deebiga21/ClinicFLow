import React, { useState, useEffect } from 'react';
import { UserCheck, Activity, Calendar, Clock, BarChart2, TrendingUp, BrainCircuit, CheckCircle, ChevronDown, ChevronUp, Users, HeartPulse, Stethoscope } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';
import { api } from '../../services/api';

const DepartmentCard = ({ deptName, stats, docs, getStatusColor }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${expanded ? 'border-blue-300 ring-2 ring-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
      {/* Card Header (Always Visible) */}
      <div 
        className="p-5 cursor-pointer flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{deptName}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1"><Users className="w-4 h-4"/> {stats.activeDoctors} Doctors</span>
              <span className="flex items-center gap-1"><HeartPulse className="w-4 h-4"/> {stats.activeConsultations} Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Workload</p>
            <StatusBadge status={stats.currentWorkload === 'High' ? 'danger' : stats.currentWorkload === 'Medium' ? 'warning' : 'success'}>
              {stats.currentWorkload}
            </StatusBadge>
          </div>
          {expanded ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
        </div>
      </div>

      {/* Card Body (Expanded) */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-5 rounded-b-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-bold">Upcoming Appts</p>
              <p className="text-xl font-bold text-gray-900 mt-1 flex items-center"><Calendar className="w-4 h-4 mr-2 text-purple-500"/> {stats.upcomingAppointments}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-bold">Avg Duration</p>
              <p className="text-xl font-bold text-gray-900 mt-1 flex items-center"><Clock className="w-4 h-4 mr-2 text-amber-500"/> {stats.avgDuration}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-bold">Total Workload</p>
              <p className="text-xl font-bold text-gray-900 mt-1 flex items-center"><BarChart2 className="w-4 h-4 mr-2 text-indigo-500"/> {stats.currentWorkload}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-bold">Predicted Peak</p>
              <p className="text-xl font-bold text-gray-900 mt-1 flex items-center"><TrendingUp className="w-4 h-4 mr-2 text-red-500"/> {stats.predictedPeak}</p>
            </div>
          </div>

          <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Available Doctors</h4>
          {docs.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Consultations</th>
                    <th className="px-4 py-2 font-medium">Upcoming</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {docs.map((doc, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{doc.name}</td>
                      <td className="px-4 py-3 text-gray-600">{doc.currentConsultations}</td>
                      <td className="px-4 py-3 text-gray-600">{doc.upcomingAppointments}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={getStatusColor(doc.status)}>{doc.status}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <p className="text-sm text-gray-500 italic">No doctors available in this department.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default function NurseDoctorWorkload() {
  const [summary, setSummary] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useClinicWebSocket();

  const fetchData = async () => {
    try {
      const [summaryRes, doctorsRes] = await Promise.all([
        api.get('/admin/workload/summary').catch(() => null),
        api.get('/admin/workload/doctors').catch(() => [])
      ]);
      setSummary(summaryRes?.data || summaryRes);
      setDoctors(doctorsRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastEvent]);

  if (loading) return <LoadingState message="Loading Department Analytics..." />;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'success';
      case 'consulting': return 'warning';
      case 'overloaded': return 'danger';
      case 'offline': return 'gray';
      default: return 'gray';
    }
  };

  const departments = summary ? Object.keys(summary).filter(k => k !== 'All Departments').sort() : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-[#0A2540]">Department Analytics</h1>
        <p className="text-gray-500 mt-2">Real-time workload and doctor availability across all clinical departments.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {departments.length > 0 ? (
          departments.map(dept => (
            <DepartmentCard 
              key={dept} 
              deptName={dept} 
              stats={summary[dept]} 
              docs={doctors.filter(d => (d.department || 'General') === dept)}
              getStatusColor={getStatusColor}
            />
          ))
        ) : (
          <EmptyState title="NO DATA" description="No department analytics available." />
        )}
      </div>
    </div>
  );
}
