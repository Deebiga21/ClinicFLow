import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { 
  Home, Users, Stethoscope, Activity, Cpu, Crosshair, 
  TrendingUp, AlertTriangle, Box, Pill, FileText,
  Bell, Settings, List, Calendar, UserCheck, MessageCircle, Bot, User
} from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import Header from '../shared/Header';
import GlobalBackground from '../shared/GlobalBackground';

export default function NurseLayout() {
  const location = useLocation();

  const nurseItems = [
    {
      title: 'CORE',
      links: [
        { to: '/nurse', end: true, icon: Home, label: 'HOME' },
        { to: '/nurse/live-queue', icon: List, label: 'LIVE QUEUE' },
        { to: '/nurse/appointments', icon: Calendar, label: 'APPOINTMENTS' },
        { to: '/nurse/patients', icon: Users, label: 'PATIENTS' },
        { to: '/nurse/patient-preparation', icon: UserCheck, label: 'PATIENT PREPARATION' },
        { to: '/nurse/patient-flow', icon: Activity, label: 'PATIENT JOURNEY' }
      ]
    },
    {
      title: 'INTELLIGENCE',
      links: [
        { to: '/nurse/doctor-workload', icon: Stethoscope, label: 'DOCTOR AVAILABILITY' },
        { to: '/nurse/predictions', icon: Crosshair, label: 'PREDICTIONS' },
        { to: '/nurse/congestion', icon: AlertTriangle, label: 'CONGESTION' }
      ]
    },
    {
      title: 'COMMUNICATION & OPERATIONS',
      links: [
        { to: '/nurse/chat', icon: MessageCircle, label: 'NURSE CHAT' },
        { to: '/nurse/assistant', icon: Bot, label: 'AI ASSISTANT' },
        { to: '/nurse/medicines', icon: Pill, label: 'MEDICINE OPERATIONS' }
      ]
    },
    {
      title: 'SYSTEM',
      links: [
        { to: '/nurse/notifications', icon: Bell, label: 'NOTIFICATIONS' },
        { to: '/nurse/settings', icon: User, label: 'PROFILE' }
      ]
    }
  ];

  const routeNameMap = {
    '/nurse': { title: 'Nurse Dashboard', sub: 'Predictive clinic intelligence' },
    '/nurse/live-queue': { title: 'Live Queue', sub: 'Current waiting patients' },
    '/nurse/appointments': { title: 'Appointments', sub: 'Upcoming schedules' },
    '/nurse/patients': { title: 'Patients', sub: 'Patient records and management' },
    '/nurse/patient-preparation': { title: 'Patient Preparation', sub: 'Vitals and pre-consultation' },
    '/nurse/patient-flow': { title: 'Patient Journey', sub: 'Understand the complete operational patient journey' },
    '/nurse/doctor-workload': { title: 'Doctor Availability', sub: 'Active consultations and expected capacity' },
    '/nurse/predictions': { title: 'Live ML Predictions', sub: 'Real-time inferences' },
    '/nurse/congestion': { title: 'Congestion Forecast', sub: 'Current vs predicted clinic crowding' },
    '/nurse/chat': { title: 'Nurse Chat', sub: 'Internal communication' },
    '/nurse/assistant': { title: 'AI Assistant', sub: 'Smart clinic assistant' },
    '/nurse/medicines': { title: 'Medicine Operations', sub: 'Inventory and demand insights' },
    '/nurse/notifications': { title: 'Notifications', sub: 'System alerts' },
    '/nurse/settings': { title: 'Profile', sub: 'User settings and preferences' },
  };

  const currentMeta = routeNameMap[location.pathname] || routeNameMap['/nurse'];

  return (
    <div className="min-h-screen flex font-sans text-slate-800">
      <GlobalBackground />
      <Sidebar items={nurseItems} role="nurse" />
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative">
        <Header title={currentMeta?.title || 'Nurse Dashboard'} subtitle={currentMeta?.sub || ''} role="nurse" />
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
