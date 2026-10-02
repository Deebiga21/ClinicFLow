import React from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';
import { FileText, Download, RefreshCw } from 'lucide-react';

export default function PatientPrescriptions() {
  const { data, loading } = useOutletContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Loading your prescriptions...</p>
      </div>
    );
  }

  const prescriptions = data?.medication_summary || [];

  if (prescriptions.length === 0) return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-[#0A2540] mb-6">Prescriptions</h1>
      <div className="flex-1">
        <EmptyState title="No prescriptions" message="We don't have any prescriptions on file for you." icon={FileText} />
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0A2540] mb-2">Prescriptions</h1>
        <p className="text-slate-500">View and download your latest medical prescriptions.</p>
      </div>

      <div className="space-y-4">
        {prescriptions.map((prescription, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-slate-50 p-3 rounded-xl text-slate-400 shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Prescription from {new Date(prescription.prescribed_at).toLocaleDateString()}</h3>
                <p className="text-sm text-slate-500">Doctor ID: {prescription.doctor_id}</p>
                <p className="text-sm font-medium mt-1">{prescription.medicine_name} ({prescription.dosage}) - {prescription.instructions}</p>
              </div>
            </div>
            <button className="text-blue-600 flex items-center gap-2 text-sm font-medium hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg transition-colors shrink-0">
              <Download size={16} />
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
