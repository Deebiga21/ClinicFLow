import datetime
import uuid
import re
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text
from database.models import ChatMessage, Notification, QueueEntry, PatientJourney, MedicineBatch, ModelVersion, Doctor, Patient, Prediction

class ChatService:
    def __init__(self, db_path='sqlite:///d:/clinic-queue -updated/core_backend/clinic_core_v2.db'):
        self.engine = create_engine(db_path)
        self.Session = sessionmaker(bind=self.engine)

    def get_messages(self, channel):
        with self.Session() as session:
            messages = session.query(ChatMessage).filter(ChatMessage.channel == channel).order_by(ChatMessage.created_at.asc()).all()
            return [{
                "id": m.id,
                "sender_id": m.sender_id,
                "sender_role": m.sender_role,
                "receiver_id": m.receiver_id,
                "channel": m.channel,
                "message": m.message,
                "message_type": m.message_type,
                "related_entity_type": m.related_entity_type,
                "related_entity_id": m.related_entity_id,
                "timestamp": m.created_at.isoformat()
            } for m in messages]

    def save_message(self, sender_id, sender_role, channel, message, message_type="text", related_entity_type=None, related_entity_id=None, receiver_id=None):
        with self.Session() as session:
            new_msg = ChatMessage(
                id=str(uuid.uuid4()),
                sender_id=sender_id,
                sender_role=sender_role,
                receiver_id=receiver_id,
                channel=channel,
                message=message,
                message_type=message_type,
                related_entity_type=related_entity_type,
                related_entity_id=related_entity_id,
                created_at=datetime.datetime.utcnow()
            )
            session.add(new_msg)
            session.commit()
            return {
                "id": new_msg.id,
                "sender_id": new_msg.sender_id,
                "sender_role": new_msg.sender_role,
                "receiver_id": new_msg.receiver_id,
                "channel": new_msg.channel,
                "message": new_msg.message,
                "message_type": new_msg.message_type,
                "related_entity_type": new_msg.related_entity_type,
                "related_entity_id": new_msg.related_entity_id,
                "timestamp": new_msg.created_at.isoformat()
            }

    def _process_ai_query(self, message, role):
        """Simulate a robust operational LLM that queries the actual database based on intent."""
        msg = message.lower()
        
        with self.Session() as session:
            # Intents
            
            # 1. Who is next? / Next patient
            if "who is next" in msg or "next patient" in msg:
                next_pt = session.query(QueueEntry).filter(QueueEntry.status == 'Waiting').order_by(QueueEntry.queue_position.asc()).first()
                if not next_pt:
                    return "There are no patients currently in the waiting queue."
                
                # Fetch prediction if exists
                pred = session.query(Prediction).filter(Prediction.patient_id == next_pt.patient_id, Prediction.prediction_type == 'waiting_time').order_by(Prediction.created_at.desc()).first()
                pred_str = f" Predicted wait is {round(pred.prediction_value)} mins." if pred else ""
                
                # Role check
                if role == "admin":
                    return f"The next patient in queue is Patient ID: {next_pt.patient_id} assigned to Doctor {next_pt.doctor_id}.{pred_str}"
                else:
                    return f"Token {next_pt.queue_position} is next. Status: Checked In. Readiness: Complete.{pred_str} Please prepare them."
                    
            # 2. How many waiting? / Queue length
            elif "waiting" in msg and ("how many" in msg or "number" in msg):
                count = session.query(QueueEntry).filter(QueueEntry.status == 'Waiting').count()
                return f"There are currently {count} patients waiting."
                
            # 3. Expiry risk / Medicine risk
            elif "expiry" in msg or "medicine" in msg:
                near_expiry = session.query(MedicineBatch).filter(MedicineBatch.expiry_date < (datetime.datetime.utcnow() + datetime.timedelta(days=30))).all()
                if not near_expiry:
                    return "No medicines are at immediate expiry risk (next 30 days)."
                
                res = "Medicines at expiry risk:\n"
                for b in near_expiry:
                    res += f"â€¢ Batch {b.batch_number} (Qty: {b.quantity}), Expiring on {b.expiry_date.strftime('%Y-%m-%d')}\n"
                return res.strip()
                
            # 4. Doctor workload / Highest workload
            elif "workload" in msg:
                doctors = session.query(QueueEntry.doctor_id).filter(QueueEntry.status.in_(['Waiting', 'In Consultation'])).all()
                if not doctors:
                    return "There is currently no active workload assigned."
                
                from collections import Counter
                counts = Counter([d[0] for d in doctors])
                top_doc = counts.most_common(1)[0]
                return f"Doctor {top_doc[0]} currently has the highest workload with {top_doc[1]} patients assigned."
                
            # 5. ML Models / Training status
            elif "models" in msg or "ml" in msg or "prediction accuracy" in msg:
                if role != "admin":
                    return "ML model statistics are restricted to the Admin role."
                models = session.query(ModelVersion).filter(ModelVersion.status == 'Active').all()
                res = "Active ML Models:\n"
                for m in models:
                    res += f"â€¢ {m.model_name} (v{m.version})\n"
                return res.strip()
                
            # 6. Patient flow / Today's flow
            elif "flow" in msg:
                completed = session.query(QueueEntry).filter(QueueEntry.status == 'Completed').count()
                waiting = session.query(QueueEntry).filter(QueueEntry.status == 'Waiting').count()
                consult = session.query(QueueEntry).filter(QueueEntry.status == 'In Consultation').count()
                return f"Today's Patient Flow: {completed} Completed, {consult} In Consultation, {waiting} Waiting."
                
            # Fallback
            else:
                return f"I didn't quite understand that operational query. I can help you with queue status, doctor workload, medicine expiry, or ML model status."


    def handle_bot_query(self, sender_id, sender_role, message):
        # Determine response based on DB
        response_text = self._process_ai_query(message, sender_role)
        
        # Save both user message and bot message to DB
        user_msg = self.save_message(sender_id, sender_role, "bot", message)
        bot_msg = self.save_message("AI_Assistant", "bot", "bot", response_text, receiver_id=sender_id)
        
        return user_msg, bot_msg
