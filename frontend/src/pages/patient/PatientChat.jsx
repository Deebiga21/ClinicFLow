import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MessageCircle, Clock } from 'lucide-react';
import ChatPanel from '../../components/ChatPanel';

export default function PatientChat() {
  const { data, loading } = useOutletContext();

  if (loading || !data) {
    return <div className="flex h-[50vh] items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }

  const patientId = data?.patient?.id;

  return (
    <div className="font-sans">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">Nurse Chat</h1>
          <p className="text-gray-500">Message the clinical staff directly regarding your visit.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
        <div className="flex-1 flex flex-col h-full">
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center gap-3">
            <div className="bg-green-100 text-green-700 p-2 rounded-full">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Connected to Nurse Station</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} /> Live Support Active
              </p>
            </div>
          </div>
          <div className="flex-1 p-4">
            <ChatPanel channelId={`patient_${patientId}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
