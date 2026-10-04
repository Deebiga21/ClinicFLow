import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { 
  Home, Clock, Map, Calendar, Pill, FileText, Bell, User
} from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import Header from '../shared/Header';
import GlobalBackground from '../shared/GlobalBackground';
import { api } from '../../services/api';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';

import BookingWizard from '../../pages/patient/BookingWizard';

export default function PatientLayout() {
  const location = useLocation();
  const [bookingOpen, setBookingOpen] = React.useState(false);
  const [patientId, setPatientId] = useState(localStorage.getItem('demo_patient_id') || 'P_1');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useClinicWebSocket();

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
        { to: '/patient/profile', icon: User, label: 'PROFILE' }
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
  };

  const currentMeta = routeNameMap[location.pathname] || routeNameMap['/patient'];

  return (
    <div className="min-h-screen flex font-sans text-slate-800">
      <GlobalBackground />
      <Sidebar items={patientItems} role="patient" />
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative">
        <Header title={currentMeta.title} subtitle={currentMeta.sub} role="patient" />
        <div className="flex justify-end px-6 pt-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-sm font-medium">
            <span className="text-slate-500">Viewing as:</span>
            <select 
              className="bg-transparent border-none outline-none font-bold text-[#0A2540] cursor-pointer"
              value={patientId}
              onChange={handlePatientChange}
            >
              {[...Array(10)].map((_, i) => (
                <option key={`P_${i+1}`} value={`P_${i+1}`}>Patient {i+1}</option>
              ))}
            </select>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ data, loading }} />
        </main>
        <BookingWizard isOpen={bookingOpen} onClose={() => setBookingOpen(false)} patientId={data?.patient?.id || patientId} />
      </div>
    </div>
  );
}
