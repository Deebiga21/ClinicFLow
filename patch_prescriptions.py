import re

with open('frontend/src/pages/patient/PatientPrescriptions.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update useEffect to listen for consultation_ended and auto-show billing
effect_target = '''  useEffect(() => {
    if (lastEvent?.type === 'update' || lastEvent?.event === 'prescriptions_updated' || lastEvent?.type === 'payment_successful') {
      fetchData();
    }
  }, [lastEvent]);'''

effect_replacement = '''  useEffect(() => {
    if (lastEvent?.type === 'update' || lastEvent?.event === 'prescriptions_updated' || lastEvent?.type === 'payment_successful' || lastEvent?.event === 'consultation_ended' || lastEvent?.data?.event === 'consultation_ended') {
      fetchData();
      if (lastEvent?.event === 'consultation_ended' || lastEvent?.data?.event === 'consultation_ended') {
        setShowBilling(true);
      }
    }
  }, [lastEvent]);'''

content = content.replace(effect_target, effect_replacement)

with open('frontend/src/pages/patient/PatientPrescriptions.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
