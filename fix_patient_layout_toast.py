import re
with open(r"d:\ClinicFLow\frontend\src\components\patient\PatientLayout.jsx", "r") as f:
    content = f.read()

toast_code = """
  // Watch for "patient_called" event
  const [toast, setToast] = useState(null);
  
  useEffect(() => {
    if (lastEvent?.event === 'patient_called' && lastEvent?.data?.patient_id === patientId) {
      setToast("Your turn — The doctor is ready for your consultation.");
      setTimeout(() => setToast(null), 10000);
    }
  }, [lastEvent, patientId]);
"""

if "const [toast" not in content:
    content = content.replace("const { lastEvent } = useClinicWebSocket();", "const { lastEvent } = useClinicWebSocket();\n" + toast_code)
    
    toast_ui = """
        {toast && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce font-bold">
            {toast}
          </div>
        )}
        <main className="flex-1 overflow-y-auto">
"""
    content = content.replace('<main className="flex-1 overflow-y-auto">', toast_ui)

with open(r"d:\ClinicFLow\frontend\src\components\patient\PatientLayout.jsx", "w") as f:
    f.write(content)
print("Updated PatientLayout.jsx with toast")
