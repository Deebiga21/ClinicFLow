import React, { useState, useEffect } from 'react';
import { X, Calendar, User, CheckCircle, FileText,  } from 'lucide-react';

// API helper
const API_BASE = 'http://localhost:8000/api';

export default function BookingWizard({ isOpen, onClose, patientId, onComplete }) {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  
  const [formData, setFormData] = useState({
    name: 'John Doe', // default
    dob: '1990-01-01',
    phone: '',
    email: '',
    reason: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'New Visit'
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      fetchDoctors();
    }
  }, [isOpen]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE}/doctors/availability`);
      const data = await res.json();
      setDoctors(data.data || []);
    } catch (e) {
      console.error(e);
      // Fallback
      setDoctors([
        { id: '1', name: 'Dr. Kumar', specialization: 'General Medicine', available: true, next_available: '10:30 AM' },
        { id: '2', name: 'Dr. Priya', specialization: 'Cardiology', available: true, next_available: '2:00 PM' }
      ]);
    }
  };

  const handleBook = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId || 'P_1234',
          doctor_id: formData.doctor_id,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          appointment_type: formData.appointment_type,
          patient_name: formData.name,
          doctor_name: doctors.find(d => d.id === formData.doctor_id)?.name
        })
      });
      const data = await res.json();
      setAppointmentDetails(data);
      setStep(3); // Go to Letter
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-[#0A2540]">Book Appointment</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>1. Details</span>
              <span className="text-gray-300">›</span>
              <span className={`text-xs font-semibold ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>2. Review</span>
              <span className="text-gray-300">›</span>
              <span className={`text-xs font-semibold ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>3. Letter</span>
              <span className="text-gray-300">›</span>
              <span className={`text-xs font-semibold ${step >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>4. Payment</span>
              <span className="text-gray-300">›</span>
              <span className={`text-xs font-semibold ${step >= 5 ? 'text-blue-600' : 'text-gray-400'}`}>5. Token</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">A. Patient & Visit Information</h3>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                  <input type="text" className="w-full p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                  <input type="text" className="w-full p-2 border rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Reason for Visit</label>
                  <textarea className="w-full p-2 border rounded h-20" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">B. Doctor Availability</h3>
                <div className="space-y-3">
                  {doctors.map(d => (
                    <div 
                      key={d.id} 
                      onClick={() => d.available && setFormData({...formData, doctor_id: d.id, appointment_time: d.next_available || '10:00 AM'})}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.doctor_id === d.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 bg-white hover:border-blue-300'} ${!d.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <strong className="text-[#0A2540]">{d.name}</strong>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${d.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {d.available ? 'AVAILABLE' : 'FULL'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{d.specialization || d.department}</div>
                      {d.available && <div className="text-xs text-blue-600 mt-2 font-medium">Next Slot: {d.next_available || '10:00 AM'}</div>}
                    </div>
                  ))}
                </div>
                {formData.doctor_id && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 mt-4">Selected Date</label>
                    <input type="date" className="w-full p-2 border rounded" value={formData.appointment_date} onChange={e => setFormData({...formData, appointment_date: e.target.value})} />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-center mb-6 text-[#0A2540]">Review Appointment</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Patient</span>
                  <span className="font-semibold">{formData.name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Doctor</span>
                  <span className="font-semibold">{doctors.find(d => d.id === formData.doctor_id)?.name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Date & Time</span>
                  <span className="font-semibold">{formData.appointment_date} | {formData.appointment_time}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Type</span>
                  <span className="font-semibold">{formData.appointment_type}</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && appointmentDetails && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-gray-300 shadow-sm relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600 rounded-t-xl"></div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-[#0A2540] tracking-tight">CLINICFLOW</h2>
                <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">AI-Powered Clinic Intelligence</p>
                <h3 className="mt-4 text-lg font-bold text-blue-600 border-b pb-4">APPOINTMENT CONFIRMATION LETTER</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-1">PATIENT DETAILS</p>
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Phone:</strong> {formData.phone || 'N/A'}</p>
                  <p><strong>Patient ID:</strong> {patientId}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">APPOINTMENT DETAILS</p>
                  <p><strong>Doctor:</strong> {doctors.find(d => d.id === formData.doctor_id)?.name}</p>
                  <p><strong>Date:</strong> {formData.appointment_date}</p>
                  <p><strong>Time:</strong> {formData.appointment_time}</p>
                  <p><strong>Appt ID:</strong> {appointmentDetails.id}</p>
                </div>
              </div>

              <div className="mt-8 bg-gray-50 p-4 rounded text-xs text-gray-600 border border-gray-200">
                <p className="font-bold mb-2">Instructions:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Please arrive 15 minutes before the appointment time.</li>
                  
                  <li>Carry any previous reports or referral documents.</li>
                </ul>
              </div>
            </div>
          )}

          

          {step === 4 && appointmentDetails?.token && (
            <div className="max-w-md mx-auto text-center">
              <div className="bg-white p-8 rounded-xl border-2 border-blue-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
                <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-2">YOUR TOKEN</p>
                <h1 className="text-6xl font-black text-[#0A2540] mb-6">{appointmentDetails.token}</h1>
                
                <p className="text-sm text-gray-500 mb-2">Please watch the live queue monitor for your token to be called.</p>
                
                <button 
                  onClick={() => {
                    onClose();
                    if (onComplete) onComplete();
                  }}
                  className="mt-6 w-full bg-[#0A2540] text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {step < 3 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg">Cancel</button>
            {step === 1 && <button onClick={() => setStep(2)} disabled={!formData.doctor_id || !formData.appointment_date} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50">Continue</button>}
            {step === 2 && <button onClick={handleBook} disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50">{loading ? 'Booking...' : 'Confirm Appointment'}</button>}
          </div>
        )}
        {step === 3 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
            <button onClick={() => setStep(4)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg">View Token</button>
          </div>
        )}
      </div>
    </div>
  );
}
