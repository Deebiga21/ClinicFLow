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

export default function PatientLayout() {
  const location = useLocation();
  const patientId = localStorage.getItem('demo_patient_id') || 'P_1';
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useClinicWebSocket();

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
      title: 'MY VISIT',
      links: [
        { to: '/patient', end: true, icon: Home, label: 'Home' },
        { to: '/patient/my-visit', icon: Clock, label: 'My Visit' },
        { to: '/patient/journey', icon: Map, label: 'My Journey' }
      ]
    },
    {
      title: 'APPOINTMENTS',
      links: [
        { to: '/patient/appointments', icon: Calendar, label: 'Appointments' }
      ]
    },
    {
      title: 'MEDICATION & CARE',
      links: [
        { to: '/patient/prescriptions', icon: FileText, label: 'Prescriptions' },
        { to: '/patient/medications', icon: Pill, label: 'Medications' }
      ]
    },
    {
      title: 'COMMUNICATION',
      links: [
        { to: '/patient/notifications', icon: Bell, label: 'Notifications' }
      ]
    },
    {
      title: 'ACCOUNT',
      links: [
        { to: '/patient/profile', icon: User, label: 'Profile' }
      ]
    }
  ];

  const routeNameMap = {
    '/patient': { title: data?.patient?.name ? `Good morning, ${data.patient.name.split(' ')[0]}` : 'Good morning', sub: 'Here is your clinic visit at a glance' },
    '/patient/my-visit': { title: 'My Visit', sub: 'Current waiting status' },
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
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet context={{ patientId, data, loading, fetchData }} />
        </main>
      </div>
    </div>
  );
}
