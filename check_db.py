import sqlite3
try:
    conn = sqlite3.connect('core_backend/clinic_core_v2.db')
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = c.fetchall()
    for table in tables:
        print(table[0])
        c.execute(f"PRAGMA table_info({table[0]})")
        cols = c.fetchall()
        for col in cols:
            print(f"  {col[1]}")
except Exception as e:
    print(e)
