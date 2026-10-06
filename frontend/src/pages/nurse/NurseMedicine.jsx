import React, { useState, useEffect } from 'react';
import { Pill, AlertTriangle, TrendingUp, RefreshCw, Calendar, Package, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';
import MetricCard from '../../components/shared/MetricCard';
import ChartCard from '../../components/shared/ChartCard';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import EmptyState from '../../components/shared/EmptyState';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line 
} from 'recharts';

export default function NurseMedicine() {
  const [inventory, setInventory] = useState([]);
  const [expiryRisks, setExpiryRisks] = useState([]);
  const [demandForecast, setDemandForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastEvent } = useClinicWebSocket();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invData, expiryData, demandData] = await Promise.all([
        api.getMedicineInventory().catch(() => []),
        api.getExpiryRisks().catch(() => []),
        api.getMedicineDemandForecast().catch(() => ({ trained: false }))
      ]);
      setInventory(Array.isArray(invData) ? invData : []);
      setExpiryRisks(Array.isArray(expiryData) ? expiryData : []);
      setDemandForecast(demandData);
    } catch (err) {
      console.error(err);
      setError('Failed to load medicine intelligence data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (lastEvent?.type === 'MEDICINE_UPDATE') {
      fetchData();
    }
  }, [lastEvent]);

  if (loading) return <LoadingState message="Loading Medicine Intelligence..." />;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  const totalStock = inventory.reduce((sum, item) => sum + (item.current_quantity || 0), 0);
  const totalExpiring = expiryRisks.length;
  const stockoutRiskCount = inventory.filter(i => (i.current_quantity || 0) < (i.expected_usage || 0)).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicine Intelligence</h1>
          <p className="text-sm text-gray-500">Monitor inventory, demand and expiry risk.</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Stock"
          value={totalStock.toString()}
          icon={Package}
          status="normal"
        />
        <MetricCard
          title="Expiring Soon"
          value={totalExpiring.toString()}
          icon={Calendar}
          status={totalExpiring > 0 ? "warning" : "success"}
        />
        <MetricCard
          title="Stockout Risk"
          value={stockoutRiskCount.toString()}
          icon={AlertTriangle}
          status={stockoutRiskCount > 0 ? "critical" : "success"}
        />
        <MetricCard
          title="Demand Model"
          value={demandForecast?.trained ? "Active" : "Not Trained"}
          icon={TrendingUp}
          status={demandForecast?.trained ? "success" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Medicine Inventory" subtitle="Current vs Expected Usage">
          {inventory.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="medicine_name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current_quantity" name="Current Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expected_usage" name="Expected Usage" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Package} title="No Inventory Data" message="DATA UNAVAILABLE" />
          )}
        </ChartCard>

        <ChartCard title="Demand Forecast" subtitle="Predicted Medicine Consumption">
          {demandForecast?.trained && demandForecast?.historical_usage?.length > 0 ? (
             <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={demandForecast.historical_usage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                 <YAxis tick={{ fontSize: 12 }} />
                 <Tooltip />
                 <Legend />
                 <Line type="monotone" dataKey="usage" name="Historical Usage" stroke="#64748b" strokeWidth={2} dot={false} />
                 <Line type="monotone" dataKey="predicted" name="Expected Demand" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
               </LineChart>
             </ResponsiveContainer>
           </div>
          ) : (
            <EmptyState icon={TrendingUp} title="Model Not Trained" message="MODEL NOT TRAINED" />
          )}
        </ChartCard>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-indigo-500" />
            Inventory Table
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Medicine</th>
                <th className="px-6 py-3">Batch</th>
                <th className="px-6 py-3 text-right">Current Qty</th>
                <th className="px-6 py-3 text-right">Expected Usage</th>
                <th className="px-6 py-3 text-right">Expected Leftover</th>
                <th className="px-6 py-3">Expiry Date</th>
                <th className="px-6 py-3 text-right">Days Rem.</th>
                <th className="px-6 py-3 text-center">Stock Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.length > 0 ? (
                inventory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.medicine_name || 'DATA UNAVAILABLE'}</td>
                    <td className="px-6 py-4 text-gray-500">{item.batch_number || '-'}</td>
                    <td className="px-6 py-4 text-right">{item.current_quantity ?? '-'}</td>
                    <td className="px-6 py-4 text-right">{item.expected_usage ?? '-'}</td>
                    <td className="px-6 py-4 text-right">
                      {item.current_quantity !== undefined && item.expected_usage !== undefined 
                        ? (item.current_quantity - item.expected_usage) 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{item.expiry_date || '-'}</td>
                    <td className="px-6 py-4 text-right">{item.days_remaining ?? '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge 
                        status={item.stock_risk === 'High' ? 'critical' : item.stock_risk === 'Medium' ? 'warning' : 'success'} 
                        text={item.stock_risk || 'Unknown'} 
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">DATA UNAVAILABLE</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Expiry Alerts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Medicine</th>
                <th className="px-6 py-3">Batch</th>
                <th className="px-6 py-3">Expiry Date</th>
                <th className="px-6 py-3 text-right">Days Rem.</th>
                <th className="px-6 py-3 text-right">Current Stock</th>
                <th className="px-6 py-3 text-center">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expiryRisks.length > 0 ? (
                expiryRisks.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.medicine_name || 'DATA UNAVAILABLE'}</td>
                    <td className="px-6 py-4 text-gray-500">{item.batch_number || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{item.expiry_date || '-'}</td>
                    <td className="px-6 py-4 text-right">{item.days_remaining ?? '-'}</td>
                    <td className="px-6 py-4 text-right">{item.current_quantity ?? '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge 
                        status={item.risk_level === 'High' ? 'critical' : item.risk_level === 'Medium' ? 'warning' : 'success'} 
                        text={item.risk_level || 'Unknown'} 
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">NO EXPIRY RISKS DETECTED</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
