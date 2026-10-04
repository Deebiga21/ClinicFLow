import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';
import { FileText, Download, RefreshCw, CreditCard, CheckCircle, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const API_BASE = 'http://localhost:8000/api';

export default function PatientPrescriptions() {
  const { data, loading } = useOutletContext();
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const nav = useNavigate();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Loading your prescriptions...</p>
      </div>
    );
  }

  const prescriptions = data?.medication_summary || [];
  const bill = data?.bill; // fetched from backend

  const handlePay = async () => {
    if (!bill) return;
    setPaying(true);
    try {
      // 1. Create Payment
      const pRes = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: bill.appointment_id,
          patient_id: bill.patient_id,
          amount: bill.amount,
          bill_id: bill.id
        })
      });
      const pData = await pRes.json();
      
      // 2. Verify Payment
      const vRes = await fetch(`${API_BASE}/payments/${pData.payment_id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const vData = await vRes.json();
      
      setPaymentSuccess(true);
      
      // Navigate to completed journey after a short delay
      setTimeout(() => nav('/patient/journey'), 2000);

    } catch (e) {
      console.error(e);
    } finally {
      setPaying(false);
    }
  };

  if (prescriptions.length === 0 && !bill) return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-[#0A2540] mb-6">Prescriptions & Billing</h1>
      <div className="flex-1">
        <EmptyState title="No prescriptions" message="We don't have any prescriptions on file for you." icon={FileText} />
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#0A2540] mb-2">Prescriptions</h1>
        <p className="text-gray-500 mb-6">Your clinician-approved prescriptions and post-consultation billing.</p>
        
        <div className="space-y-4">
          {prescriptions.map((rx, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-start shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-50 p-4 rounded-lg flex-shrink-0">
                <FileText className="text-blue-600" size={32} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#0A2540]">{rx.medicine_name}</h3>
                    <p className="text-slate-500 text-sm mt-1">{rx.dosage} • {rx.frequency} • {rx.duration_days} days</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${rx.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {rx.status}
                  </span>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4 mb-4 text-sm">
                  <p className="text-slate-600 mb-2"><strong>Doctor's Instructions:</strong></p>
                  <p className="text-slate-800">{rx.instructions || 'Follow standard dosage.'}</p>
                </div>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                  <p>Prescribed by: <span className="font-medium text-slate-700">Dr. {data?.today_appointment?.doctor_name || 'Clinic'}</span></p>
                  <p>Date: <span className="font-medium text-slate-700">{new Date(rx.prescribed_at).toLocaleDateString()}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Section */}
      {bill && (
        <div className="bg-white p-8 rounded-xl border-2 border-slate-200 shadow-sm mt-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <h2 className="text-xl font-bold text-[#0A2540] mb-6 flex items-center gap-2">
            <CreditCard size={24} className="text-blue-600" />
            CONSULTATION / MEDICATION BILL
          </h2>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4 w-full">
              <div className="flex justify-between pb-2 border-b">
                <span className="text-slate-600">Bill ID:</span>
                <span className="font-mono text-slate-800">{bill.id}</span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-slate-600">Date:</span>
                <span className="text-slate-800">{new Date(bill.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="font-bold text-slate-800">Amount Due:</span>
                <span className="font-black text-xl text-blue-600">₹{bill.amount}</span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-slate-600">Status:</span>
                <span className={`font-bold ${bill.status === 'Paid' || paymentSuccess ? 'text-green-600' : 'text-amber-500'}`}>
                  {paymentSuccess ? 'PAID' : bill.status.toUpperCase()}
                </span>
              </div>

              {bill.status !== 'Paid' && !paymentSuccess && (
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full mt-4 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  {paying ? 'Processing...' : 'PAY NOW (Sandbox)'}
                </button>
              )}
            </div>

            {/* QR Code Section */}
            {bill.status !== 'Paid' && !paymentSuccess && (
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl">
                <QRCodeSVG value={JSON.stringify({ action: "pay_bill", bill_id: bill.id, amount: bill.amount })} size={140} />
                <p className="mt-4 text-xs font-bold text-slate-500 tracking-widest uppercase">SCAN TO PAY</p>
              </div>
            )}

            {(bill.status === 'Paid' || paymentSuccess) && (
              <div className="flex flex-col items-center justify-center p-6 bg-green-50 border border-green-200 rounded-xl w-full max-w-xs text-center">
                <CheckCircle size={48} className="text-green-500 mb-4" />
                <h3 className="font-black text-green-700 text-lg mb-1">PAYMENT SUCCESSFUL</h3>
                <p className="text-xs text-green-600 font-medium mb-4">Receipt generated automatically.</p>
                <button className="flex items-center gap-2 text-sm font-bold text-green-700 border border-green-700 px-4 py-2 rounded-lg hover:bg-green-100">
                  <Download size={16} /> Download Receipt
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
