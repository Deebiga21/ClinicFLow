import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function MedSchedule() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/medications/prescriptions`);
      setPrescriptions(res.data.data || []);
    } catch (error) {
      console.error('Failed to load prescriptions', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <><div className="p-8 text-center">Loading Medication Schedules...</div></>;
  }

  return (
    <>
      <div className="p-8" style={{ padding: '2rem' }}>
        <h1 className="text-2xl font-bold mb-6" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock /> Medication Schedule
        </h1>

        {prescriptions.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px' }}>
            No active prescriptions found. Schedule will be generated automatically when a doctor prescribes medicine.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {prescriptions.map(prescription => (
              <div key={prescription.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 'bold', margin: 0 }}>Patient ID: {prescription.patient_id}</h3>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                    {prescription.status}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1rem' }}>
                  {prescription.medications?.map((med, idx) => (
                    <div key={idx} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: idx < prescription.medications.length - 1 ? '1px solid #eee' : 'none' }}>
                      <strong>{med.medicine_name}</strong> - {med.dose}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {med.frequency}</span>
                        <span>{med.duration} days</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  style={{ width: '100%', padding: '0.5rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => alert(`View schedule for patient ${prescription.patient_id}`)}
                >
                  View Detailed Schedule
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
