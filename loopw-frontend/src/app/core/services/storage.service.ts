import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

export interface PresignedUrlResponse {
  upload_url: string;
  public_url: string;
  file_key: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/v1/audio/upload-url';

  /**
   * 1. Solicita la Presigned URL a la API en FastAPI
   */
  getPresignedUrl(filename: string, contentType: string = 'audio/wav'): Observable<PresignedUrlResponse> {
    return this.http.post<PresignedUrlResponse>(this.apiUrl, {
      filename,
      content_type: contentType
    });
  }

  /**
   * 2. Suba el Blob binario directamente a AWS S3 vía HTTP PUT
   */
  async uploadAudioToS3(blob: Blob, filename: string): Promise<string> {
    // Paso 1: Obtener la Presigned URL de FastAPI
    const presignedData = await firstValueFrom(
      this.getPresignedUrl(filename, blob.type || 'audio/wav')
    );

    // Paso 2: Enviar el binario de audio directo a AWS S3
    await firstValueFrom(
      this.http.put(presignedData.upload_url, blob, {
        headers: {
          'Content-Type': blob.type || 'audio/wav'
        }
      })
    );

    // Retorna la URL pública de S3
    return presignedData.public_url;
  }
}
