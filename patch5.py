with open('e2e_test.py', 'r') as f:
    text = f.read()
text = text.replace('orch = OrchestrationService()', 'orch = OrchestrationService(db_url="sqlite:///core_backend/clinic_core_v2.db")')
with open('e2e_test.py', 'w') as f:
    f.write(text)
