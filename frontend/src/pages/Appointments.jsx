import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, Clock as ClockIcon, XCircle, AlertCircle, PlayCircle, MoreHorizontal } from 'lucide-react';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';
import { useClinicWebSocket } from '../hooks/useClinicWebSocket';
import AppointmentModal from '../components/AppointmentModal';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const { token } = useAuth();
  
  const { lastEvent } = useClinicWebSocket();

  const fetchAppointments = useCallback(() => {
    fetch(`${API_BASE}/appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAppointments(Array.isArray(data.data) ? data.data : (data.appointments || []));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching appointments:', err);
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (lastEvent) {
      const ev = lastEvent?.data?.event || lastEvent?.event;
      if (ev === 'appointment_created' || ev === 'patient_checked_in') {
        fetchAppointments();
      }
    }
  }, [lastEvent, fetchAppointments]);


  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/status?status=${status}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAppointments();
      else alert("Failed to update status");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAppointments();
      else alert("Failed to check in");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (formData) => {
    try {
      const isEdit = !!editingAppointment;
      const url = isEdit 
        ? `${API_BASE}/appointments/${editingAppointment.id}`
        : `${API_BASE}/appointments`;
      
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingAppointment(null);
        fetchAppointments();
      } else {
        alert("Failed to save appointment");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAppointments();
      else alert("Failed to delete appointment");
    } catch (err) {
      console.error(err);
    }
  };

  const handleProceedToBill = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/notify-billing`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) alert("Notified patient to proceed to billing!");
      else alert("Failed to notify patient");
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'waiting': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'no-show': return 'text-gray-600 bg-gray-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return <CheckCircle size={16} />;
      case 'waiting': return <PlayCircle size={16} />;
      case 'scheduled': return <ClockIcon size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="mt-1 text-sm text-gray-500">Manage patient appointments and schedules</p>
          </div>
          <button onClick={() => { setEditingAppointment(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm">
            New Appointment
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-8 text-center border border-gray-200">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new appointment.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
            <ul className="divide-y divide-gray-200">
              {appointments.map((apt) => (
                <li key={apt.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <User className="flex-shrink-0 mr-3 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-bold text-gray-900 truncate">{apt.patient_name || apt.name || 'Unknown Patient'}</p>
                          <p className="text-xs text-gray-500">With {apt.doctor_name || 'Doctor'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 ${getStatusColor(apt.status)}`}>
                          {getStatusIcon(apt.status)}
                          {apt.status || 'Scheduled'}
                        </span>
                        
                        {/* Actions based on status */}
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingAppointment(apt); setIsModalOpen(true); }} className="text-xs font-semibold px-2 py-1 bg-gray-50 text-gray-700 rounded border border-gray-200 hover:bg-gray-100 transition">Edit</button>
                          
                          {apt.status === 'Scheduled' && (
                            <>
                              <button onClick={() => handleStatusUpdate(apt.id, 'Confirmed')} className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 transition">Confirm</button>
                              <button onClick={() => handleCheckIn(apt.id)} className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition">Check In</button>
                            </>
                          )}
                          {apt.status === 'Confirmed' && (
                            <>
                              <button onClick={() => handleCheckIn(apt.id)} className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition">Check In</button>
                              <button onClick={() => handleStatusUpdate(apt.id, 'No-Show')} className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200 transition">No Show</button>
                            </>
                          )}
                          {(apt.status === 'Scheduled' || apt.status === 'Confirmed') && (
                            <button onClick={() => handleStatusUpdate(apt.id, 'Cancelled')} className="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200 hover:bg-amber-100 transition">Cancel</button>
                          )}
                          
                          <button onClick={() => handleDelete(apt.id)} className="text-xs font-semibold px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 transition">Delete</button>
                          <button onClick={() => handleProceedToBill(apt.id)} className="text-xs font-semibold px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-200 hover:bg-purple-100 transition whitespace-nowrap">Proceed to Bill</button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 mr-6">
                          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {apt.time || apt.appointment_time || 'N/A'}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {apt.patient_contact || apt.contact || 'No contact info'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <p>
                          {apt.date || apt.appointment_date || new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingAppointment(null); }}
        onSave={handleSave}
        appointment={editingAppointment}
      />
    </div>
  );
}
