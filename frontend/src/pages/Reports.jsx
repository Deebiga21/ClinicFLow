import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download } from 'lucide-react';
import { API_BASE_URL } from '../config';
import AppShell from '../components/AppShell';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/reports/daily`);
      setReport(res.data.data || {});
    } catch (error) {
      console.error('Failed to load reports', error);
      // Dummy data for demo if API fails
      setReport({
        patients_served: 42,
        appointments: 50,
        average_wait: '24 min',
        average_consultation: '14 min',
        peak_hour: '11:00 AM',
        congestion_events: 2,
        doctor_workload: 'High (85%)'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AppShell><div className="p-8 text-center">Loading Daily Reports...</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="p-8" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 className="text-2xl font-bold" style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText /> Daily Operational Report
          </h1>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', background: '#0284c7', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
            <Download size={16} /> Export PDF
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1' }}>{report.patients_served || 0}</div>
            <div style={{ fontSize: '0.9rem', color: '#555' }}>Patients Served</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1' }}>{report.appointments || 0}</div>
            <div style={{ fontSize: '0.9rem', color: '#555' }}>Total Appointments</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1' }}>{report.average_wait || '0 min'}</div>
            <div style={{ fontSize: '0.9rem', color: '#555' }}>Average Wait</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1' }}>{report.average_consultation || '0 min'}</div>
            <div style={{ fontSize: '0.9rem', color: '#555' }}>Avg Consultation</div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Insights & Analytics</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f9f9f9', fontWeight: '500' }}>Peak Hour</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f9f9f9' }}>{report.peak_hour || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f9f9f9', fontWeight: '500' }}>Congestion Events</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f9f9f9' }}>{report.congestion_events || 0} alerts</td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f9f9f9', fontWeight: '500' }}>Overall Doctor Workload</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f9f9f9' }}>{report.doctor_workload || 'Normal'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
