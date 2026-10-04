import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Download, RefreshCw } from 'lucide-react';
import EmptyState from '../../components/shared/EmptyState';

export default function PatientPrescriptions() {
  const { data, loading } = useOutletContext();
  const prescriptions = data?.medications || []; // From backend

  if (loading) return <div className="p-6">Loading prescriptions...</div>;

  if (prescriptions.length === 0) return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-[#0A2540] mb-6">Prescriptions</h1>
      <div className="flex-1">
        <EmptyState title="No Prescriptions" message="You have no recent clinician-approved prescriptions." icon={FileText} />
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-[#0A2540] mb-2">Prescriptions</h1>
      <p className="text-gray-500 mb-6">Your clinician-approved prescriptions.</p>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-[#0A2540] p-4 text-white flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-200 font-medium">RECENT PRESCRIPTION</p>
              <h3 className="font-bold">Issued by Dr. Sharma</h3>
            </div>
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Download size={16} />
              Download PDF
            </button>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="pb-3 font-medium">Medicine</th>
                    <th className="pb-3 font-medium">Dosage</th>
                    <th className="pb-3 font-medium">Frequency</th>
                    <th className="pb-3 font-medium">Duration</th>
                    <th className="pb-3 font-medium">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescriptions.map((med, idx) => (
                    <tr key={idx} className="text-sm">
                      <td className="py-4 font-bold text-[#0A2540]">{med.medicine_name}</td>
                      <td className="py-4 text-slate-600">{med.dosage}</td>
                      <td className="py-4 text-slate-600">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">
                          {med.frequency}
                        </span>
                      </td>
                      <td className="py-4 text-slate-600">{med.duration_days} days</td>
                      <td className="py-4 text-slate-600">{med.instructions || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
