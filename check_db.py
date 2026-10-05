import sqlite3
conn = sqlite3.connect(r'd:\ClinicFLow\core_backend\clinic_core_v2.db')
c = conn.cursor()
tables = c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("Tables and row counts:")
for t in tables:
    count = c.execute(f"SELECT count(*) FROM {t[0]}").fetchone()[0]
    print(f"  {t[0]}: {count} rows")
conn.close()
