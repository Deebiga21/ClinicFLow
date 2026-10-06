
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
      if (type === "billing_notified" || type === "proceed_to_bill") {
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
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <QRCodeSVG value="PAYMENT_ID_123" size={120} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-blue-600" /> Payment Required
            </h3>
            <p className="text-blue-800 mt-2">
              Please proceed to pay your medicine bill by scanning the QR code, or click the button below.
            </p>
            <button 
              onClick={handlePay}
              className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Pay Now (Simulated)
            </button>
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

