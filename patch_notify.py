import sys
with open('core_backend/routers/patient_dashboard.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """        # Add to medication_events history
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
        
        return {"success": True}"""

new_code = """        # Add to medication_events history
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
        session.commit()
        
        # Notify Nurse Chat
        try:
            from services.chat_service import ChatService
            from routers.chat import broadcast_chat_message
            import asyncio
            
            # Find patient name or use ID
            patient_name = sch["patient_id"]
            patient_rec = session.execute(text("SELECT name FROM patients WHERE id = :id"), {"id": sch["patient_id"]}).mappings().first()
            if patient_rec:
                patient_name = patient_rec["name"]
                
            med_name = sch.get("medicine_name", "Medication")
            if "medicine_name" not in sch:
                med_rec = session.execute(text("SELECT medicine_name FROM prescriptions WHERE id = :id"), {"id": sch.get("prescription_id")}).mappings().first()
                if med_rec:
                    med_name = med_rec["medicine_name"]
            
            chat_service = ChatService()
            msg = chat_service.save_message(
                sender_id="System",
                sender_role="system",
                channel="clinic_operations",
                message=f"✅ Patient {patient_name} just marked their {med_name} dose as Taken."
            )
            # Try to run broadcast safely since we are inside a sync route
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(broadcast_chat_message(msg))
            else:
                loop.run_until_complete(broadcast_chat_message(msg))
        except Exception as e:
            print("Failed to notify chat:", e)
        
        return {"success": True}"""

content = content.replace(old_code, new_code)

with open('core_backend/routers/patient_dashboard.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("patient_dashboard.py patched")
