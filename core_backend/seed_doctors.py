import sqlite3
import datetime

conn = sqlite3.connect('clinic_core_v2.db')
c = conn.cursor()

# Get existing doctors to find the max id offset
c.execute("SELECT id FROM doctors WHERE id LIKE 'D_%'")
existing_ids = c.fetchall()
max_id = 5
for row in existing_ids:
    try:
        val = int(row[0].split('_')[1])
        if val > max_id:
            max_id = val
    except:
        pass

depts = [
    ("Orthopedic", "Dr. Bone"),
    ("Cardiologist", "Dr. Heart"),
    ("Dermatologist", "Dr. Skin"),
    ("Pediatrician", "Dr. Kid"),
    ("Ophthalmologist", "Dr. Eye"),
    ("Dentist", "Dr. Tooth"),
    ("Psychiatrist", "Dr. Mind"),
    ("Gynecologist", "Dr. Women"),
    ("Oncologist", "Dr. Cell"),
    ("Neurologist", "Dr. Brain"),
    ("Nephrologist", "Dr. Kidney"),
    ("Pulmonologist", "Dr. Lung"),
    ("Geriatrician", "Dr. Elder"),
    ("Gastroenterologist", "Dr. Stomach"),
    ("Physician", "Dr. General")
]

now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

for idx, (dept, name) in enumerate(depts):
    d_id = f"D_{max_id + idx + 1}"
    # Check if department already has a doctor (optional, but let's just insert)
    # We will just insert them to be safe
    c.execute('''
        INSERT INTO doctors (id, name, department, specialization, average_consultation_duration, active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (d_id, name, dept, dept, 15.0, 1, now))

conn.commit()
print("Inserted dummy doctors for all 15 departments!")
