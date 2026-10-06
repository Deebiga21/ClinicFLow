import React, { useState, useEffect } from 'react';
import { X, Calendar, User, CheckCircle, FileText, Upload } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { API_BASE } from '../../config';

export default function BookingWizard({ isOpen, onClose, patientId, onComplete }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  
  const [formData, setFormData] = useState({
    // Step 1
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    dob: '1990-01-01',
    gender: 'Other',
    address: '',
    emergency_contact: '',
    // Step 2
    reason: '',
    what_happened: '',
    symptoms: '',
    when_started: '',
    duration: '',
    visit_type: 'New Visit',
    visited_before: 'No',
    consulted_before: 'No',
    // Step 3
    department: 'General Medicine',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    // Step 4
    documents: []
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      fetchDoctors();
      if (user) {
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || ''
        }));
      }
    }
  }, [isOpen, user]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE}/doctors/availability`);
      const data = await res.json();
      setDoctors(data.data || []);
    } catch (e) {
      console.error(e);
      setDoctors([
        { id: '1', name: 'Dr. Kumar', department: 'General Medicine', available: true, next_available: '10:30 AM' },
        { id: '2', name: 'Dr. Priya', department: 'Cardiology', available: true, next_available: '2:00 PM' },
        { id: '3', name: 'Dr. Smith', department: 'Orthopedics', available: true, next_available: '11:15 AM' },
        { id: '4', name: 'Dr. Aisha', department: 'Gynecology', available: true, next_available: '09:00 AM' },
        { id: '5', name: 'Dr. Ramesh', department: 'Pediatrics', available: true, next_available: '01:30 PM' }
      ]);
    }
  };

  // Auto-predict Department from reason and symptoms using ML Endpoint
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionMessage, setPredictionMessage] = useState('');

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!formData.reason && !formData.symptoms) return;
      
      setIsPredicting(true);
      try {
        const res = await fetch(`${API_BASE}/predictions/department`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: formData.reason,
            symptoms: formData.symptoms
          })
        });
        const data = await res.json();
        if (data.predicted_department && data.predicted_department !== formData.department) {
          setFormData(prev => ({ ...prev, department: data.predicted_department }));
          setPredictionMessage(`✨ AI Suggested Department: ${data.predicted_department}`);
          setTimeout(() => setPredictionMessage(''), 5000);
        }
      } catch (err) {
        console.error('Failed to predict department', err);
      } finally {
        setIsPredicting(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchPrediction();
    }, 1000); // 1s debounce

    return () => clearTimeout(delayDebounceFn);
  }, [formData.reason, formData.symptoms]);

  const handleBook = async () => {
    setLoading(true);
    try {
      const doctor = doctors.find(d => d.id === formData.doctor_id);
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: formData.doctor_id,
          date: formData.appointment_date,
          time: formData.appointment_time,
          appointment_type: formData.visit_type,
          reason: formData.reason,
          symptoms: formData.symptoms,
          symptom_start: formData.when_started,
          additional_information: formData.what_happened,
          status: 'Confirmed'
        })
      });
      const data = await res.json();
      setAppointmentDetails(data);
      setStep(6);
      if(onComplete) onComplete();
    } catch (e) {
      console.error(e);
      alert('Failed to book appointment');
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
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map(s => (
                <React.Fragment key={s}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s ? 'text-blue-600' : 'text-gray-400'}`}>
                    {s === 1 ? '1. Patient' : s === 2 ? '2. Visit' : s === 3 ? '3. Appt' : s === 4 ? '4. Docs' : '5. Review'}
                  </span>
                  {s < 5 && <span className="text-gray-300">›</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          
          {/* STEP 1: PATIENT DETAILS */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="font-bold text-xl text-[#0A2540] border-b pb-2">Patient Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                  <input type="text" className="w-full p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                  <input type="text" className="w-full p-2 border rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input type="email" className="w-full p-2 border rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                  <input type="date" className="w-full p-2 border rounded" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Gender</label>
                  <select className="w-full p-2 border rounded" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Emergency Contact</label>
                  <input type="text" className="w-full p-2 border rounded" value={formData.emergency_contact} onChange={e => setFormData({...formData, emergency_contact: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Address</label>
                  <input type="text" className="w-full p-2 border rounded" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VISIT INFORMATION */}
          {step === 2 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="font-bold text-xl text-[#0A2540] border-b pb-2">Visit Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Why are you coming to the clinic?</label>
                  <input type="text" placeholder="e.g. Fever, Routine checkup" className="w-full p-2 border rounded" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">What happened?</label>
                  <textarea className="w-full p-2 border rounded h-16" value={formData.what_happened} onChange={e => setFormData({...formData, what_happened: e.target.value})}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">What symptoms are you experiencing?</label>
                  <input type="text" placeholder="e.g. Headache, Cough" className="w-full p-2 border rounded" value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">When did the symptoms start?</label>
                    <input type="date" className="w-full p-2 border rounded" value={formData.when_started} onChange={e => setFormData({...formData, when_started: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">How long have you been experiencing them?</label>
                    <input type="text" placeholder="e.g. 3 days" className="w-full p-2 border rounded" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Visit Type</label>
                    <select className="w-full p-2 border rounded" value={formData.visit_type} onChange={e => setFormData({...formData, visit_type: e.target.value})}>
                      <option>New Visit</option><option>Follow-up</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Visited before?</label>
                    <select className="w-full p-2 border rounded" value={formData.visited_before} onChange={e => setFormData({...formData, visited_before: e.target.value})}>
                      <option>No</option><option>Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Consulted before?</label>
                    <select className="w-full p-2 border rounded" value={formData.consulted_before} onChange={e => setFormData({...formData, consulted_before: e.target.value})}>
                      <option>No</option><option>Yes</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: APPOINTMENT DETAILS */}
          {step === 3 && (
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-xl text-[#0A2540] border-b pb-2">Select Doctor</h3>
                <div>
                  {predictionMessage && (
                    <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-200 shadow-sm flex items-center gap-2 transition-all">
                      <span className="font-semibold">{predictionMessage}</span>
                    </div>
                  )}
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                  <select className="w-full p-2 border rounded" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                    <option value="">All Departments</option>
                    <option>General Medicine</option>
                    <option>Cardiology</option>
                    <option>Orthopedics</option>
                    <option>Pediatrics</option>
                    <option>Gynecology</option>
                    <option>Dermatologist</option>
                    <option>Ophthalmologist</option>
                    <option>Dentist</option>
                    <option>Psychiatrist</option>
                    <option>Oncologist</option>
                    <option>Neurologist</option>
                    <option>Nephrologist</option>
                    <option>Pulmonologist</option>
                    <option>Geriatrician</option>
                    <option>Gastroenterologist</option>
                  </select>
                </div>
                <div className="space-y-3 mt-4">
                  {doctors.filter(d => !formData.department || formData.department === "All Departments" || d.department === formData.department || d.specialization === formData.department).map(d => (
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
                  {doctors.filter(d => !formData.department || formData.department === "All Departments" || d.department === formData.department || d.specialization === formData.department).length === 0 && (
                    <div className="p-4 text-center text-gray-500 bg-white rounded border border-dashed">No doctors available in this department.</div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-xl text-[#0A2540] border-b pb-2">Schedule Time</h3>
                {formData.doctor_id ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                      <input type="date" className="w-full p-2 border rounded" value={formData.appointment_date} onChange={e => setFormData({...formData, appointment_date: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                      <select className="w-full p-2 border rounded" value={formData.appointment_time} onChange={e => setFormData({...formData, appointment_time: e.target.value})}>
                        <option>09:00 AM</option><option>09:30 AM</option><option>10:00 AM</option>
                        <option>10:30 AM</option><option>11:00 AM</option><option>11:30 AM</option>
                        <option>12:00 PM</option><option>02:00 PM</option><option>02:30 PM</option>
                        <option>03:00 PM</option><option>03:30 PM</option><option>04:00 PM</option>
                        <option>04:30 PM</option><option>05:00 PM</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-gray-400 border border-dashed rounded-lg h-32 flex items-center justify-center">
                    Select a doctor first
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: OPTIONAL DOCUMENTS */}
          {step === 4 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="font-bold text-xl text-[#0A2540] border-b pb-2">Optional Documents</h3>
              <p className="text-gray-500 text-sm">Upload any previous prescriptions, medical reports, or referral letters to help the doctor understand your case better.</p>
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative"
              >
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    if(e.target.files && e.target.files.length > 0) {
                      alert(`Mock Upload: ${e.target.files[0].name} selected successfully!`);
                    }
                  }} 
                />
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="font-semibold text-[#0A2540]">Click to upload or drag & drop</p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {step === 5 && (
            <div className="max-w-2xl mx-auto space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-xl text-[#0A2540] border-b pb-4 text-center">Review Your Appointment</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 border-b pb-1">Patient</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-gray-500">Name:</div><div className="font-semibold text-[#0A2540]">{formData.name}</div>
                    <div className="text-gray-500">Phone:</div><div className="font-semibold text-[#0A2540]">{formData.phone}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 border-b pb-1">Visit</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-gray-500">Reason:</div><div className="font-semibold text-[#0A2540]">{formData.reason || '--'}</div>
                    <div className="text-gray-500">Symptoms:</div><div className="font-semibold text-[#0A2540]">{formData.symptoms || '--'}</div>
                    <div className="text-gray-500">Started:</div><div className="font-semibold text-[#0A2540]">{formData.when_started || '--'}</div>
                    <div className="text-gray-500">Visit Type:</div><div className="font-semibold text-[#0A2540]">{formData.visit_type}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 border-b pb-1">Appointment</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-gray-500">Doctor:</div><div className="font-semibold text-[#0A2540]">{doctors.find(d => d.id === formData.doctor_id)?.name}</div>
                    <div className="text-gray-500">Department:</div><div className="font-semibold text-[#0A2540]">{formData.department}</div>
                    <div className="text-gray-500">Date:</div><div className="font-semibold text-[#0A2540]">{formData.appointment_date}</div>
                    <div className="text-gray-500">Time:</div><div className="font-semibold text-[#0A2540]">{formData.appointment_time}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: CONFIRMATION LETTER */}
          {step === 6 && appointmentDetails && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-gray-300 shadow-sm relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600 rounded-t-xl"></div>
              <div className="text-center mb-8">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-2xl font-bold text-[#0A2540]">APPOINTMENT CONFIRMED</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-8 text-sm bg-gray-50 p-6 rounded-lg border border-gray-100">
                <div>
                  <p className="text-gray-500 text-[10px] font-bold tracking-wider mb-2">PATIENT DETAILS</p>
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Patient ID:</strong> {patientId}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] font-bold tracking-wider mb-2">APPOINTMENT DETAILS</p>
                  <p><strong>Appt ID:</strong> <span className="font-mono bg-blue-100 text-blue-800 px-1 rounded">{appointmentDetails.id || appointmentDetails.appointment_id || 'CF-NEW'}</span></p>
                  <p><strong>Doctor:</strong> {doctors.find(d => d.id === formData.doctor_id)?.name}</p>
                  <p><strong>Dept:</strong> {formData.department}</p>
                  <p><strong>Date & Time:</strong> {formData.appointment_date}, {formData.appointment_time}</p>
                  <p><strong>Status:</strong> <span className="text-green-600 font-bold">CONFIRMED</span></p>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center">
                <QRCodeSVG value={appointmentDetails.id || appointmentDetails.appointment_id || 'CF-NEW'} size={120} />
              </div>

              <div className="mt-6 text-center text-xs text-gray-500">
                <p>Please present this QR code at the reception when you arrive.</p>
              </div>
              
              <button 
                  onClick={onClose}
                  className="mt-8 w-full bg-[#0A2540] text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  VIEW ON MY DASHBOARD
              </button>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {step < 6 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg">Back</button>
            ) : (
              <div></div>
            )}
            
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg">Cancel</button>
              
              {step === 1 && <button onClick={() => setStep(2)} disabled={!formData.name} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50">Next</button>}
              
              {step === 2 && <button onClick={() => setStep(3)} disabled={!formData.reason} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50">Next</button>}
              
              {step === 3 && <button onClick={() => setStep(4)} disabled={!formData.doctor_id || !formData.appointment_date} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50">Next</button>}
              
              {step === 4 && <button onClick={() => setStep(5)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg">Review</button>}
              
              {step === 5 && <button onClick={handleBook} disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50">{loading ? 'Confirming...' : 'CONFIRM APPOINTMENT'}</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
