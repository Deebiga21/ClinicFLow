import sys
with open('core_backend/routers/patient_dashboard.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_route = """@router.post("/api/medication-schedules/{schedule_id}/taken")
def mark_medication_taken(schedule_id: str):
    import uuid
    with orchestrator.Session() as session:
        # Check if schedule exists
        sch = session.execute(text("SELECT * FROM medication_schedules WHERE id = :id"), {"id": schedule_id}).mappings().first()
        if not sch:
            return {"error": "Schedule not found"}
        
        # Update status
        session.execute(text("UPDATE medication_schedules SET status = 'Taken' WHERE id = :id"), {"id": schedule_id})
        
        # Add to medication_events history
        event_id = f"ME_{uuid.uuid4().hex[:8]}"
        session.execute(text(\"\"\"
            INSERT INTO medication_events (id, medication_schedule_id, patient_id, scheduled_time, event_time, status, recorded_at)
            VALUES (:id, :sch_id, :pid, :stime, CURRENT_TIMESTAMP, 'Taken', CURRENT_TIMESTAMP)
        \"\"\"), {
            "id": event_id,
            "sch_id": schedule_id,
            "pid": sch["patient_id"],
            "stime": f"{sch['scheduled_date']} {sch['scheduled_time']}"
        })
        
        return {"success": True}
"""

content = content + "\n\n" + new_route

with open('core_backend/routers/patient_dashboard.py', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
