import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { 
  Home, Users, Stethoscope, Activity, Cpu, Crosshair, 
  TrendingUp, AlertTriangle, Box, Pill, FileText,
  Bell, Settings
} from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import Header from '../shared/Header';
import GlobalBackground from '../shared/GlobalBackground';

export default function AdminLayout() {
  const location = useLocation();

  const adminItems = [
    {
      title: 'COMMAND CENTER',
      links: [{ to: '/admin', end: true, icon: Home, label: 'Command Center' }]
    },
    {
      title: 'CLINIC INTELLIGENCE',
      links: [
        { to: '/admin/patient-flow', icon: Users, label: 'Patient Flow' },
        { to: '/admin/doctor-workload', icon: Stethoscope, label: 'Doctor Workload' },
        { to: '/admin/congestion', icon: Activity, label: 'Congestion Forecast' }
      ]
    },
    {
      title: 'AI / ML',
      links: [
        { to: '/admin/ml', icon: Cpu, label: 'ML Model Center' },
        { to: '/admin/predictions', icon: Crosshair, label: 'Predictions' },
        { to: '/admin/explainability', icon: AlertTriangle, label: 'Explainable AI' },
        { to: '/admin/model-performance', icon: TrendingUp, label: 'Model Performance' },
        { to: '/admin/prediction-feedback', icon: Activity, label: 'Prediction vs Actual' },
        { to: '/admin/anomalies', icon: AlertTriangle, label: 'Anomaly Center' }
      ]
    },
    {
      title: 'SIMULATION',
      links: [
        { to: '/admin/digital-twin', icon: Box, label: 'Digital Twin' }
      ]
    },
    {
      title: 'RESOURCE INTELLIGENCE',
      links: [
        { to: '/admin/medicines', icon: Pill, label: 'Medicine Intelligence' },
        { to: '/admin/reports', icon: FileText, label: 'Reports' }
      ]
    },
    {
      title: 'SYSTEM',
      links: [
        { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
        { to: '/admin/settings', icon: Settings, label: 'Settings' }
      ]
    }
  ];

  const routeNameMap = {
    '/admin': { title: 'AI Clinic Command Center', sub: 'Predictive clinic intelligence' },
    '/admin/patient-flow': { title: 'Patient Flow Intelligence', sub: 'Understand the complete operational patient journey' },
    '/admin/doctor-workload': { title: 'Doctor Workload Intelligence', sub: 'Active consultations and expected capacity' },
    '/admin/congestion': { title: 'Congestion Forecast', sub: 'Current vs predicted clinic crowding' },
    '/admin/ml': { title: 'ML Model Center', sub: 'Machine learning model registry and statuses' },
    '/admin/predictions': { title: 'Live ML Predictions', sub: 'Real-time inferences' },
    '/admin/explainability': { title: 'Explainable AI', sub: 'Feature contribution and SHAP explanations' },
    '/admin/model-performance': { title: 'Model Performance', sub: 'Evaluation metrics' },
    '/admin/prediction-feedback': { title: 'Prediction vs Actual', sub: 'Model feedback loop' },
    '/admin/anomalies': { title: 'Operational Anomaly Center', sub: 'Detected unusual events' },
    '/admin/digital-twin': { title: 'Clinic Digital Twin', sub: 'What-if operational simulation' },
    '/admin/medicines': { title: 'Medicine Intelligence', sub: 'Inventory and demand insights' },
    '/admin/reports': { title: 'Clinic Intelligence Reports', sub: 'Generated operational reports' },
    '/admin/notifications': { title: 'Notifications', sub: 'System alerts' },
    '/admin/settings': { title: 'Settings', sub: 'System preferences' },
  };

  const currentMeta = routeNameMap[location.pathname] || routeNameMap['/admin'];

  return (
    <div className="min-h-screen flex font-sans text-slate-800">
      <GlobalBackground />
      <Sidebar items={adminItems} role="admin" />
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative">
        <Header title={currentMeta.title} subtitle={currentMeta.sub} role="admin" />
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
