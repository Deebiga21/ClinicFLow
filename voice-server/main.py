import os
import io
import torch
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from TTS.api import TTS
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model
tts_model = None
device = "cuda" if torch.cuda.is_available() else "cpu"

class SpeechRequest(BaseModel):
    text: str
    language: str = "en"

@app.on_event("startup")
def load_model():
    global tts_model
    print(f"Loading XTTS model on {device}...")
    print("WARNING: This may take 5-10 minutes on the first run as it downloads the AI models (approx 2GB).")
    try:
        # Load XTTS v2 model for zero-shot voice cloning
        tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Failed to load model: {e}")

@app.post("/synthesize")
async def synthesize_speech(req: SpeechRequest):
    if not tts_model:
        raise HTTPException(status_code=503, detail="Model is still loading or failed to load. Please wait.")
    
    reference_audio = "reference.wav"
    if not os.path.exists(reference_audio):
        raise HTTPException(
            status_code=400, 
            detail="reference.wav not found. Please record a 10-second voice sample, name it 'reference.wav', and place it in the voice-server folder."
        )

    output_file = "output.wav"
    
    try:
        # Generate speech using the reference audio to clone the voice
        print(f"Synthesizing text: '{req.text[:30]}...'")
        tts_model.tts_to_file(
            text=req.text,
            speaker_wav=reference_audio,
            language=req.language,
            file_path=output_file
        )
        
        # Read the generated file to return it as a stream
        with open(output_file, "rb") as f:
            audio_data = f.read()
            
        return StreamingResponse(io.BytesIO(audio_data), media_type="audio/wav")
    except Exception as e:
        print(f"Synthesis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
