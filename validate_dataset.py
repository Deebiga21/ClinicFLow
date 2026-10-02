import pandas as pd
from sqlalchemy import create_engine
import json

engine = create_engine("sqlite:///core_backend/clinic_core_v2.db")

print("--- WAITING TIME / CONSULTATION ---")
df_q = pd.read_sql("SELECT * FROM queue_entries", engine)
print(f"Total Rows (queue_entries): {len(df_q)}")
print(f"Features in queue_entries: {list(df_q.columns)}")
df_wait_valid = df_q[df_q["status"] == "Completed"]
print(f"Completed Rows: {len(df_wait_valid)}")
print(f"Missing Values:\n{df_wait_valid.isnull().sum()}")

print("\n--- NO-SHOW ---")
df_a = pd.read_sql("SELECT * FROM appointments", engine)
print(f"Total Rows (appointments): {len(df_a)}")
print(f"Features in appointments: {list(df_a.columns)}")
print(f"Status distribution:\n{df_a['status'].value_counts()}")
