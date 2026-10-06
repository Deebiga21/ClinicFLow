import requests, json

# Test 1: Get current queue state
r = requests.get('http://localhost:8000/api/nurse/dashboard')
d = r.json()
print("=== LIVE QUEUE ===")
for q in d['live_queue']:
    print(f"  id={q['id']} patient={q['patient_name']} status={q['status']} doctor={q['doctor_name']}")

# Test 2: Try calling "Call Next" on first waiting patient
waiting = [q for q in d['live_queue'] if q['status'] == 'Waiting']
if waiting:
    qid = waiting[0]['id']
    print(f"\n=== CALLING NEXT on {qid} ===")
    r2 = requests.post('http://localhost:8000/api/pipeline/nurse/start', json={'queue_id': qid})
    print(f"  Status: {r2.status_code}")
    print(f"  Response: {r2.text}")

# Test 3: Try "Mark Ready" on first "With Nurse" patient  
with_nurse = [q for q in d['live_queue'] if q['status'] == 'With Nurse']
if with_nurse:
    qid = with_nurse[0]['id']
    print(f"\n=== MARK READY on {qid} ===")
    r3 = requests.post('http://localhost:8000/api/pipeline/nurse/ready', json={'queue_id': qid})
    print(f"  Status: {r3.status_code}")
    print(f"  Response: {r3.text}")

# Test 4: Try "Send to Doctor" on first "Ready" patient
ready = [q for q in d['live_queue'] if q['status'] == 'Ready']
if ready:
    qid = ready[0]['id']
    print(f"\n=== SEND TO DOCTOR on {qid} ===")
    r4 = requests.post('http://localhost:8000/api/pipeline/nurse/send-doctor', json={'queue_id': qid})
    print(f"  Status: {r4.status_code}")
    print(f"  Response: {r4.text}")

# Re-check state
print("\n=== QUEUE AFTER ACTIONS ===")
r5 = requests.get('http://localhost:8000/api/nurse/dashboard')
d5 = r5.json()
for q in d5['live_queue']:
    print(f"  id={q['id']} patient={q['patient_name']} status={q['status']}")
