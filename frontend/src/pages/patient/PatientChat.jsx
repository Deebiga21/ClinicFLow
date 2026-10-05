import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MessageCircle, Clock } from 'lucide-react';
import ChatPanel from '../../components/ChatPanel';

export default function PatientChat() {
  const { data, loading } = useOutletContext();

  if (loading || !data) {
    return <div className="flex h-[50vh] items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }

  const queue_status = data?.queue_status || {};
  const tokenNumber = queue_status.token_number ? String(queue_status.token_number) : null;
  const isCheckedIn = !!queue_status.id;

  return (
    <div className="font-sans">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">Nurse Chat</h1>
          <p className="text-gray-500">Message the clinical staff directly regarding your visit.</p>
        </div>
        {tokenNumber && (
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold border border-blue-100 flex items-center gap-2">
            <MessageCircle size={18} />
            Token #{tokenNumber}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
        {isCheckedIn && tokenNumber ? (
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
              <ChatPanel tokenNumber={tokenNumber} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-500">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <MessageCircle size={48} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Check in to start chatting</h2>
            <p className="max-w-md">
              You can message the nurse staff once you have checked in for your appointment and received a token number. 
              Please return to the Home tab to check in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
