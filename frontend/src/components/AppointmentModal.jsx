import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppointmentModal({ isOpen, onClose, onSave, appointment = null }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_time: '',
    appointment_date: new Date().toISOString().split('T')[0],
    reason: '',
    type: 'In-Person',
  });

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch patients and doctors for dropdowns
      fetch('http://localhost:8000/api/settings/patients', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setPatients(data.data || []))
        .catch(console.error);

      fetch('http://localhost:8000/api/doctors', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setDoctors(data.data || []))
        .catch(console.error);

      if (appointment) {
        setFormData({
          patient_id: appointment.patient_id || '',
          doctor_id: appointment.doctor_id || '',
          appointment_time: appointment.appointment_time || appointment.time || '',
          appointment_date: appointment.appointment_date || appointment.date || '',
          reason: appointment.reason || '',
          type: appointment.type || 'In-Person',
        });
      } else {
        setFormData({
          patient_id: '',
          doctor_id: '',
          appointment_time: '',
          appointment_date: new Date().toISOString().split('T')[0],
          reason: '',
          type: 'In-Person',
        });
      }
    }
  }, [isOpen, appointment, token]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">{appointment ? 'Edit Appointment' : 'New Appointment'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="appointmentForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Patient</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.patient_id}
                onChange={e => setFormData({...formData, patient_id: e.target.value})}
                required
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Doctor</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.doctor_id}
                onChange={e => setFormData({...formData, doctor_id: e.target.value})}
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map(d => (
                  <option key={d.id || d._id} value={d.id || d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                <input 
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.appointment_date}
                  onChange={e => setFormData({...formData, appointment_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                <input 
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.appointment_time}
                  onChange={e => setFormData({...formData, appointment_time: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                required
              >
                <option value="In-Person">In-Person</option>
                <option value="Teleconsult">Teleconsult</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Visit</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
                placeholder="Brief description..."
              />
            </div>
          </form>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" form="appointmentForm" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
            Save Appointment
          </button>
        </div>
      </div>
    </div>
  );
}
