import React, { useState, useEffect } from 'react';
import { FileText, FileBarChart, Play, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';

const REPORT_TYPES = [
  { id: 'daily_clinic', name: 'Daily Clinic Report', description: 'Summary of daily clinic operations and patient metrics.' },
  { id: 'patient_flow', name: 'Patient Flow Report', description: 'Analysis of patient journey times and wait durations.' },
  { id: 'doctor_workload', name: 'Doctor Workload Report', description: 'Consultation metrics and utilization rates per doctor.' },
  { id: 'medicine_intelligence', name: 'Medicine Intelligence Report', description: 'Inventory status, expiry risks, and demand forecasts.' },
  { id: 'ml_performance', name: 'ML Model Performance Report', description: 'General performance metrics of deployed ML models.' },
  { id: 'prediction_accuracy', name: 'Prediction Accuracy Report', description: 'Accuracy comparison of predictions vs actuals.' },
  { id: 'congestion', name: 'Congestion Report', description: 'Historical and predicted congestion peaks and bottlenecks.' },
  { id: 'anomaly', name: 'Anomaly Report', description: 'Log of detected anomalies in clinic operations.' }
];

export default function NurseReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(null);
  const { lastEvent } = useClinicWebSocket();

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReports().catch(() => []);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load reports history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (lastEvent?.type === 'REPORT_GENERATED') {
      fetchReports();
    }
  }, [lastEvent]);

  const handleGenerate = async (reportId) => {
    try {
      setGenerating(reportId);
      await api.generateReport({ report_type: reportId });
      await fetchReports();
    } catch (err) {
      console.error('Failed to generate report:', err);
      // Could show a toast here
    } finally {
      setGenerating(null);
    }
  };

  if (loading) return <LoadingState message="Loading Reports..." />;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Intelligence Reports</h1>
          <p className="text-sm text-gray-500">Generate operational and ML reports from actual system data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORT_TYPES.map(report => (
          <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <FileBarChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{report.description}</p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
              <button 
                onClick={() => handleGenerate(report.id)}
                disabled={generating === report.id}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {generating === report.id ? (
                  <span className="animate-pulse">Generating...</span>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Recent Reports
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Report Name</th>
                <th className="px-6 py-3">Generated At</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.length > 0 ? (
                reports.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.name || 'DATA UNAVAILABLE'}</td>
                    <td className="px-6 py-4 text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        status={item.status === 'ready' ? 'success' : item.status === 'failed' ? 'critical' : 'warning'} 
                        text={item.status || 'Unknown'} 
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === 'ready' && (
                        <button className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                          <Eye className="w-4 h-4" /> View
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8">
                    <EmptyState icon={FileText} title="No Reports" message="DATA UNAVAILABLE" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
