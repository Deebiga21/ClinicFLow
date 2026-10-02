with open('core_backend/routers/clinical.py', 'r') as f:
    text = f.read()

text = text.replace('INSERT INTO inventory_transactions (id, medicine_id, batch_id, type, quantity, timestamp, notes)', 'INSERT INTO inventory_transactions (id, medicine_id, batch_id, transaction_type, quantity, reference_type, reference_id, timestamp)')
text = text.replace("VALUES (:tx_id, :med_id, :batch_id, 'Dispense', 1, CURRENT_TIMESTAMP, 'Prescribed in visit')", "VALUES (:tx_id, :med_id, :batch_id, 'Dispense', 1, 'Prescription', 'UNKNOWN', CURRENT_TIMESTAMP)")

with open('core_backend/routers/clinical.py', 'w') as f:
    f.write(text)
