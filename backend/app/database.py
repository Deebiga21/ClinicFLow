import motor.motor_asyncio
from bson import ObjectId

MONGO_DETAILS = "mongodb://127.0.0.1:27017"

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)
database = client["clinicflow"]

# Utility function to parse MongoDB's _id to string
def PyObjectId(v):
    if not isinstance(v, ObjectId):
        v = ObjectId(v)
    return str(v)
