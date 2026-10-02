import asyncio
import random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

# Connect directly for the script
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.clinicflow

async def generate_data():
    print("Generating historical ML training data...")
    
    # 1. Clear existing ML historical records (optional, but good for clean start)
    await db.ml_historical_consultations.delete_many({})
    await db.ml_historical_queue.delete_many({})
    
    start_date = datetime.utcnow() - timedelta(days=180) # 6 months ago
    
    consultations = []
    queue_logs = []
    
    visit_types = ["General", "Follow-up", "Specialist", "Emergency"]
    doctors = ["Dr. Smith", "Dr. Patel", "Dr. Garcia"]
    
    for day in range(180):
        current_date = start_date + timedelta(days=day)
        
        # Skip Sundays
        if current_date.weekday() == 6:
            continue
            
        # Daily parameters
        base_volume = random.randint(30, 80)
        if current_date.weekday() == 0: # Monday busy
            base_volume += 20
            
        queue_size_at_hour = {h: 0 for h in range(8, 20)}
        
        for i in range(base_volume):
            # Arrival time between 8 AM and 6 PM
            arrival_hour = random.randint(8, 17)
            # Bell curve around 10-11 AM and 3-4 PM
            if random.random() < 0.6:
                arrival_hour = random.choice([9, 10, 11, 14, 15, 16])
                
            arrival_time = current_date.replace(hour=arrival_hour, minute=random.randint(0, 59))
            
            # Active doctors at that hour
            active_docs = 3 if 9 <= arrival_hour <= 17 else 1
            
            # Update queue size for that hour
            current_queue = queue_size_at_hour[arrival_hour]
            queue_size_at_hour[arrival_hour] += 1
            
            # Predict wait time based on queue
            actual_wait_time = max(5, current_queue * 15 // active_docs + random.randint(-5, 15))
            
            consult_start = arrival_time + timedelta(minutes=actual_wait_time)
            
            visit = random.choices(visit_types, weights=[60, 20, 15, 5])[0]
            doctor = random.choice(doctors)
            patient_age = random.randint(18, 85)
            
            # Duration based on visit type
            base_durations = {"General": 15, "Follow-up": 10, "Specialist": 30, "Emergency": 45}
            actual_duration = max(5, base_durations[visit] + random.randint(-5, 10) + (patient_age > 65) * 5)
            
            consult_end = consult_start + timedelta(minutes=actual_duration)
            
            consultations.append({
                "date": arrival_time,
                "doctor": doctor,
                "visit_type": visit,
                "patient_age": patient_age,
                "hour_of_day": arrival_hour,
                "day_of_week": arrival_time.weekday(),
                "actual_duration_mins": actual_duration
            })
            
            queue_logs.append({
                "date": arrival_time,
                "hour_of_day": arrival_hour,
                "day_of_week": arrival_time.weekday(),
                "queue_length_at_arrival": current_queue,
                "active_doctors": active_docs,
                "actual_wait_time_mins": actual_wait_time
            })
            
    if consultations:
        await db.ml_historical_consultations.insert_many(consultations)
    if queue_logs:
        await db.ml_historical_queue.insert_many(queue_logs)
        
    print(f"Generated {len(consultations)} historical consultations and wait time logs.")

if __name__ == "__main__":
    asyncio.run(generate_data())
