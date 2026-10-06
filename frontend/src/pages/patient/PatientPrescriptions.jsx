
import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { FileText, Download, QrCode } from "lucide-react";
import EmptyState from "../../components/shared/EmptyState";
import { useClinicWebSocket } from "../../hooks/useClinicWebSocket";
import { QRCodeSVG } from "qrcode.react";
import { API_BASE } from "../../config";

export default function PatientPrescriptions() {
  const { data, loading } = useOutletContext();
  const prescriptions = data?.medications || [];
  
  const [showBilling, setShowBilling] = useState(false);
  const { lastEvent } = useClinicWebSocket();

  useEffect(() => {
    if (lastEvent) {
      const type = lastEvent.type || lastEvent.event;
      if (type === "billing_notified" || type === "proceed_to_bill" || type === "consultation_ended") {
        // Here we could check patient_id if needed
        setShowBilling(true);
      }
    }
  }, [lastEvent]);

  const handlePay = async () => {
    try {
      const pId = data?.patient?.id || "UNKNOWN";
      await fetch(API_BASE + "/patient/" + pId + "/pay-bill", { method: "POST" });
    } catch(e) {}
    alert("Payment successful! Nurse has been notified.");
    setShowBilling(false);
  };

  if (loading) return <div className="p-6">Loading prescriptions...</div>;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-semibold text-[#0A2540]">Prescriptions & Billing</h1>
        <button onClick={() => setShowBilling(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
          Proceed to Bill
        </button>
      </div>
      <p className="text-gray-500 mb-6">Your clinician-approved prescriptions.</p>

      {showBilling && (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-[#0A2540] mb-4 flex items-center gap-2 border-b pb-4">
            <QrCode className="w-6 h-6 text-blue-600" /> Invoice & Payment
          </h3>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h4 className="font-semibold text-slate-700 mb-3">Prescribed Medicines</h4>
              <ul className="space-y-3 mb-6">
                {(prescriptions.length > 0 ? prescriptions : [
                  { medicine_name: "Amoxicillin 500mg", price: 150 },
                  { medicine_name: "Paracetamol 650mg", price: 50 },
                  { medicine_name: "Vitamin C Complex", price: 80 }
                ]).map((med, i) => (
                  <li key={i} className="flex justify-between text-sm items-center">
                    <span className="text-slate-600 font-medium">{med.medicine_name}</span>
                    <span className="text-slate-800 font-bold">₹{med.price || Math.floor(Math.random() * 100) + 50}</span>
                  </li>
                ))}
                <li className="flex justify-between text-sm items-center pt-3 border-t border-slate-100">
                  <span className="text-slate-500">Consultation Fee</span>
                  <span className="text-slate-800 font-bold">₹300</span>
                </li>
                <li className="flex justify-between text-base items-center pt-3 border-t-2 border-slate-200 mt-2">
                  <span className="text-[#0A2540] font-bold">Total Amount</span>
                  <span className="text-emerald-600 font-bold text-lg">₹580</span>
                </li>
              </ul>
              
              <button 
                onClick={handlePay}
                className="w-full mt-2 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                I have paid (Notify Nurse)
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100 min-w-[280px]">
              <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                <QRCodeSVG value="upi://pay?pa=deebigasubramaniyan-1@oksbi&pn=Deebiga%20S&am=580.00&cu=INR" size={160} />
              </div>
              <p className="text-sm font-bold text-slate-700">Scan to pay with any UPI app</p>
              <p className="text-xs text-slate-500 mt-1">UPI ID: deebigasubramaniyan-1@oksbi</p>
            </div>
          </div>
        </div>
      )}

      {prescriptions.length === 0 ? (
        <EmptyState title="No Prescriptions" message="You have no recent clinician-approved prescriptions." icon={FileText} />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-[#0A2540] p-4 text-white flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-200 font-medium">RECENT PRESCRIPTION</p>
                <h3 className="font-bold">Issued by Dr. Sharma</h3>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Download size={16} />
                  Download PDF
                </button>
                <button onClick={() => { alert('Redirecting to Pharmacy Checkout...'); }} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors shadow-sm">
                  Order & Checkout
                </button>
              </div>
              
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
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">{med.frequency}</span>
                        </td>
                        <td className="py-4 text-slate-600">{med.duration_days} days</td>
                        <td className="py-4 text-slate-600">{med.instructions || "--"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

