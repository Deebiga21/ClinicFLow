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
              value={patientId}
              onChange={handlePatientChange}
              className="bg-transparent border-none outline-none font-bold text-[#0A2540] cursor-pointer"
            >
              <option value="P_1">Patient P_1 (A-24)</option>
              <option value="P_2">Patient P_2 (A-25)</option>
              <option value="P_3">Patient P_3 (A-26)</option>
              <option value="P_4">Patient P_4</option>
            </select>
          </div>
        </div>
        <main className="flex-1 p-6 overflow-x-hidden pt-4">
          <Outlet context={{ patientId, data, loading, fetchData }} />
        </main>
      </div>
    </div>
  );
}
