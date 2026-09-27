import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, AlertTriangle, Package, Activity } from 'lucide-react';
import { API_BASE_URL } from '../config';
import AppShell from '../components/AppShell';

export default function MedicineIntel() {
  const [inventory, setInventory] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, riskRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/medicines/inventory`),
        axios.get(`${API_BASE_URL}/medicines/expiry-risk`)
      ]);
      setInventory(invRes.data.data || []);
      setRisks(riskRes.data.data || []);
    } catch (error) {
      console.error('Failed to load medicine intel', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading Medicine Intelligence...</div>;
  }

  return (
    <AppShell>
      <div className="p-8" style={{ padding: '2rem' }}>
        <h1 className="text-2xl font-bold mb-6" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box /> Medicine Intelligence
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>Live Inventory</h2>
            {inventory.length === 0 ? (
              <p>No inventory available.</p>
            ) : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>Medicine</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>Batch</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => (
                    <tr key={item.id}>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #f9f9f9' }}>{item.name}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #f9f9f9' }}>{item.batch_number}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #f9f9f9' }}>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>Expiry & Waste Risk</h2>
            {risks.length === 0 ? (
              <p>No immediate risks detected.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {risks.map(risk => (
                  <div key={risk.medicine_id} style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: `1px solid ${risk.waste_risk === 'HIGH' ? '#ffcccc' : '#eee'}`,
                    backgroundColor: risk.waste_risk === 'HIGH' ? '#fff0f0' : '#fff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{risk.name} (Batch: {risk.batch_number})</strong>
                      <span style={{ 
                        color: risk.waste_risk === 'HIGH' ? 'red' : 'green',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: risk.waste_risk === 'HIGH' ? '#ffebeb' : '#ebffeb'
                      }}>
                        {risk.waste_risk} RISK
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#555' }}>
                      <p>Days to Expiry: {risk.days_to_expiry} days</p>
                      <p>Expected Consumption: {risk.expected_consumption} units</p>
                      <p>Potential Leftover: {risk.potential_leftover} units</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
