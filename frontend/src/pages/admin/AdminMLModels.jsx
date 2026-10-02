import React, { useState, useEffect } from 'react';
import { BrainCircuit, Cpu, Calendar, Database, Target, FileText, CheckCircle, AlertTriangle, XCircle, ChevronRight, Activity } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';
import { api } from '../../services/api';

export default function AdminMLModels() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useClinicWebSocket();

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/ml-models').catch(() => []);
      setModels(res.data || []);
      if (res.data?.length > 0 && !selectedModel) {
        setSelectedModel(res.data[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastEvent]);

  if (loading) return <LoadingState message="Loading ML Models..." />;

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'TRAINED': return 'success';
      case 'NOT TRAINED': return 'danger';
      case 'INSUFFICIENT DATA': return 'warning';
      case 'TRAINING': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ML Model Center</h1>
        <p className="text-gray-500">Monitor ClinicFlow machine learning models.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Model List */}
        <div className="lg:w-1/3 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center">
            <BrainCircuit className="w-5 h-5 mr-2 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-800">Deployed Models</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {models.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {models.map((model) => (
                  <li 
                    key={model.id} 
                    className={`p-4 cursor-pointer hover:bg-indigo-50 transition-colors flex justify-between items-center ${selectedModel?.id === model.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                    onClick={() => setSelectedModel(model)}
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{model.name}</p>
                      <div className="mt-1">
                        <StatusBadge status={getStatusColor(model.status)}>{model.status}</StatusBadge>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6">
                <EmptyState title="NO MODELS" description="No ML models configured." />
              </div>
            )}
          </div>
        </div>

        {/* Model Detail */}
        <div className="lg:w-2/3 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          {selectedModel ? (
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedModel.name}</h2>
                  <p className="text-gray-500">{selectedModel.problemType || "N/A"}</p>
                </div>
                <StatusBadge status={getStatusColor(selectedModel.status)}>{selectedModel.status}</StatusBadge>
              </div>

              {selectedModel.status?.toUpperCase() === 'NOT TRAINED' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <XCircle className="w-5 h-5 mr-2 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800">NOT TRAINED</h3>
                    <p className="text-sm text-red-600">This model has not been trained yet. Data collection may be ongoing.</p>
                  </div>
                </div>
              )}

              {selectedModel.status?.toUpperCase() === 'INSUFFICIENT DATA' && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">INSUFFICIENT DATA</h3>
                    <p className="text-sm text-yellow-600">More historical records are needed before this model can be trained effectively.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Cpu className="w-4 h-4 mr-1"/> Algorithm</p>
                  <p className="font-semibold text-gray-900">{selectedModel.algorithm || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Model Version</p>
                  <p className="font-semibold text-gray-900">{selectedModel.version || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Calendar className="w-4 h-4 mr-1"/> Training Date</p>
                  <p className="font-semibold text-gray-900">{selectedModel.trainingDate || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Database className="w-4 h-4 mr-1"/> Training Rows</p>
                  <p className="font-semibold text-gray-900">{selectedModel.trainingRows ? selectedModel.trainingRows.toLocaleString() : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Target className="w-4 h-4 mr-1"/> Target</p>
                  <p className="font-semibold text-gray-900">{selectedModel.target || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><FileText className="w-4 h-4 mr-1"/> Model File</p>
                  <p className="font-semibold text-gray-900 truncate">{selectedModel.modelFile || "N/A"}</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-md font-semibold text-gray-800 mb-2 border-b pb-2">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.features && selectedModel.features.length > 0 ? (
                    selectedModel.features.map((feat, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {feat}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-2 border-b pb-2">Evaluation Metrics</h3>
                  {selectedModel.metrics ? (
                    <div className="space-y-2">
                      {Object.entries(selectedModel.metrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-semibold text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">N/A</p>
                  )}
                </div>
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-2 border-b pb-2">Last Prediction</h3>
                  {selectedModel.lastPrediction ? (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-center justify-between">
                       <span className="font-mono text-indigo-700">{selectedModel.lastPrediction.value}</span>
                       <span className="text-xs text-indigo-400">{selectedModel.lastPrediction.timestamp}</span>
                    </div>
                  ) : (
                    <p className="text-gray-500">N/A</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="NO MODEL SELECTED" description="Select a model from the list to view details." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
