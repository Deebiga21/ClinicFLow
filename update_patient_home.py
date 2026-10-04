import re

with open(r"d:\ClinicFLow\frontend\src\pages\patient\PatientHome.jsx", "r") as f:
    content = f.read()

# 1. Add import
if "QRCodeSVG" not in content:
    content = content.replace("import { api } from '../../services/api';", "import { api } from '../../services/api';\nimport { QRCodeSVG } from 'qrcode.react';")

# 2. Add handleCheckIn
handle_check_in_code = """
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  const handleQRClick = async () => {
    // We only want to allow check-in if they haven't checked in yet
    // If data.queue_status exists, they are already checked in.
    if (!data?.today_appointment?.id || data?.queue_status || isCheckingIn || checkInSuccess) return;
    setIsCheckingIn(true);
    try {
      // Simulate real-world kiosk scan:
      await fetch('http://localhost:8000/api/pipeline/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: data.today_appointment.id })
      });
      setCheckInSuccess(true);
      setTimeout(() => setCheckInSuccess(false), 3000);
    } catch(err) {
      console.error(err);
    } finally {
      setIsCheckingIn(false);
    }
  };
"""

content = content.replace("const [waitExplanation, setWaitExplanation] = useState(null);", "const [waitExplanation, setWaitExplanation] = useState(null);\n" + handle_check_in_code)

# 3. Replace QR Code visual
old_qr = """<div className="flex flex-col items-center justify-center pt-2 w-28">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center p-2 mb-2 border border-gray-200">
                    <QrCode size={56} className="text-[#0A2540]" />
                  </div>
                </div>"""

new_qr = """<div className="flex flex-col items-center justify-center pt-2 w-32">
                  <div 
                    onClick={handleQRClick}
                    className={`w-24 h-24 bg-white rounded-lg flex items-center justify-center p-2 mb-2 border-2 transition-all ${
                      data?.queue_status ? 'border-green-500 bg-green-50 cursor-default' : 
                      checkInSuccess ? 'border-green-500 bg-green-50' : 
                      isCheckingIn ? 'border-blue-300 opacity-50' : 
                      'border-blue-500 hover:scale-105 shadow-md cursor-pointer'
                    }`}
                    title={data?.queue_status ? "Already Checked In" : "Click to simulate Kiosk Scan"}
                  >
                    {data?.today_appointment?.id ? (
                      <QRCodeSVG 
                        value={JSON.stringify({ action: "check_in", appointment_id: data.today_appointment.id })} 
                        size={80} 
                        fgColor={data?.queue_status || checkInSuccess ? '#22c55e' : '#0ea5e9'}
                      />
                    ) : (
                      <QrCode size={56} className="text-[#0A2540]" />
                    )}
                  </div>
                  <span className={`text-[10px] font-bold text-center ${data?.queue_status || checkInSuccess ? 'text-green-600' : 'text-blue-600'}`}>
                    {data?.queue_status ? 'CHECKED IN' : checkInSuccess ? 'SUCCESS!' : isCheckingIn ? 'SCANNING...' : 'SCAN TO CHECK-IN'}
                  </span>
                </div>"""

content = content.replace(old_qr, new_qr)

with open(r"d:\ClinicFLow\frontend\src\pages\patient\PatientHome.jsx", "w") as f:
    f.write(content)
print("Updated PatientHome.jsx")
