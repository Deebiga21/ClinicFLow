import React, { useState, useEffect } from 'react';
import { X, Calendar, User, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function BookingWizard({ isOpen, onClose, patientId, onComplete }) {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'In-Person'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      // Let's use some mocked doctors for the wizard if the API isn't populated with doctors yet
      // This ensures the wizard works correctly visually
      setDoctors([
        { id: '1', name: 'Dr. Sarah Smith', specialization: 'Cardiology' },
        { id: '2', name: 'Dr. John Adams', specialization: 'General Practice' },
        { id: '3', name: 'Dr. Emily Lee', specialization: 'Neurology' }
      ]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:8000/api/patient/${patientId}/appointments`, formData);
      setStep(4);
      if (onComplete) onComplete();
    } catch (error) {
      console.error(error);
      alert("Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-sky-50">
          <h2 className="text-lg font-bold text-[#0A2540]">Book an Appointment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4 flex items-center gap-2">
          {[1, 2, 3].map(i => (
            <React.Fragment key={i}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= i ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {i}
              </div>
              {i < 3 && <div className={`flex-1 h-1 rounded ${step > i ? 'bg-sky-500' : 'bg-slate-100'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><User size={18} /> Select a Doctor</h3>
              <div className="grid gap-3">
                {doctors.map(d => (
                  <label key={d.id} className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${formData.doctor_id === d.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-sky-300'}`}>
                    <input type="radio" name="doctor" className="hidden" checked={formData.doctor_id === d.id} onChange={() => setFormData({...formData, doctor_id: d.id})} />
                    <div>
                      <div className="font-semibold text-slate-900">{d.name}</div>
                      <div className="text-sm text-slate-500">{d.specialization}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Calendar size={18} /> Choose Date & Time</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={formData.appointment_date} onChange={e => setFormData({...formData, appointment_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                  <input type="time" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={formData.appointment_time} onChange={e => setFormData({...formData, appointment_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Type</label>
                  <select className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={formData.appointment_type} onChange={e => setFormData({...formData, appointment_type: e.target.value})}>
                    <option value="In-Person">In-Person</option>
                    <option value="Teleconsult">Teleconsult</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><CheckCircle size={18} /> Confirm Details</h3>
              <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm border border-slate-200">
                <div className="flex justify-between"><span className="text-slate-500">Doctor:</span> <span className="font-semibold">{doctors.find(d => d.id === formData.doctor_id)?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date:</span> <span className="font-semibold">{formData.appointment_date}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Time:</span> <span className="font-semibold">{formData.appointment_time}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Type:</span> <span className="font-semibold">{formData.appointment_type}</span></div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Booking Confirmed!</h3>
              <p className="text-slate-500">Your appointment has been successfully scheduled.</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between">
          {step < 4 ? (
            <>
              {step > 1 ? (
                <button onClick={handleBack} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition">Back</button>
              ) : <div></div>}
              
              {step < 3 ? (
                <button 
                  onClick={handleNext} 
                  disabled={step === 1 && !formData.doctor_id}
                  className="px-6 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition disabled:opacity-50"
                >
                  Next Step
                </button>
              ) : (
                <button 
                  onClick={handleSubmit} 
                  disabled={loading || !formData.appointment_date || !formData.appointment_time}
                  className="px-6 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Confirming...' : 'Confirm Booking'}
                </button>
              )}
            </>
          ) : (
            <button onClick={onClose} className="w-full px-6 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
