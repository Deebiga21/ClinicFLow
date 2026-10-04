import re

with open("d:/ClinicFLow/core_backend/main.py", "r") as f:
    content = f.read()

test_flow_code = """
@app.get("/api/pipeline/test-flow")
async def test_end_to_end_flow():
    with orchestrator.Session() as session:
        from sqlalchemy import text
        res = session.execute(text("SELECT id as appointment_id, patient_id, doctor_id FROM appointments WHERE status = 'Scheduled' LIMIT 1")).mappings().fetchone()
        if not res:
            return {"error": "No scheduled appointments available"}
        appt = dict(res)
        
    flow_log = []
    
    # 1. Check-in
    res1 = orchestrator.process_patient_check_in(appt["appointment_id"])
    flow_log.append(res1)
    if "error" in res1: return {"error": res1}
    queue_id = res1["queue_id"]
    await broadcast_event('patient_checked_in', res1)
    
    # 2. Readiness
    res2 = orchestrator.process_patient_readiness(appt["patient_id"], {"readiness_score": 100})
    flow_log.append(res2)
    await broadcast_event('patient_readiness_updated', res2)
    
    # 3. Call Next
    res3 = orchestrator.process_call_next(queue_id)
    flow_log.append(res3)
    await broadcast_event('patient_called', res3)
    
    # 4. Start Consult
    res4 = orchestrator.process_consultation_start(queue_id)
    flow_log.append(res4)
    consult_id = res4.get("consultation_id")
    await broadcast_event('consultation_started', res4)
    
    # 5. End Consult
    res5 = orchestrator.process_consultation_end(consult_id, 14.5)
    flow_log.append(res5)
    await broadcast_event('consultation_completed', res5)
    
    # 6. Prescription
    res6 = orchestrator.process_prescription(appt["patient_id"], appt["appointment_id"], appt["doctor_id"], consult_id, "Amoxicillin", "500mg", "Twice daily", 5)
    flow_log.append(res6)
    await broadcast_event('prescription_created', res6)
    
    return {"status": "Success", "flow": flow_log}

if __name__ == "__main__":
"""

new_content = content.replace("if __name__ == \"__main__\":", test_flow_code)

with open("d:/ClinicFLow/core_backend/main.py", "w") as f:
    f.write(new_content)
print("Updated main.py")
