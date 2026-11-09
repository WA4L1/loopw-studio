from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="LoopW Audio Processing API",
    description="Backend Serverless para gestión de audios y mezclas de LoopW Studio",
    version="1.0.0"
)

# Configuración de CORS para permitir peticiones desde el frontend en Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite peticiones locales desde localhost:4200
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "LoopW Audio Processing API",
        "version": "1.0.0"
    }

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "message": "FastAPI backend running smoothly"}

@app.post("/api/v1/audio/upload-url")
def generate_upload_url(filename: str):
    # Endpoint base donde integraremos boto3 para AWS S3
    return {
        "upload_url": f"https://loopw-audio-storage.s3.amazonaws.com/uploads/{filename}?mock_token=12345",
        "file_key": f"uploads/{filename}"
    }