import sqlite3
conn = sqlite3.connect('clinic_core_v2.db')
c = conn.cursor()
c.execute("SELECT sql FROM sqlite_master WHERE type='table'")
for row in c.fetchall():
    if row[0]: print(row[0])
