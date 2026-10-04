import React, { useState, useEffect } from 'react';
import { Settings, Save, Server, Database, Brain, Activity, Bell, Layout, Building2, Moon, Sun } from 'lucide-react';
import { api } from '../../services/api';
import LoadingState from '../../components/shared/LoadingState';
import StatusBadge from '../../components/shared/StatusBadge';

export default function NurseSettings() {
  const [settings, setSettings] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [settingsData, statusData] = await Promise.all([
          api.getSettings().catch(() => null),
          api.getSystemStatus().catch(() => null)
        ]);
        
        // Provide fallback empty state if no data available rather than failing
        setSettings(settingsData || {
          clinic_name: 'DATA UNAVAILABLE',
          operating_hours: 'DATA UNAVAILABLE',
          working_days: 'DATA UNAVAILABLE',
          theme: 'light',
          sidebar_expanded: true,
          notify_operational: false,
          notify_prediction: false,
          notify_medicine: false,
          notify_anomaly: false,
          prediction_threshold: 0
        });
        
        setSystemStatus(statusData || {
          backend: 'DATA UNAVAILABLE',
          database: 'DATA UNAVAILABLE',
          ml_service: 'DATA UNAVAILABLE',
          websocket: 'DATA UNAVAILABLE'
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg('');
      setError(null);
      await api.updateSettings(settings);
      setSuccessMsg('Settings saved successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading Settings..." />;

  const getStatusColor = (status) => {
    if (!status || status === 'DATA UNAVAILABLE') return 'neutral';
    const s = status.toLowerCase();
    if (s === 'online' || s === 'connected' || s === 'healthy') return 'success';
    if (s === 'offline' || s === 'disconnected' || s === 'error') return 'critical';
    return 'warning';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-700" />
          System Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure ClinicFlow nurseistrative preferences.</p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">{error}</div>}
      {successMsg && <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-100">{successMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Clinic Info */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <h2 className="font-semibold text-gray-900">Clinic Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                  <input 
                    type="text" name="clinic_name" value={settings.clinic_name} onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
                    <input 
                      type="text" name="operating_hours" value={settings.operating_hours} onChange={handleChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Working Days</label>
                    <input 
                      type="text" name="working_days" value={settings.working_days} onChange={handleChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-gray-900">Notifications</h2>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { name: 'notify_operational', label: 'Operational Alerts', desc: 'Alerts regarding queue size and wait times.' },
                  { name: 'notify_prediction', label: 'Prediction Alerts', desc: 'Alerts from ML models forecasting future congestion.' },
                  { name: 'notify_medicine', label: 'Medicine Alerts', desc: 'Alerts for low stock and expiry risks.' },
                  { name: 'notify_anomaly', label: 'Anomaly Alerts', desc: 'Alerts for unusual operational metrics.' }
                ].map(item => (
                  <label key={item.name} className="flex items-start gap-3 cursor-pointer group">
                    <div className="flex items-center h-5 mt-0.5">
                      <input 
                        type="checkbox" name={item.name} checked={settings[item.name]} onChange={handleChange}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Display & Predictions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-purple-500" />
                  <h2 className="font-semibold text-gray-900">Display</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                    <select 
                      name="theme" value={settings.theme} onChange={handleChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" name="sidebar_expanded" checked={settings.sidebar_expanded} onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Sidebar Expanded by Default</span>
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-500" />
                  <h2 className="font-semibold text-gray-900">Prediction Tuning</h2>
                </div>
                <div className="p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Congestion Alert Threshold</label>
                  <p className="text-xs text-gray-500 mb-2">Confidence % required before alerting.</p>
                  <input 
                    type="range" name="prediction_threshold" min="50" max="99" 
                    value={settings.prediction_threshold} onChange={handleChange}
                    className="w-full"
                  />
                  <div className="text-center text-sm font-medium text-indigo-600 mt-1">
                    {settings.prediction_threshold}%
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Configuration</>}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - System Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <h2 className="font-semibold text-gray-900">System Status</h2>
            </div>
            <div className="p-4 space-y-0 divide-y divide-gray-100">
              
              <div className="py-3 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Server className="w-4 h-4 text-gray-400" /> API Backend
                </div>
                <StatusBadge status={getStatusColor(systemStatus?.backend)} text={systemStatus?.backend || 'DATA UNAVAILABLE'} />
              </div>

              <div className="py-3 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Database className="w-4 h-4 text-gray-400" /> Database
                </div>
                <StatusBadge status={getStatusColor(systemStatus?.database)} text={systemStatus?.database || 'DATA UNAVAILABLE'} />
              </div>

              <div className="py-3 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Brain className="w-4 h-4 text-gray-400" /> ML Service
                </div>
                <StatusBadge status={getStatusColor(systemStatus?.ml_service)} text={systemStatus?.ml_service || 'DATA UNAVAILABLE'} />
              </div>

              <div className="py-3 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Activity className="w-4 h-4 text-gray-400" /> WebSocket
                </div>
                <StatusBadge status={getStatusColor(systemStatus?.websocket)} text={systemStatus?.websocket || 'DATA UNAVAILABLE'} />
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
