import sqlite3
conn=sqlite3.connect('clinic_core_v2.db')
c=conn.cursor()
try:
    c.execute("ALTER TABLE appointments ADD COLUMN payment_status VARCHAR DEFAULT 'Pending'")
except Exception as e: print(e)
try:
    c.execute("ALTER TABLE appointments ADD COLUMN token_status VARCHAR DEFAULT 'Pending'")
except Exception as e: print(e)
conn.commit()
