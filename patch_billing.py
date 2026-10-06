import re

with open('frontend/src/pages/patient/PatientPrescriptions.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''
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
'''

pattern = r'\{showBilling && \([\s\S]*?\}\)'
content = re.sub(pattern, replacement.strip(), content)

with open('frontend/src/pages/patient/PatientPrescriptions.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
