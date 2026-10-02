with open('core_backend/routers/clinical.py', 'r') as f:
    text = f.read()

text = text.replace("VALUES (:tid, :mid, :bid, 'Dispense', 1, CURRENT_TIMESTAMP, 'Prescribed in visit')", "VALUES (:tid, :mid, :bid, 'Dispense', 1, 'Prescription', 'UNKNOWN', CURRENT_TIMESTAMP)")

with open('core_backend/routers/clinical.py', 'w') as f:
    f.write(text)
