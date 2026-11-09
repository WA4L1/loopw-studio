import os
import boto3
import dotenv
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 1. Cargar variables de entorno desde el archivo .env
dotenv.load_dotenv()

# 2. Configuración de Variables de Entorno (Con fallback a us-east-2)
AWS_REGION = os.getenv("AWS_REGION", "us-east-2")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME", "loopw-audio-storage")

# 3. Inicialización UNIFICADA del Cliente S3 de boto3
# Al especificar endpoint_url y s3v4 se evita definitivamente el 307 Redirect y el error de CORS.
s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    endpoint_url=f"https://s3.{AWS_REGION}.amazonaws.com",
    config=Config(
        signature_version="s3v4",
        s3={"addressing_style": "virtual"}
    ),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

# 4. Configuración de FastAPI
app = FastAPI(
    title="LoopW Audio Processing API",
    description="Backend Serverless para gestión de audios y mezclas de LoopW Studio",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str = "audio/wav"

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "message": "FastAPI backend running smoothly"}

@app.post("/api/v1/audio/upload-url")
def generate_upload_url(request: PresignedUrlRequest):
    """
    Genera una URL firmada (Presigned URL) para permitir que el cliente (Angular)
    suba un archivo de audio directamente a AWS S3 mediante un método HTTP PUT.
    """
    file_key = f"loops/{request.filename}"
    
    try:
        # Generar la URL pre-firmada válida por 300 segundos (5 minutos)
        presigned_url = s3_client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": AWS_BUCKET_NAME,
                "Key": file_key,
                "ContentType": request.content_type
            },
            ExpiresIn=300
        )
        
        # URL pública explícita incluyendo la región us-east-2
        public_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{file_key}"
        
        return {
            "upload_url": presigned_url,
            "public_url": public_url,
            "file_key": file_key
        }
        
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Error generando S3 Presigned URL: {str(e)}")