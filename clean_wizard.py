import re
import os

filepath = r"d:\ClinicFLow\frontend\src\pages\patient\BookingWizard.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove CreditCard, QrCode imports
content = re.sub(r'import \{ QrCodeSVG \} from \'qrcode\.react\';\n?', '', content)
content = re.sub(r'import \{ QRCodeSVG \} from \'qrcode\.react\';\n?', '', content)
content = content.replace("CreditCard, QrCode", "")
content = content.replace(", QrCode", "").replace(", CreditCard", "")
content = content.replace("CreditCard,", "")

# 2. Remove handlePayment
handle_payment_pattern = r'const handlePayment = async \(\) => \{.*?\n  \};\n'
content = re.sub(handle_payment_pattern, '', content, flags=re.DOTALL)

# 3. Update the steps UI at the top
steps_header_old = r'<span className={`text-xs font-semibold \$\{step >= 3 \? \'text-blue-600\' : \'text-gray-400\'\}`\}>3\. Letter</span>.*?</nav>'
steps_header_new = r"""<span className={`text-xs font-semibold ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>3. Letter</span>
              <span className="text-gray-300">→</span>
              <span className={`text-xs font-semibold ${step >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>4. Token</span>
            </nav>"""
content = re.sub(steps_header_old, steps_header_new, content, flags=re.DOTALL)

# 4. Remove instructions about QR code in step 3
content = content.replace("<li>Keep the appointment QR code ready for check-in.</li>", "")

# 5. Remove Step 4 (Payment) block
step4_pattern = r'\{step === 4 && \(\s*<div className="max-w-md mx-auto bg-white p-8 rounded-xl.*?</div>\s*\)\}'
content = re.sub(step4_pattern, '', content, flags=re.DOTALL)

# 6. Rewrite Step 5 as Step 4 (Token) and remove QR/Payment success
step5_pattern = r'\{step === 5 && appointmentDetails\?\.token && \(\s*<div className="max-w-md mx-auto text-center">.*?</div>\s*\)\}'
new_step4 = r"""{step === 4 && appointmentDetails?.token && (
            <div className="max-w-md mx-auto text-center">
              <div className="bg-white p-8 rounded-xl border-2 border-blue-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
                <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-2">YOUR TOKEN</p>
                <h1 className="text-6xl font-black text-[#0A2540] mb-6">{appointmentDetails.token}</h1>
                
                <p className="text-sm text-gray-500 mb-2">Please watch the live queue monitor for your token to be called.</p>
                
                <button 
                  onClick={() => {
                    onClose();
                    if (onComplete) onComplete();
                  }}
                  className="mt-6 w-full bg-[#0A2540] text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}"""
content = re.sub(step5_pattern, new_step4, content, flags=re.DOTALL)

# 7. Update footer actions
footer_old = r'\{step === 3 && \(\s*<div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">\s*<button onClick=\{\(\) => setStep\(4\)\} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg">Proceed to Payment</button>\s*</div>\s*\)\}'
footer_new = r"""{step === 3 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
            <button onClick={() => setStep(4)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg">View Token</button>
          </div>
        )}"""
content = re.sub(footer_old, footer_new, content, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated BookingWizard.jsx")
