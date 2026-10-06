import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useClinicWebSocket } from '../../hooks/useClinicWebSocket';
import { 
  Home, Users, Stethoscope, Activity, Cpu, Crosshair, 
  TrendingUp, AlertTriangle, Box, Pill, FileText,
  Bell, Settings, List, Calendar, UserCheck, MessageCircle, Bot, User
} from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import Header from '../shared/Header';
import GlobalBackground from '../shared/GlobalBackground';


const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'bell'; // fallback to sine if invalid
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export default function NurseLayout() {
  const location = useLocation();
  const { lastEvent } = useClinicWebSocket();

  useEffect(() => {
    if (lastEvent) {
      const data = lastEvent?.data || lastEvent;
      const eventName = data?.event;
      if (eventName === 'appointment_created') {
        playNotificationSound();
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}>
            <div className="flex-1 w-0 p-4 border-l-4 border-blue-500">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">🔔 New Appointment</p>
                  <p className="text-sm font-bold text-gray-900">{data.patient_name || 'Patient'} - {data.appointment_id ? data.appointment_id.substring(0,8).toUpperCase() : 'NEW'}</p>
                  <p className="mt-1 text-sm text-gray-700 break-words">
                    <span className="font-semibold text-gray-500">Reason:</span> {data.reason || data.type || 'N/A'}
                  </p>
                  {data.symptoms && (
                    <p className="mt-1 text-sm text-gray-700 break-words">
                      <span className="font-semibold text-gray-500">Symptoms:</span> {data.symptoms}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ), { duration: 8000, position: 'top-right' });
      }
    }
  }, [lastEvent]);

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
      <Toaster />
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
