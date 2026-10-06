import re

with open('core_backend/seed_pipeline.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''
    c.execute("DELETE FROM bills WHERE id=?", (bill_id,))
    c.execute("""
        INSERT INTO bills (id, patient_id, appointment_id, consultation_id, total_amount, status, created_at)
        VALUES (?,?,?,?,500.0,'Pending',?)
    """, (bill_id, 'P_demo_3', appt_ids['P_demo_3'], queue_ids['P_demo_3'], now.isoformat()))
    
    # ADD PRESCRIPTIONS FOR P_demo_1 (Rahul)
    print("  Adding Active Prescriptions for Rahul (P_demo_1)...")
    meds_p1 = [
        ('Amoxicillin 500mg', '500mg', 'Twice daily', '7', 'Take after meals'),
        ('Paracetamol 650mg', '650mg', 'Three times daily', '3', 'Take when fever > 100F'),
        ('Vitamin C Complex', '1 tablet', 'Once daily', '30', 'Take in the morning')
    ]
    for med, dos, freq, dur, inst in meds_p1:
        presc_id = str(uuid.uuid4())
        c.execute("""
            INSERT INTO prescriptions (id, patient_id, appointment_id, doctor_id, consultation_id, medicine_name, dosage, frequency, duration_days, instructions, prescribed_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
        """, (presc_id, 'P_demo_1', appt_ids['P_demo_1'], 'D_1', queue_ids['P_demo_1'], med, dos, freq, dur, inst, now.isoformat()))
        
        times = []
        if freq == 'Twice daily':
            times = ['09:00 AM', '09:00 PM']
        elif freq == 'Three times daily':
            times = ['08:00 AM', '02:00 PM', '08:00 PM']
        elif freq == 'Once daily':
            times = ['08:00 AM']
            
        for t in times:
            c.execute("""
                INSERT INTO medication_schedules (id, prescription_id, patient_id, medicine_id, scheduled_date, scheduled_time, frequency, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
            """, (str(uuid.uuid4()), presc_id, 'P_demo_1', med, today, t, freq, now.isoformat()))

    conn.commit()
    print(f"  OK: 2 prescriptions + Rs.500 bill created for Priya. And 3 prescriptions for Rahul.")
'''

# We just replace the exact block that commits Priya's bill
pattern = r'c\.execute\("DELETE FROM bills WHERE id=\?", \(bill_id,\)\).*?print\(f"  OK: 2 prescriptions \+ Rs\.500 bill created for Priya"\)'

content = re.sub(pattern, replacement.strip(), content, flags=re.DOTALL)

with open('core_backend/seed_pipeline.py', 'w', encoding='utf-8') as f:
    f.write(content)
