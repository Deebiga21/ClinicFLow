import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { 
  Home, Clock, Map, Calendar, Pill, FileText, Bell, User, MessageCircle
} from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import Header from '../shared/Header';
import GlobalBackground from '../shared/GlobalBackground';
import { api } from '../../services/api';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';
import { useAuth } from '../../context/AuthContext';

import BookingWizard from '../../pages/patient/BookingWizard';

export default function PatientLayout() {
  const location = useLocation();
  const [bookingOpen, setBookingOpen] = React.useState(false);
  const { user } = useAuth();
  const [patientId, setPatientId] = useState(user?.patient_id || 'P_1');

  // Sync patientId if user changes
  useEffect(() => {
    if (user?.patient_id) setPatientId(user.patient_id);
  }, [user]);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useClinicWebSocket();

  // Watch for "patient_called" event
  const [toast, setToast] = useState(null);
  
  useEffect(() => {
    if (
      ['patient_called', 'NURSE_PREPARATION_STARTED', 'PATIENT_READY', 'PATIENT_SENT_TO_DOCTOR'].includes(lastEvent?.event) && 
      lastEvent?.data?.patient_id === patientId
    ) {
      let msg = "Your turn — The doctor is ready for your consultation.";
      let title = "🔔 YOUR TURN";
      if (lastEvent.event === 'NURSE_PREPARATION_STARTED') {
         title = "🔔 NURSE PREPARATION";
         msg = "Please proceed to the Nurse Station for vitals and preparation.";
      } else if (lastEvent.event === 'PATIENT_READY') {
         title = "⏳ READY";
         msg = "Your preparation is complete. The doctor will see you shortly.";
      } else if (lastEvent.event === 'PATIENT_SENT_TO_DOCTOR') {
         title = "🩺 DOCTOR IS READY";
         msg = "Please proceed to the doctor's consultation room.";
      }
      setToast({ title, message: msg, bgColor: "bg-blue-600" });
      setTimeout(() => setToast(null), 10000);
    }
  }, [lastEvent, patientId]);


  const handlePatientChange = (e) => {
    const newId = e.target.value;
    localStorage.setItem('demo_patient_id', newId);
    setPatientId(newId);
    setLoading(true);
  };

  const fetchData = async () => {
    try {
      const result = await api.getPatientDashboard(patientId);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId, lastEvent]);

  
  const patientItems = [
    {
      title: 'DASHBOARD',
      links: [
        { to: '/patient', end: true, icon: Home, label: 'HOME' },
        { to: '/patient/appointments', icon: Calendar, label: 'MY APPOINTMENTS' },
        { to: '#', onClick: () => setBookingOpen(true), icon: Calendar, label: 'BOOK APPOINTMENT' },
        { to: '/patient/my-visit', icon: Clock, label: 'MY TOKEN' },
        { to: '/patient/journey', icon: Map, label: 'MY JOURNEY' }
      ]
    },
    {
      title: 'RECORDS',
      links: [
        { to: '/patient/prescriptions', icon: FileText, label: 'PRESCRIPTIONS' },
        { to: '/patient/medications', icon: Pill, label: 'MEDICATIONS' },
      ]
    },
    {
      title: 'ACCOUNT',
      links: [
        { to: '/patient/notifications', icon: Bell, label: 'NOTIFICATIONS' },
        { to: '/patient/profile', icon: User, label: 'PROFILE' },
        { to: '/patient/chat', icon: MessageCircle, label: 'NURSE CHAT' }
      ]
    }
  ];

  const routeNameMap = {
    '/patient': { title: data?.patient?.name ? `Good morning, ${data.patient.name.split(' ')[0]}` : 'Good morning', sub: 'Here is your clinic visit at a glance' },
    '/patient/my-visit': { title: 'My Token', sub: 'Your live token status and wait time' },
    '/patient/journey': { title: 'My Care Journey', sub: 'Your complete step-by-step progress' },
    '/patient/appointments': { title: 'Appointments', sub: 'Manage your upcoming visits' },
    '/patient/prescriptions': { title: 'My Prescriptions', sub: 'Approved clinician prescriptions' },
    '/patient/medications': { title: 'My Medication Schedule', sub: 'Your active medicine plan' },
    '/patient/notifications': { title: 'Notifications', sub: 'Important updates for your care' },
    '/patient/profile': { title: 'Profile', sub: 'Your details and preferences' },
    '/patient/chat': { title: 'Nurse Chat', sub: 'Chat directly with clinical staff' },
  };

  const currentMeta = routeNameMap[location.pathname] || routeNameMap['/patient'];

  return (
    <div className="min-h-screen flex font-sans text-slate-800">
      <GlobalBackground />
      <Sidebar items={patientItems} role="patient" />
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative">
        <Header title={currentMeta.title} subtitle={currentMeta.sub} role="patient" />
        
        
        {toast && (
          <div className={`fixed top-4 right-4 ${toast.bgColor || 'bg-blue-600'} text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce`}>
             <h4 className="font-black text-lg mb-1">{toast.title || 'Notification'}</h4>
             <p className="text-sm font-medium">{toast.message || toast}</p>
          </div>
        )}
        <main className="flex-1 overflow-y-auto">

          <Outlet context={{ data, loading }} />
        </main>
        <BookingWizard isOpen={bookingOpen} onClose={() => setBookingOpen(false)} patientId={data?.patient?.id || patientId} />
      </div>
    </div>
  );
}


