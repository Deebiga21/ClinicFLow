import React, { useState, useEffect } from 'react';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';
import { AlertTriangle, Filter, Search, Clock, Activity, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';

const NurseAnomalies = () => {
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState([]);
  const [timeFilter, setTimeFilter] = useState('today');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  
  const { lastEvent } = useClinicWebSocket();

  useEffect(() => {
    fetchData();
  }, [timeFilter, typeFilter, severityFilter, lastEvent]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.getOperationalAnomalies({ timeFilter, typeFilter, severityFilter }).catch(() => null);
      if (response && response.data) {
        setAnomalies(response);
      } else {
        setAnomalies([]);
      }
    } catch (err) {
      console.error('Failed to fetch anomalies', err);
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  };

  const anomalyTypes = [
    'Unusually long consultation', 
    'Sudden arrival spike', 
    'Unexpected queue growth', 
    'Abnormal waiting time', 
    'Unexpected doctor workload', 
    'Unusual medicine usage'
  ];

  const getSeverityColors = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Operational Anomaly Center
          </h1>
          <p className="text-gray-500 mt-1">Detect unusual clinic operational patterns.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-700">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <select 
          value={timeFilter} 
          onChange={(e) => setTimeFilter(e.target.value)}
          className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 py-1.5"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="all">All Time</option>
        </select>

        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 py-1.5"
        >
          <option value="all">All Anomaly Types</option>
          {anomalyTypes.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
        </select>

        <select 
          value={severityFilter} 
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 py-1.5"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Scanning for operational anomalies..." />
      ) : anomalies.length === 0 ? (
        <EmptyState 
          icon={<Activity className="w-12 h-12 text-gray-400" />}
          title="NO ANOMALIES DETECTED"
          description="ClinicFlow has not detected any unusual operational patterns matching your filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {anomalies.map((anomaly, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getSeverityColors(anomaly.severity)} uppercase tracking-wider`}>
                    {anomaly.severity || "UNKNOWN"} SEVERITY
                  </span>
                  <StatusBadge status={anomaly.status || "unresolved"} />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">{anomaly.type || "Unknown Anomaly"}</h3>
                
                <div className="flex items-center text-sm text-gray-500 mb-4 gap-2">
                  <Clock className="w-4 h-4" />
                  {anomaly.timestamp || "DATA UNAVAILABLE"}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Observed</p>
                    <p className="text-lg font-bold text-gray-900">{anomaly.observedValue || "N/A"}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Expected</p>
                    <p className="text-lg font-bold text-gray-600">{anomaly.expectedValue || "N/A"}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">Explanation: </span>
                    {anomaly.explanation || "No explanation available for this pattern."}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NurseAnomalies;
